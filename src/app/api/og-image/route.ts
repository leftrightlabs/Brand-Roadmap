import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Fetches a website's OpenGraph image (what it looks like when shared) so the
// report header can show a preview of the analyzed site. Returns { ogImage }.
// Always 200 with ogImage:null on any failure, so the client falls back to the
// placeholder gracefully.

// Basic SSRF guard: this endpoint fetches an arbitrary caller-supplied URL, so
// block loopback / private / link-local hosts and cloud metadata endpoints.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) {
    return true;
  }
  // IPv6 loopback / link-local / unique-local
  if (h === '::1' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true;
  // IPv4 literals in private / loopback / link-local ranges (incl. 169.254.169.254 metadata)
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

function pickMeta(html: string, key: string, attr: 'property' | 'name'): string | null {
  // Handle both attribute orders (key first, or content first).
  const a = html.match(new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'));
  if (a?.[1]) return a[1].trim();
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`, 'i'));
  return b?.[1]?.trim() || null;
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('url');
  if (!target) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(target);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || isBlockedHost(url.hostname)) {
      return NextResponse.json({ ogImage: null });
    }
  } catch {
    return NextResponse.json({ ogImage: null });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; BrandRoadmapBot/1.0; +https://roadmap.leftrightlabs.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return NextResponse.json({ ogImage: null });

    // og tags live in <head>; cap how much we read.
    const html = (await res.text()).slice(0, 300_000);

    const candidate =
      pickMeta(html, 'og:image:secure_url', 'property') ||
      pickMeta(html, 'og:image', 'property') ||
      pickMeta(html, 'twitter:image', 'name') ||
      pickMeta(html, 'twitter:image:src', 'name');

    if (!candidate) return NextResponse.json({ ogImage: null });

    // Resolve relative image URLs against the (possibly redirected) page URL.
    let resolved = candidate;
    try {
      resolved = new URL(candidate, res.url || url.toString()).toString();
    } catch {
      /* keep candidate as-is */
    }

    return NextResponse.json({ ogImage: resolved });
  } catch (err) {
    console.error('[OG-IMAGE] fetch failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ogImage: null });
  }
}
