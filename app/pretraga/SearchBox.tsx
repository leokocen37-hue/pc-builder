"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** The query box on /pretraga. A plain form so it works without JS too. */
export default function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  return (
    <form
      className="rs-coll-tools"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/pretraga?q=${encodeURIComponent(value.trim())}`);
      }}
    >
      <div className="rs-search">
        <span className="rs-search-ic" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Naziv računala, komponente ili marke…"
          aria-label="Pretraži proizvode"
          autoFocus
        />
      </div>
      <button type="submit" className="rs-btn">Pretraži</button>
    </form>
  );
}
