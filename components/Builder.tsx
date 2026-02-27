"use client";

import { useEffect, useState } from "react";
import { shopifyFetch } from "@/lib/shopify";

type ProductNode = {
  id: string;
  title: string;
  variants: { edges: { node: { id: string; price: { amount: string } } }[] };
  // Metafields (Mapped from GraphQL aliases)
  pcfType?: { value: string };
  pcfBrand?: { value: string };
  pcfSocket?: { value: string };
  pcfTdp?: { value: string };
  pcfRamType?: { value: string };
  pcfFormFactor?: { value: string };
  pcfGpuLength?: { value: string };
  pcfSupportedFormFactors?: { value: string };
  pcfMaxGpuLength?: { value: string };
  pcfMaxCoolerHeight?: { value: string };
  pcfWattage?: { value: string };
  pcfCoolerHeight?: { value: string };
  pcfMaxTdp?: { value: string };
};

type Step = "brand" | "cpu" | "motherboard" | "ram" | "gpu" | "case" | "psu" | "cooler" | "review";

const STEPS: Step[] = ["brand", "cpu", "motherboard", "ram", "gpu", "case", "psu", "cooler", "review"];

export default function Builder() {
  const [stepIndex, setStepIndex] = useState(0);
  const [products, setProducts] = useState<ProductNode[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection State
  const [brand, setBrand] = useState<string | null>(null);
  const [cpu, setCpu] = useState<ProductNode | null>(null);
  const [mb, setMb] = useState<ProductNode | null>(null);
  const [ram, setRam] = useState<ProductNode | null>(null);
  const [gpu, setGpu] = useState<ProductNode | null>(null);
  const [pcCase, setPcCase] = useState<ProductNode | null>(null);
  const [psu, setPsu] = useState<ProductNode | null>(null);
  const [cooler, setCooler] = useState<ProductNode | null>(null);

  const currentStep = STEPS[stepIndex];

  useEffect(() => {
    async function fetchInventory() {
      try {
        const data = await shopifyFetch<any>(`
          query {
            products(first: 250) {
              edges {
                node {
                  id
                  title
                  variants(first: 1) {
                    edges { node { id price { amount } } }
                  }
                  pcfType: metafield(namespace: "pcf", key: "type") { value }
                  pcfBrand: metafield(namespace: "pcf", key: "brand") { value }
                  pcfSocket: metafield(namespace: "pcf", key: "socket") { value }
                  pcfTdp: metafield(namespace: "pcf", key: "tdp") { value }
                  pcfRamType: metafield(namespace: "pcf", key: "ram_type") { value }
                  pcfFormFactor: metafield(namespace: "pcf", key: "form_factor") { value }
                  pcfGpuLength: metafield(namespace: "pcf", key: "gpu_length") { value }
                  pcfSupportedFormFactors: metafield(namespace: "pcf", key: "supported_form_factors") { value }
                  pcfMaxGpuLength: metafield(namespace: "pcf", key: "max_gpu_length") { value }
                  pcfMaxCoolerHeight: metafield(namespace: "pcf", key: "max_cooler_height") { value }
                  pcfWattage: metafield(namespace: "pcf", key: "wattage") { value }
                  pcfCoolerHeight: metafield(namespace: "pcf", key: "cooler_height") { value }
                  pcfMaxTdp: metafield(namespace: "pcf", key: "max_tdp") { value }
                }
              }
            }
          }
        `);
        setProducts(data.products.edges.map((e: any) => e.node));
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

  // --- FILTERS ---
  const filteredProducts = products.filter((p) => {
    const type = p.pcfType?.value;
    if (currentStep === "cpu") return type === "cpu" && p.pcfBrand?.value === brand;
    
    if (currentStep === "motherboard") {
      return type === "motherboard" && p.pcfSocket?.value === cpu?.pcfSocket?.value;
    }
    
    if (currentStep === "ram") {
      return type === "ram" && p.pcfRamType?.value === mb?.pcfRamType?.value;
    }
    
    if (currentStep === "gpu") return type === "gpu";
    
    if (currentStep === "case") {
      if (type !== "case" || !mb || !gpu) return false;
      const supportedMB = p.pcfSupportedFormFactors?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
      const fitsMB = supportedMB.includes((mb.pcfFormFactor?.value || "").toLowerCase());
      const fitsGPU = Number(gpu.pcfGpuLength?.value || 0) <= Number(p.pcfMaxGpuLength?.value || 0);
      return fitsMB && fitsGPU;
    }
    
    if (currentStep === "psu") {
      if (type !== "psu" || !cpu || !gpu) return false;
      const draw = Number(cpu.pcfTdp?.value || 0) + Number(gpu.pcfTdp?.value || 0) + 150;
      return Number(p.pcfWattage?.value || 0) >= draw;
    }
    
    if (currentStep === "cooler") {
      if (type !== "cooler" || !cpu || !pcCase) return false;
      const sockets = p.pcfSocket?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
      const fitsSocket = sockets.includes((cpu.pcfSocket?.value || "").toLowerCase());
      const fitsHeight = Number(p.pcfCoolerHeight?.value || 0) <= Number(pcCase.pcfMaxCoolerHeight?.value || 0);
      return fitsSocket && fitsHeight;
    }
    
    return false;
  });

  const totalPrice = () => {
    return [cpu, mb, ram, gpu, pcCase, psu, cooler].reduce(
      (sum, p) => sum + Number(p?.variants.edges[0]?.node.price.amount || 0), 0
    );
  };

  const handleCheckout = async () => {
    const items = [cpu, mb, ram, gpu, pcCase, psu, cooler].filter(Boolean) as ProductNode[];
    const lines = items.map((p) => ({
      merchandiseId: p.variants.edges[0].node.id,
      quantity: 1,
    }));

    const data = await shopifyFetch<any>(`
      mutation CreateCart($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart { checkoutUrl }
          userErrors { message }
        }
      }
    `, { lines });

    if (data.cartCreate.userErrors.length > 0) {
      alert("Checkout Error: " + data.cartCreate.userErrors[0].message);
    } else {
      window.location.href = data.cartCreate.cart.checkoutUrl;
    }
  };

  if (loading) return <div style={{ padding: 50 }}>Učitavanje komponenti...</div>;

  return (
    <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto", padding: "20px", gap: "40px", fontFamily: "sans-serif" }}>
      
      {/* LEFT: Configuration Steps */}
      <div style={{ flex: 2 }}>
        <div style={{ marginBottom: "20px", color: "#666", fontSize: "0.9rem" }}>
          Step {stepIndex + 1} of {STEPS.length}: <strong style={{ textTransform: "uppercase" }}>{currentStep}</strong>
        </div>

        {currentStep === "brand" && (
          <div>
            <h2>Odaberite platformu (CPU Brand)</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={btnStyle} onClick={() => { setBrand("intel"); setStepIndex(1); }}>Intel Build</button>
              <button style={btnStyle} onClick={() => { setBrand("amd"); setStepIndex(1); }}>AMD Build</button>
            </div>
          </div>
        )}

        {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
          <div>
            <h2>Odaberite {currentStep}</h2>
            {filteredProducts.length === 0 ? (
              <p>Nema kompatibilnih komponenti na zalihi.</p>
            ) : (
              filteredProducts.map((p) => (
                <button key={p.id} style={itemCardStyle} onClick={() => {
                  if (currentStep === "cpu") setCpu(p);
                  if (currentStep === "motherboard") setMb(p);
                  if (currentStep === "ram") setRam(p);
                  if (currentStep === "gpu") setGpu(p);
                  if (currentStep === "case") setPcCase(p);
                  if (currentStep === "psu") setPsu(p);
                  if (currentStep === "cooler") setCooler(p);
                  setStepIndex(stepIndex + 1);
                }}>
                  <span>{p.title}</span>
                  <strong>{p.variants.edges[0].node.price.amount} €</strong>
                </button>
              ))
            )}
          </div>
        )}

        {currentStep === "review" && (
          <div>
            <h2>Vaša Konfiguracija</h2>
            <p>Sve komponente su kompatibilne i spremne za slaganje.</p>
            <button onClick={handleCheckout} style={{ ...btnStyle, background: "#000", color: "#fff", width: "100%", marginTop: "20px" }}>
              Idi na plaćanje (€{totalPrice()})
            </button>
          </div>
        )}

        {stepIndex > 0 && (
          <button onClick={() => setStepIndex(stepIndex - 1)} style={{ marginTop: "40px", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            ← Povratak na prethodni korak
          </button>
        )}
      </div>

      {/* RIGHT: Build Summary Sidebar */}
      <div style={{ flex: 1, background: "#f9f9f9", padding: "20px", borderRadius: "8px", height: "fit-content" }}>
        <h3>Pregled računala</h3>
        <hr />
        <ul style={{ listStyle: "none", padding: 0 }}>
          <SummaryItem label="CPU" item={cpu} />
          <SummaryItem label="Matična" item={mb} />
          <SummaryItem label="RAM" item={ram} />
          <SummaryItem label="GPU" item={gpu} />
          <SummaryItem label="Kućište" item={pcCase} />
          <SummaryItem label="Napajanje" item={psu} />
          <SummaryItem label="Hladnjak" item={cooler} />
        </ul>
        <div style={{ marginTop: "20px", fontSize: "1.2rem" }}>
          <strong>Ukupno: {totalPrice().toFixed(2)} €</strong>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, item }: { label: string, item: ProductNode | null }) {
  return (
    <li style={{ marginBottom: "10px", fontSize: "0.9rem", color: item ? "#000" : "#999" }}>
      <strong>{label}:</strong> {item ? item.title : "Nije odabrano"}
    </li>
  );
}

const btnStyle = { padding: "15px 25px", cursor: "pointer", border: "1px solid #ddd", borderRadius: "5px", fontSize: "1rem" };
const itemCardStyle = { display: "flex", justifyContent: "space-between", width: "100%", padding: "15px", marginBottom: "10px", cursor: "pointer", border: "1px solid #eee", background: "#fff", textAlign: "left" as const };