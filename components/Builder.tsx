"use client";

"use client";

import { useEffect, useMemo, useState } from "react";
import { shopifyFetch } from "@/lib/shopify";

type ProductNode = {
  id: string;
  title: string;
  variants: { edges: { node: { id: string; price: { amount: string } } }[] };
  pcBrand?: { value: string } | null;
  pcSocket?: { value: string } | null;
};

type Step = "brand" | "cpu" | "motherboard" | "review";
type Brand = "intel" | "amd";

export default function Builder() {
  const [step, setStep] = useState<Step>("brand");
  const [brand, setBrand] = useState<Brand | null>(null);

  const [cpu, setCpu] = useState<ProductNode | null>(null);
  const [mb, setMb] = useState<ProductNode | null>(null);

  const [cpus, setCpus] = useState<ProductNode[]>([]);
  const [motherboards, setMotherboards] = useState<ProductNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // carousel index per step
  const [cpuIndex, setCpuIndex] = useState(0);
  const [mbIndex, setMbIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const data = await shopifyFetch<{
          products: { edges: { node: ProductNode }[] };
        }>(
          `
          query BuilderProducts($first: Int!) {
            products(first: $first) {
              edges {
                node {
                  id
                  title
                  variants(first: 1) {
                    edges { node { id price { amount } } }
                  }
                  pcBrand: metafield(namespace: "pcf", key: "brand") { value }
                  pcSocket: metafield(namespace: "pcf", key: "socket") { value }
                }
              }
            }
          }
        `,
          { first: 200 }
        );

        const all = data.products.edges.map((e) => e.node);

        // Demo heuristic:
        // CPU products have pcf.brand set
        // Motherboards have pcf.socket set but no pcf.brand
        const cpuList = all.filter((p) => !!p.pcBrand?.value);
        const mbList = all.filter((p) => !p.pcBrand?.value && !!p.pcSocket?.value);

        setCpus(cpuList);
        setMotherboards(mbList);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredCpus = useMemo(() => {
    if (!brand) return [];
    return cpus.filter((p) => p.pcBrand?.value === brand);
  }, [brand, cpus]);

  const filteredMotherboards = useMemo(() => {
    const socket = cpu?.pcSocket?.value;
    if (!socket) return [];
    return motherboards.filter((m) => m.pcSocket?.value === socket);
  }, [cpu, motherboards]);

  // Keep indices in range when lists change
  useEffect(() => {
    if (cpuIndex >= filteredCpus.length) setCpuIndex(0);
  }, [filteredCpus.length, cpuIndex]);

  useEffect(() => {
    if (mbIndex >= filteredMotherboards.length) setMbIndex(0);
  }, [filteredMotherboards.length, mbIndex]);

  const cpuPrice = cpu ? Number(cpu.variants.edges[0]?.node.price.amount ?? "0") : 0;
  const mbPrice = mb ? Number(mb.variants.edges[0]?.node.price.amount ?? "0") : 0;
  const total = cpuPrice + mbPrice;

  function back() {
    if (step === "cpu") setStep("brand");
    else if (step === "motherboard") setStep("cpu");
    else if (step === "review") setStep("motherboard");
  }

  function stepTitle() {
    if (step === "brand") return "CPU";
    if (step === "cpu") return "CPU";
    if (step === "motherboard") return "MOTHERBOARD";
    return "REVIEW";
  }

  function topRightPrice() {
    if (step === "cpu") return `€${cpuPrice.toFixed(2)}`;
    if (step === "motherboard") return `€${mbPrice.toFixed(2)}`;
    if (step === "review") return `€${total.toFixed(2)}`;
    return "€0.00";
  }

  async function checkout() {
    if (!cpu || !mb) return;

    const cpuVarId = cpu.variants.edges[0].node.id;
    const mbVarId = mb.variants.edges[0].node.id;

    const data = await shopifyFetch<{
      cartCreate: {
        cart: { checkoutUrl: string };
        userErrors: { message: string }[];
      };
    }>(
      `
      mutation CreateCart($lines: [CartLineInput!]!) {
        cartCreate(input: {
          lines: $lines,
          attributes: [
            { key: "build_type", value: "pc_configurator" },
            { key: "cpu", value: "${escapeGql(cpu.title)}" },
            { key: "motherboard", value: "${escapeGql(mb.title)}" }
          ]
        }) {
          cart { checkoutUrl }
          userErrors { message }
        }
      }
    `,
      {
        lines: [
          { merchandiseId: cpuVarId, quantity: 1 },
          { merchandiseId: mbVarId, quantity: 1 },
        ],
      }
    );

    const errors = data.cartCreate.userErrors;
    if (errors?.length) {
      alert(errors.map((e) => e.message).join("\n"));
      return;
    }

    window.location.href = data.cartCreate.cart.checkoutUrl;
  }

  // BRAND (Intel/AMD) is a simple split screen too
  if (loading) return <div style={pageWrap}><div style={panel}>Loading…</div></div>;
  if (err) return <div style={pageWrap}><div style={panel}>Error: {err}</div></div>;

  return (
    <div style={pageWrap}>
      {/* Background layer */}
      <div style={bg} />

      {/* Top bar */}
      <div style={topBar}>
        <div style={topTitle}>{stepTitle()}</div>
        <div style={topPricePill}>{topRightPrice()}</div>
      </div>

      {/* Center content */}
      <div style={centerArea}>
        {step === "brand" && (
          <div style={panel}>
            <div style={hint}>Choose CPU brand</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
              <button
                style={bigChoiceBtn}
                onClick={() => {
                  setBrand("intel");
                  setCpu(null);
                  setMb(null);
                  setCpuIndex(0);
                  setStep("cpu");
                }}
              >
                INTEL
              </button>
              <button
                style={bigChoiceBtn}
                onClick={() => {
                  setBrand("amd");
                  setCpu(null);
                  setMb(null);
                  setCpuIndex(0);
                  setStep("cpu");
                }}
              >
                AMD
              </button>
            </div>
          </div>
        )}

        {step === "cpu" && (
          <CarouselStep
            title="Select CPU"
            items={filteredCpus}
            index={cpuIndex}
            setIndex={setCpuIndex}
            selected={cpu}
            onSelect={(p) => setCpu(p)}
            subtitle={(p) => `Socket: ${(p.pcSocket?.value ?? "-").toUpperCase()}`}
            primaryText={(p) => p.title}
            onNext={() => {
              const chosen = cpu ?? filteredCpus[cpuIndex] ?? null;
              if (!chosen) return;
              setCpu(chosen);
              setMb(null);
              setMbIndex(0);
              setStep("motherboard");
            }}
            canNext={!!(cpu || filteredCpus[cpuIndex])}
            onBack={back}
            nextLabel="DALJE"
            backLabel="NAZAD"
          />
        )}

        {step === "motherboard" && (
          <CarouselStep
            title="Select Motherboard"
            items={filteredMotherboards}
            index={mbIndex}
            setIndex={setMbIndex}
            selected={mb}
            onSelect={(p) => setMb(p)}
            subtitle={(p) => `Socket: ${(p.pcSocket?.value ?? "-").toUpperCase()}`}
            primaryText={(p) => p.title}
            onNext={() => {
              const chosen = mb ?? filteredMotherboards[mbIndex] ?? null;
              if (!chosen) return;
              setMb(chosen);
              setStep("review");
            }}
            canNext={!!(mb || filteredMotherboards[mbIndex])}
            onBack={back}
            nextLabel="DALJE"
            backLabel="NAZAD"
          />
        )}

        {step === "review" && (
          <div style={panel}>
            <div style={hint}>Review</div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <ReviewRow label="Brand" value={brand?.toUpperCase() ?? "-"} />
              <ReviewRow label="CPU" value={cpu?.title ?? "-"} />
              <ReviewRow label="Motherboard" value={mb?.title ?? "-"} />
              <div style={{ height: 1, background: "rgba(255,255,255,0.15)", margin: "8px 0" }} />
              <ReviewRow label="Total" value={`€${total.toFixed(2)}`} strong />
            </div>

            <div style={bottomButtons}>
              <button style={navBtn} onClick={back}>NAZAD</button>
              <button style={nextBtn} onClick={checkout} disabled={!cpu || !mb}>
                CHECKOUT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ---------- UI building blocks ---------- */

function CarouselStep(props: {
  title: string;
  items: ProductNode[];
  index: number;
  setIndex: (n: number) => void;
  selected: ProductNode | null;
  onSelect: (p: ProductNode) => void;
  primaryText: (p: ProductNode) => string;
  subtitle: (p: ProductNode) => string;
  onNext: () => void;
  canNext: boolean;
  onBack: () => void;
  nextLabel: string;
  backLabel: string;
}) {
  const { items, index, setIndex } = props;
  const safeIndex = clamp(index, 0, Math.max(0, items.length - 1));

  useEffect(() => {
    if (safeIndex !== index) setIndex(safeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const focused = items[safeIndex];

  function prev() {
    if (!items.length) return;
    setIndex((safeIndex - 1 + items.length) % items.length);
  }
  function next() {
    if (!items.length) return;
    setIndex((safeIndex + 1) % items.length);
  }

  return (
    <div style={panel}>
      <div style={hint}>{props.title}</div>

      {/* Progress-ish bars like the screenshot (decorative) */}
      <div style={barsRow}>
        <div style={bar} />
        <div style={{ ...bar, width: 70, opacity: 0.8 }} />
        <div style={{ ...bar, width: 90, opacity: 0.6 }} />
      </div>

      <div style={carouselWrap}>
        <button style={arrowBtn} onClick={prev} aria-label="Previous">
          ‹
        </button>

        <div style={itemsStrip}>
          {items.map((p, i) => {
            const dist = Math.abs(i - safeIndex);
            const isCenter = i === safeIndex;

            // mimic the “bigger in center” look
            const scale = isCenter ? 1 : dist === 1 ? 0.85 : 0.75;
            const opacity = isCenter ? 1 : dist === 1 ? 0.85 : 0.65;

            const isSelected = props.selected?.id === p.id;

            return (
              <button
                key={p.id}
                style={{
                  ...card,
                  transform: `scale(${scale})`,
                  opacity,
                  outline: isSelected ? "2px solid rgba(255,255,255,0.9)" : "2px solid transparent",
                }}
                onClick={() => props.onSelect(p)}
                title={p.title}
              >
                {/* Fake “product image box” (replace later with real images) */}
                <div style={fakeImg}>
                  <div style={fakeImgInner} />
                </div>

                <div style={cardName}>{props.primaryText(p)}</div>
                <div style={cardSub}>{props.subtitle(p)}</div>
              </button>
            );
          })}
        </div>

        <button style={arrowBtn} onClick={next} aria-label="Next">
          ›
        </button>
      </div>

      {/* Bottom navigation buttons like screenshot */}
      <div style={bottomButtons}>
        <button style={navBtn} onClick={props.onBack}>
          {props.backLabel}
        </button>

        <button
          style={nextBtn}
          onClick={() => {
            // auto-select focused if nothing clicked yet
            if (!props.selected && focused) props.onSelect(focused);
            props.onNext();
          }}
          disabled={!props.canNext || !items.length}
        >
          {props.nextLabel}
        </button>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ opacity: 0.8 }}>{label}</div>
      <div style={{ fontWeight: strong ? 900 : 700, textAlign: "right" }}>{value}</div>
    </div>
  );
}

/** ---------- helpers ---------- */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Prevent quotes breaking GraphQL strings
function escapeGql(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** ---------- styles (match screenshot vibe) ---------- */

const pageWrap: React.CSSProperties = {
  position: "relative",
  minHeight: "80vh",
  padding: 0,
  overflow: "hidden",
  borderRadius: 18,
};

const bg: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: `
    linear-gradient(135deg,
      #1a1a1a 0%,
      #1a1a1a 48%,
      #d66a00 48%,
      #f28a00 100%
    )
  `,
};

const topBar: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px 18px",
};

const topTitle: React.CSSProperties = {
  width: "70%",
  maxWidth: 780,
  textAlign: "center",
  fontWeight: 900,
  letterSpacing: 2,
  color: "rgba(0,0,0,0.65)",
  background: "rgba(255,255,255,0.25)",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 10,
  padding: "10px 12px",
  textTransform: "uppercase",
  backdropFilter: "blur(6px)",
};

const topPricePill: React.CSSProperties = {
  position: "absolute",
  right: 18,
  top: 14,
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 900,
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.25)",
  color: "rgba(0,0,0,0.75)",
};

const centerArea: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  justifyContent: "center",
  padding: "24px 18px 26px",
};

const panel: React.CSSProperties = {
  width: "min(980px, 96vw)",
  borderRadius: 18,
  padding: 18,
  color: "white",
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.20)",
  backdropFilter: "blur(8px)",
};

const hint: React.CSSProperties = {
  fontWeight: 900,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  opacity: 0.9,
};

const bigChoiceBtn: React.CSSProperties = {
  padding: "16px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.28)",
  background: "rgba(255,255,255,0.10)",
  color: "white",
  fontWeight: 900,
  letterSpacing: 2,
  cursor: "pointer",
};

const barsRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 10,
  marginBottom: 6,
  opacity: 0.9,
};

const bar: React.CSSProperties = {
  width: 55,
  height: 4,
  borderRadius: 999,
  background: "rgba(255,255,255,0.65)",
};

const carouselWrap: React.CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "52px 1fr 52px",
  alignItems: "center",
  gap: 10,
};

const arrowBtn: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.28)",
  background: "rgba(0,0,0,0.20)",
  color: "white",
  fontSize: 28,
  fontWeight: 900,
  cursor: "pointer",
};

const itemsStrip: React.CSSProperties = {
  display: "flex",
  gap: 14,
  justifyContent: "center",
  alignItems: "center",
  overflow: "hidden",
  padding: "6px 4px",
};

const card: React.CSSProperties = {
  width: 220,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  padding: 14,
  cursor: "pointer",
  transition: "transform 120ms ease, opacity 120ms ease",
};

const fakeImg: React.CSSProperties = {
  height: 130,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(0,0,0,0.18)",
  display: "grid",
  placeItems: "center",
  marginBottom: 10,
};

const fakeImgInner: React.CSSProperties = {
  width: 90,
  height: 90,
  borderRadius: 18,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02))",
  border: "1px solid rgba(255,255,255,0.25)",
};

const cardName: React.CSSProperties = {
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  fontSize: 14,
};

const cardSub: React.CSSProperties = {
  marginTop: 6,
  opacity: 0.85,
  fontSize: 12,
};

const bottomButtons: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginTop: 18,
};

const navBtn: React.CSSProperties = {
  minWidth: 120,
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.28)",
  background: "rgba(255,255,255,0.10)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  letterSpacing: 1,
  textTransform: "uppercase",
};

const nextBtn: React.CSSProperties = {
  minWidth: 120,
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.25)",
  background: "rgba(255,255,255,0.75)",
  color: "rgba(0,0,0,0.85)",
  fontWeight: 900,
  cursor: "pointer",
  letterSpacing: 1,
  textTransform: "uppercase",
};