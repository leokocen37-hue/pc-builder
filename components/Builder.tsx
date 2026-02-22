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

type BuilderData = {
  products: ProductNode[];
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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // We fetch products by querying metafields pc.brand and pc.socket.
        // For this demo we simply load a bunch and then filter in the UI.
        const data = await shopifyFetch<{
          products: {
            edges: { node: ProductNode }[];
          };
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
          { first: 100 }
        );

        const all = data.products.edges.map((e) => e.node);

        // Simple heuristic for demo:
        // - CPU products have pc.brand set (intel/amd)
        // - Motherboards have pc.socket set but no pc.brand
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

  const total = useMemo(() => {
    const cpuPrice = cpu?.variants.edges[0]?.node.price.amount ? Number(cpu.variants.edges[0].node.price.amount) : 0;
    const mbPrice = mb?.variants.edges[0]?.node.price.amount ? Number(mb.variants.edges[0].node.price.amount) : 0;
    return cpuPrice + mbPrice;
  }, [cpu, mb]);

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
            { key: "build_type", value: "pc_configurator_demo" },
            { key: "cpu", value: "${cpu.title}" },
            { key: "motherboard", value: "${mb.title}" }
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

  function back() {
    if (step === "cpu") setStep("brand");
    if (step === "motherboard") setStep("cpu");
    if (step === "review") setStep("motherboard");
  }

  if (loading) return <div style={box}>Loading products…</div>;
  if (err) return <div style={box}>Error: {err}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Configurator (Demo)</h1>
          <p style={{ margin: "6px 0 0", opacity: 0.8 }}>
            Intel/AMD → CPU → Motherboard filtered by socket → Shopify checkout
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill active={step === "brand"}>Brand</Pill>
          <Pill active={step === "cpu"}>CPU</Pill>
          <Pill active={step === "motherboard"}>Motherboard</Pill>
          <Pill active={step === "review"}>Review</Pill>
        </div>
      </div>

      {step === "brand" && (
        <div style={card}>
          <h2 style={{ margin: 0 }}>Choose brand</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <button style={btn} onClick={() => { setBrand("intel"); setCpu(null); setMb(null); setStep("cpu"); }}>
              Intel
            </button>
            <button style={btn} onClick={() => { setBrand("amd"); setCpu(null); setMb(null); setStep("cpu"); }}>
              AMD
            </button>
          </div>
        </div>
      )}

      {step === "cpu" && (
        <div style={card}>
          <h2 style={{ margin: 0 }}>Choose CPU ({brand?.toUpperCase()})</h2>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredCpus.map((p) => (
              <button key={p.id} style={row} onClick={() => { setCpu(p); setMb(null); setStep("motherboard"); }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 800 }}>{p.title}</div>
                  <div style={{ opacity: 0.75, fontSize: 13 }}>
                    Socket: {p.pcSocket?.value?.toUpperCase() ?? "-"}
                  </div>
                </div>
                <div style={{ fontWeight: 900 }}>
                  €{Number(p.variants.edges[0]?.node.price.amount ?? "0").toFixed(2)}
                </div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <button style={secondary} onClick={back}>Back</button>
          </div>
        </div>
      )}

      {step === "motherboard" && (
        <div style={card}>
          <h2 style={{ margin: 0 }}>Choose Motherboard ({cpu?.pcSocket?.value?.toUpperCase()})</h2>
          <p style={{ margin: "8px 0 0", opacity: 0.8 }}>Filtered by CPU socket.</p>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredMotherboards.map((p) => (
              <button key={p.id} style={row} onClick={() => { setMb(p); setStep("review"); }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 800 }}>{p.title}</div>
                  <div style={{ opacity: 0.75, fontSize: 13 }}>
                    Socket: {p.pcSocket?.value?.toUpperCase() ?? "-"}
                  </div>
                </div>
                <div style={{ fontWeight: 900 }}>
                  €{Number(p.variants.edges[0]?.node.price.amount ?? "0").toFixed(2)}
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <button style={secondary} onClick={back}>Back</button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div style={card}>
          <h2 style={{ margin: 0 }}>Review</h2>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <Line label="Brand" value={brand?.toUpperCase() ?? "-"} />
            <Line label="CPU" value={cpu?.title ?? "-"} />
            <Line label="Motherboard" value={mb?.title ?? "-"} />
            <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />
            <Line label="Total" value={`€${total.toFixed(2)}`} strong />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <button style={secondary} onClick={back}>Back</button>
            <button style={primary} onClick={checkout} disabled={!cpu || !mb}>
              Checkout (Shopify)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #ddd",
        background: active ? "#111" : "white",
        color: active ? "white" : "#111",
        fontWeight: 900,
        fontSize: 12,
      }}
    >
      {children}
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ opacity: 0.75 }}>{label}</div>
      <div style={{ fontWeight: strong ? 900 : 700, textAlign: "right" }}>{value}</div>
    </div>
  );
}

const card: React.CSSProperties = { border: "1px solid #eee", borderRadius: 16, padding: 16, background: "white" };
const box: React.CSSProperties = { border: "1px solid #eee", borderRadius: 16, padding: 16, background: "white" };

const btn: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: "1px solid #ddd",
  background: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const row: React.CSSProperties = {
  width: "100%",
  border: "1px solid #eee",
  background: "white",
  borderRadius: 14,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
};

const secondary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const primary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};