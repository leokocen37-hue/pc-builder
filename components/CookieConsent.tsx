// → put this at: components/CookieConsent.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_NAME = "rs_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

// Anything non-essential (analytics, marketing pixels, etc.) should check this
// before loading — e.g. `if (hasCookieConsent()) { load analytics script }`.
// Right now the site doesn't load anything non-essential, so this only gates
// future additions; the banner itself still needs to run to collect the choice.
export function hasCookieConsent(): boolean {
  if (typeof document === "undefined") return false;
  return getCookie(COOKIE_NAME) === "accepted";
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookie(COOKIE_NAME)) setVisible(true);
  }, []);

  const choose = (value: "accepted" | "rejected") => {
    setCookie(COOKIE_NAME, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Postavke kolačića">
      <p>
        Koristimo nužne kolačiće za rad stranice (npr. košarica, pristup). Detalje pronađite u našim{" "}
        <Link href="/kolacici">Pravilima o kolačićima</Link>.
      </p>
      <div className="cookie-actions">
        <button className="rs-btn" onClick={() => choose("accepted")}>Prihvaćam</button>
        <button className="rs-btn ghost" onClick={() => choose("rejected")}>Samo nužni</button>
      </div>
    </div>
  );
}
