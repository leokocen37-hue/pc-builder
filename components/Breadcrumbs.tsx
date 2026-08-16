// → put this at: components/Breadcrumbs.tsx
// Visible breadcrumb trail — pair with buildBreadcrumbJsonLd (lib/product-page.ts)
// for the matching structured data. Server component, no interactivity needed.
import Link from "next/link";
import type { Crumb } from "@/lib/product-page";

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="rs-breadcrumbs" aria-label="Navigacijski put">
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="rs-breadcrumb-item">
            {c.href && !isLast ? <Link href={c.href}>{c.label}</Link> : <span aria-current={isLast ? "page" : undefined}>{c.label}</span>}
            {!isLast && <span className="rs-breadcrumb-sep">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
