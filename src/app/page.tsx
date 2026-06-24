// Brand Roadmap — root URL redirects to /start.
// Middleware handles this server-side; this file exists as a fallback so the
// route is type-valid and there's no 404 if middleware is bypassed somehow.
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/start');
}
