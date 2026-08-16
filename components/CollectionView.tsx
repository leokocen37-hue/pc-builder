// → put this at: components/CollectionView.tsx
// Server component — head/tabs/subtitle are static; the interactive
// tier-filter + grid live in the CollectionGrid client island below.
import type { ProductNode } from "@/lib/collections";
import type { SectionKey } from "@/lib/product-page";
import CollectionGrid from "@/components/CollectionGrid";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { buildBreadcrumbJsonLd, type Crumb } from "@/lib/product-page";

const SITE_URL = "https://racunalo.hr";

type Tab = { label: string; href: string };

// default tab set (prebuilt PCs). Pass your own `tabs` for other sections (e.g. Periferija).
const PC_TABS = [
  { label: "Sva računala", href: "/racunala" },
  { label: "Gaming računala", href: "/racunala/gaming" },
  { label: "Radne stanice", href: "/racunala/radne-stanice" },
];

// per-page subtitles (shown under the heading). Falls back to none.
const SUBTITLES: Record<string, string> = {
  "/racunala": "Sastavljena, testirana i spremna za isporuku.",
  "/racunala/gaming": "Za visok FPS i igranje na najvišim postavkama.",
  "/racunala/radne-stanice": "Za montažu, 3D, render i profesionalni rad.",
  "/periferija": "Oprema koju bismo i sami koristili.",
  "/periferija/monitori": "Od brzih 1440p panela do 4K OLED-a.",
  "/periferija/tipkovnice": "Mehaničke, Hall-effect i custom tipkovnice.",
  "/periferija/misevi": "Lagani, precizni i bežični.",
  "/periferija/slusalice": "Vrhunski zvuk, žično i bežično.",
};

export default function CollectionView({
  heading,
  activeHref,
  products,
  kicker = "Gotova računala",
  tabs = PC_TABS,
  subtitle,
  section,
  breadcrumbs,
}: {
  heading: string;
  activeHref: string;
  products: ProductNode[];
  kicker?: string;
  tabs?: Tab[];
  subtitle?: string;
  // which top-level section this listing belongs to, so product cards link to
  // /section/kategorija/handle instead of the old flat /handle. Omitted for
  // listings that don't (yet) have a nested destination (e.g. hidden laptop pages).
  section?: SectionKey;
  breadcrumbs?: Crumb[];
}) {
  return (
    <div className="rs-root">
      <section className="rs-coll">
        <div className="rs-wrap">
          {breadcrumbs && (
            <>
              <Breadcrumbs items={breadcrumbs} />
              <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs, SITE_URL)} />
            </>
          )}
          <div className="rs-coll-head">
            {kicker && <div className="rs-kicker">{kicker}</div>}
            <h1>{heading}</h1>
            {(subtitle || SUBTITLES[activeHref]) && <p className="rs-coll-sub">{subtitle || SUBTITLES[activeHref]}</p>}
          </div>

          <CollectionGrid products={products} tabs={tabs} activeHref={activeHref} section={section} />
        </div>
      </section>
    </div>
  );
}
