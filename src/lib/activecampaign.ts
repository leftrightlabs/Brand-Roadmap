/**
 * Server-side ActiveCampaign v3 REST helper for the Brand Roadmap upsell flow.
 *
 * The funnel needs AC contacts tagged so a small number of automations can
 * branch on them:
 *   - priority pillar  → which drip track (Get Clear / Get Noticed / Get Paid)
 *   - paid vs. unpaid  → upsell the workshop (paid) vs. nudge the $97 (unpaid)
 *
 * A few custom fields are also written so the drip emails can merge in the
 * founder's specific language (their start-here area, the one-line nudge, and
 * a deep link back to their report) without writing nine separate sequences.
 *
 * Everything here is best-effort: callers fire-and-forget and never let an AC
 * failure break report generation. All functions swallow errors and log them.
 */

const ACCOUNT = process.env.ACTIVECAMPAIGN_ACCOUNT;
const API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;
const LIST_ID = process.env.ACTIVECAMPAIGN_LIST_ID;

// ── Tag vocabulary (the contract between this app and AC automations) ────────
export const AC_TAGS = {
  completed: 'roadmap-report-completed',
  paid: 'roadmap-paid',
  unpaid: 'roadmap-unpaid',
  pillar: {
    getClear: 'roadmap-priority-get-clear',
    getNoticed: 'roadmap-priority-get-noticed',
    getPaid: 'roadmap-priority-get-paid',
  } as Record<string, string>,
};

// ── Custom field titles (auto-created if missing; merge with %FIELD_NAME%) ───
const AC_FIELDS: { key: string; title: string; type: 'text' | 'textarea' }[] = [
  { key: 'priority', title: 'Brand Roadmap Priority', type: 'text' },
  { key: 'startHere', title: 'Brand Roadmap Start Here', type: 'text' },
  { key: 'nudge', title: 'Brand Roadmap Nudge', type: 'textarea' },
  { key: 'url', title: 'Brand Roadmap URL', type: 'text' },
  { key: 'paid', title: 'Brand Roadmap Paid', type: 'text' },
];

export function acEnabled(): boolean {
  return Boolean(ACCOUNT && API_KEY);
}

function base(): string {
  return `https://${ACCOUNT}.api-us1.com/api/3`;
}

// AC enforces ~5 requests/second per account. A completed-report sync fires a
// burst (create fields + sync contact + several tags), so we serialize calls
// with a minimum gap and retry on 429. This runs in the background, so the
// added latency is invisible to the user.
const MIN_GAP_MS = 250;
let acChain: Promise<void> = Promise.resolve();

function nextSlot(): Promise<void> {
  const run = acChain.then(() => new Promise<void>((r) => setTimeout(r, MIN_GAP_MS)));
  acChain = run.catch(() => {});
  return run;
}

async function acRaw<T>(path: string, method: string, body?: unknown): Promise<T | null> {
  await nextSlot();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${base()}${path}`, {
        method,
        headers: { 'Api-Token': API_KEY as string, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after')) || 1;
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`[AC] ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      console.error(`[AC] ${method} ${path} threw:`, err);
      return null;
    }
  }
  console.error(`[AC] ${method} ${path} → gave up after 429 retries`);
  return null;
}

async function ac<T = any>(path: string, method: string, body?: unknown): Promise<T | null> {
  if (!acEnabled()) return null;
  return acRaw<T>(path, method, body);
}

// ── Caches (warm server keeps these across requests) ─────────────────────────
const tagIdCache = new Map<string, string>();
const fieldIdCache = new Map<string, string>();

async function findOrCreateTag(name: string): Promise<string | null> {
  if (tagIdCache.has(name)) return tagIdCache.get(name) as string;
  const found = await ac<{ tags?: { id: string; tag: string }[] }>(
    `/tags?search=${encodeURIComponent(name)}`,
    'GET'
  );
  const exact = found?.tags?.find((t) => t.tag === name);
  if (exact) {
    tagIdCache.set(name, exact.id);
    return exact.id;
  }
  const created = await ac<{ tag?: { id: string } }>('/tags', 'POST', {
    tag: { tag: name, tagType: 'contact', description: 'Brand Roadmap' },
  });
  if (created?.tag?.id) {
    tagIdCache.set(name, created.tag.id);
    return created.tag.id;
  }
  return null;
}

async function resolveFieldIds(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  // One list fetch covers all fields.
  const list = await ac<{ fields?: { id: string; title: string }[] }>('/fields?limit=100', 'GET');
  const byTitle = new Map((list?.fields ?? []).map((f) => [f.title, f.id]));
  for (const f of AC_FIELDS) {
    const cached = fieldIdCache.get(f.key);
    if (cached) { out[f.key] = cached; continue; }
    let id = byTitle.get(f.title);
    if (!id) {
      const created = await ac<{ field?: { id: string } }>('/fields', 'POST', {
        field: { type: f.type, title: f.title, descript: 'Brand Roadmap', visible: 1 },
      });
      id = created?.field?.id;
    }
    if (id) { fieldIdCache.set(f.key, id); out[f.key] = id; }
  }
  return out;
}

/** Upsert a contact by email; returns the AC contact id. */
async function syncContact(
  email: string,
  firstName: string,
  lastName: string,
  fieldValues: { field: string; value: string }[]
): Promise<string | null> {
  const res = await ac<{ contact?: { id: string } }>('/contact/sync', 'POST', {
    contact: { email, firstName, lastName, fieldValues },
  });
  const id = res?.contact?.id ?? null;
  if (id && LIST_ID) {
    // Ensure they're on the configured list (status 1 = subscribed).
    await ac('/contactLists', 'POST', {
      contactList: { list: LIST_ID, contact: id, status: 1 },
    });
  }
  return id;
}

async function addTag(contactId: string, tagName: string): Promise<void> {
  const tagId = await findOrCreateTag(tagName);
  if (!tagId) return;
  await ac('/contactTags', 'POST', { contactTag: { contact: contactId, tag: tagId } });
}

async function removeTag(contactId: string, tagName: string): Promise<void> {
  const tagId = await findOrCreateTag(tagName);
  if (!tagId) return;
  const list = await ac<{ contactTags?: { id: string; tag: string }[] }>(
    `/contacts/${contactId}/contactTags`,
    'GET'
  );
  const assoc = list?.contactTags?.find((ct) => ct.tag === tagId);
  if (assoc) await ac(`/contactTags/${assoc.id}`, 'DELETE');
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = (name || '').trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}

export interface RoadmapContactSync {
  email: string;
  name: string;
  /** Tag key: 'getClear' | 'getNoticed' | 'getPaid'. */
  priorityPillarKey: string;
  /** Human label, e.g. "Get Noticed". */
  priorityPillarLabel: string;
  /** Human label of the start-here area, e.g. "Visual positioning". */
  startHereArea: string;
  /** The one-line directional nudge from the report. */
  nudge: string;
  /** Deep link back to the report. */
  reportUrl: string;
  paid: boolean;
}

/**
 * Sync a completed roadmap to AC: upsert the contact, write the custom fields,
 * and apply the priority-pillar + paid/unpaid + completed tags. Best-effort.
 */
export async function syncRoadmapContact(data: RoadmapContactSync): Promise<void> {
  if (!acEnabled()) return;
  try {
    const fields = await resolveFieldIds();
    const { firstName, lastName } = splitName(data.name);
    const fieldValues: { field: string; value: string }[] = [];
    const push = (key: string, value: string) => {
      if (fields[key]) fieldValues.push({ field: fields[key], value });
    };
    push('priority', data.priorityPillarLabel);
    push('startHere', data.startHereArea);
    push('nudge', data.nudge);
    push('url', data.reportUrl);
    push('paid', data.paid ? 'yes' : 'no');

    const contactId = await syncContact(data.email, firstName, lastName, fieldValues);
    if (!contactId) return;

    await addTag(contactId, AC_TAGS.completed);
    const pillarTag = AC_TAGS.pillar[data.priorityPillarKey];
    if (pillarTag) await addTag(contactId, pillarTag);
    if (data.paid) {
      await addTag(contactId, AC_TAGS.paid);
      await removeTag(contactId, AC_TAGS.unpaid);
    } else {
      await addTag(contactId, AC_TAGS.unpaid);
    }
  } catch (err) {
    console.error('[AC] syncRoadmapContact failed:', err);
  }
}

/**
 * Flip a contact from unpaid → paid. Call this from the Stripe webhook when a
 * purchase is confirmed. Best-effort.
 */
export async function markRoadmapPaid(email: string): Promise<void> {
  if (!acEnabled()) return;
  try {
    const fields = await resolveFieldIds();
    const fieldValues = fields.paid ? [{ field: fields.paid, value: 'yes' }] : [];
    const contactId = await syncContact(email, '', '', fieldValues);
    if (!contactId) return;
    await addTag(contactId, AC_TAGS.paid);
    await removeTag(contactId, AC_TAGS.unpaid);
  } catch (err) {
    console.error('[AC] markRoadmapPaid failed:', err);
  }
}
