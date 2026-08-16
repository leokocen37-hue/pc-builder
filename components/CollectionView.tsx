// → put this at: components/CollectionView.tsx
// Server component — head/tabs/subtitle are static; the interactive
// tier-filter + grid live in the CollectionGrid client island below.
import type { ProductNode } from "@/lib/collections";
import CollectionGrid from "@/components/CollectionGrid";

type Tab = { label: string; href: string };

// default tab set (prebuilt PCs). Pass your own `tabs` for other sections (e.g. Periferija).
const PC_TABS = [
  { label: "Sva računala", href: "/gotova-racunala" },
  { label: "Gaming računala", href: "/gaming-racunala" },
  { label: "Radne stanice", href: "/radne-stanice" },
];

// per-page subtitles (shown under the heading). Falls back to none.
const SUBTITLES: Record<string, string> = {
  "/gotova-racunala": "Sastavljena, testirana i spremna za isporuku.",
  "/gaming-racunala": "Za visok FPS i igranje na najvišim postavkama.",
  "/radne-stanice": "Za montažu, 3D, render i profesionalni rad.",
  "/periferija": "Oprema koju bismo i sami koristili.",
  "/monitori": "Od brzih 1440p panela do 4K OLED-a.",
  "/tipkovnice": "Mehaničke, Hall-effect i custom tipkovnice.",
  "/misevi": "Lagani, precizni i bežični.",
  "/slusalice": "Vrhunski zvuk, žično i bežično.",
};

export default function CollectionView({
  heading,
  activeHref,
  products,
  kicker = "Gotova računala",
  tabs = PC_TABS,
  subtitle,
}: {
  heading: string;
  activeHref: string;
  products: ProductNode[];
  kicker?: string;
  tabs?: Tab[];
  subtitle?: string;
}) {
  return (
    <div className="rs-root">
      <section className="rs-coll">
        <div className="rs-wrap">
          <div className="rs-coll-head">
            {kicker && <div className="rs-kicker">{kicker}</div>}
            <h1>{heading}</h1>
            {(subtitle || SUBTITLES[activeHref]) && <p className="rs-coll-sub">{subtitle || SUBTITLES[activeHref]}</p>}
          </div>

          <CollectionGrid products={products} tabs={tabs} activeHref={activeHref} />
        </div>
      </section>
    </div>
  );
}
