// → put this at:  app/zakljucano/page.tsx
"use client";

import { useState } from "react";

export default function LockScreen() {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        // reload → middleware now sees the cookie and lets you in
        window.location.href = "/";
      } else {
        setError(true);
        setBusy(false);
      }
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#07080c", color: "#f3f4f8", fontFamily: "'Space Grotesk',system-ui,sans-serif", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "380px", textAlign: "center" }}>
        <div style={{ fontSize: "34px", marginBottom: "18px" }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: "24px", letterSpacing: "-.5px", marginBottom: "8px" }}>
          RAČUNALO<span style={{ color: "#d81fd8" }}>.hr</span>
        </div>
        <p style={{ color: "#9aa0b0", fontSize: "14px", lineHeight: 1.6, marginBottom: "26px" }}>
          Stranica je u izradi. Unesite lozinku za pristup.
        </p>
        <form onSubmit={submit}>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Lozinka"
            autoFocus
            style={{
              width: "100%", background: "#11131b", border: `1px solid ${error ? "#ff6a82" : "rgba(255,255,255,.16)"}`,
              borderRadius: "12px", padding: "14px 16px", color: "#fff", fontSize: "15px", textAlign: "center",
              outline: "none", marginBottom: "12px", fontFamily: "inherit",
            }}
          />
          {error && <div style={{ color: "#ff9caa", fontSize: "13px", marginBottom: "12px" }}>Netočna lozinka.</div>}
          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%", background: "linear-gradient(135deg,#d81fd8,#7b2ff7)", color: "#fff",
              fontWeight: 700, fontSize: "15px", padding: "14px", borderRadius: "12px", border: "none",
              cursor: "pointer", fontFamily: "inherit", opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Provjeravam…" : "Uđi"}
          </button>
        </form>
      </div>
    </div>
  );
}