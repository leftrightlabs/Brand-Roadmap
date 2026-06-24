// This route is no longer part of the primary flow. Redirect anyone who
// lands here (bookmarks, old links) back to the unified intake form.
import { redirect } from "next/navigation";

export default function WebsiteInputRedirect() {
  redirect("/start/info");
}
