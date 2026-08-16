// → put this at: components/ProductNotFound.tsx
// Product-specific 404 — distinct from the generic app/not-found.tsx. Rendered
// via segment-scoped not-found.tsx files so a missing/mismatched product still
// returns a real 404 status, but with product-specific copy instead of the
// generic "Stranica nije pronađena".
import Link from "next/link";

export default function ProductNotFound({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <div className="rs-root">
      <section className="rs-pdp">
        <div className="rs-wrap" style={{ textAlign: "center", padding: "80px 0" }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Proizvod nije pronađen</h1>
          <p style={{ color: "var(--muted)", marginBottom: 24 }}>Možda je uklonjen ili je poveznica netočna.</p>
          <Link href={backHref} className="rs-btn">{backLabel}</Link>
        </div>
      </section>
    </div>
  );
}
