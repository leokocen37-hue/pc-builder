import { notFound } from "next/navigation";

// TEMPORARILY DISABLED — this tool was reachable by anyone who guessed the
// URL, with no link to it anywhere on the site, and exposed internal
// pricing/planning info. Restore by reverting this commit (also re-adds
// public/kalkulator.html, moved to disabled-assets/ for the same reason).
export default function KalkulatorPage() {
  notFound();
}
