import type { Metadata } from "next";
import LockScreenClient from "./LockScreenClient";

// this is the password gate the middleware rewrites *every* URL to while the
// site is locked — must never be indexed under its own URL or any other.
export const metadata: Metadata = {
  title: "Stranica je u izradi",
  robots: { index: false, follow: false },
};

export default function LockScreen() {
  return <LockScreenClient />;
}
