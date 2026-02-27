"use client";

import { useEffect, useState } from "react";
import { shopifyFetch } from "@/lib/shopify";

type ProductNode = {
  id: string;
  title: string;
  variants: { edges: { node: { id: string; price: { amount: string } } }[] };
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
  const [isProcessing, setIsProcessing] = useState(false);

  // Selections
  const [brand, setBrand] = useState<string | null>(null);
  const [cpu, setCpu] = useState<ProductNode | null>(null);
  const [mb, setMb] = useState<ProductNode | null>(null);
  const [ram, setRam] = useState<ProductNode | null>(null);
  const [gpu, setGpu] = useState<ProductNode | null>(null);
  const [pcCase, setPcCase] = useState<ProductNode | null>(null);
  const [psu, setPsu] = useState<ProductNode | null>(null);
  const [cooler, setCooler] = useState<ProductNode | null>(null);

  const ASSEMBLY_FEE = 200; // Fixed assembly fee in Euros

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
        console.error("Shopify Fetch Error:", err);
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
    if (currentStep === "motherboard") return type === "motherboard" && p.pcfSocket?.value === cpu?.pcfSocket?.value;
    if (currentStep === "ram") return type === "ram" && p.pcfRamType?.value === mb?.pcfRamType?.value;
    if (currentStep === "gpu") return type === "gpu";
    if (currentStep === "case") {
      if (type !== "case" || !mb || !gpu) return false;
      const supported = p.pcfSupportedFormFactors?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
      const mbFits = supported.includes((mb.pcfFormFactor?.value || "").toLowerCase());
      const gpuFits = Number(gpu.pcfGpuLength?.value || 0) <= Number(p.pcfMaxGpuLength?.value || 0);
      return mbFits && gpuFits;
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
    const componentsPrice = [cpu, mb, ram, gpu, pcCase, psu, cooler].reduce(
      (sum, p) => sum + Number(p?.variants.edges[0]?.node.price.amount || 0), 0
    );
    // Add Assembly Fee only if we are at the review stage or parts are selected
    return componentsPrice + ASSEMBLY_FEE;
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    const components = [cpu, mb, ram, gpu, pcCase, psu, cooler].filter(Boolean);
    // Add assembly fee to the description
    const summary = components.map(p => p?.title).join(", ") + " | + Usluga slaganja (200€)";
    const price = totalPrice();

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalPrice: price,
          summary: summary
        }),
      });

      const data = await res.json();

      if (data.draftOrder?.invoiceUrl) {
        window.location.href = data.draftOrder.invoiceUrl;
      } else {
        alert("Greška: " + (data.error || "Došlo je do greške."));
        setIsProcessing(false);
      }
    } catch (error) {
      alert("Serverska greška.");
      setIsProcessing(false);
    }
  };

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Učitavanje...</div>;

  return (
    <div style={{ display: "flex", maxWidth: "1200px", margin: "40px auto", gap: "40px", padding: "0 20px", fontFamily: "sans-serif" }}>
      
      {/* Configuration Area */}
      <div style={{ flex: 2 }}>
        <div style={{ marginBottom: "15px", fontWeight: "bold", color: "#007bff" }}>
          KORAK {stepIndex + 1} / {STEPS.length}
        </div>

        {currentStep === "brand" && (
          <div>
            <h1>Započnite konfiguraciju</h1>
            <div style={{ display: "flex", gap: "20px" }}>
              <button style={brandBtnStyle} onClick={() => { setBrand("intel"); setStepIndex(1); }}>Intel Build</button>
              <button style={brandBtnStyle} onClick={() => { setBrand("amd"); setStepIndex(1); }}>AMD Build</button>
            </div>
          </div>
        )}

        {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
          <div>
            <h1 style={{ textTransform: "capitalize" }}>Odaberite {currentStep}</h1>
            {filteredProducts.map((p) => (
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
            ))}
          </div>
        )}

        {currentStep === "review" && (
          <div style={{ textAlign: "center", padding: "40px", background: "#f8f9fa", borderRadius: "15px" }}>
            <h1>PC je spreman!</h1>
            <p>U cijenu je uključena usluga profesionalnog slaganja i testiranja (200 €).</p>
            <button 
              disabled={isProcessing}
              onClick={handleCheckout} 
              style={{ ...checkoutBtnStyle, opacity: isProcessing ? 0.7 : 1 }}
            >
              {isProcessing ? "Obrađujem..." : `Završi i plati — ${totalPrice().toFixed(2)} €`}
            </button>
          </div>
        )}

        {stepIndex > 0 && (
          <button onClick={() => setStepIndex(stepIndex - 1)} style={{ marginTop: "30px", background: "none", border: "none", color: "#888", cursor: "pointer" }}>
            ← Natrag
          </button>
        )}
      </div>

      {/* Sidebar Summary */}
      <div style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: "16px", padding: "25px", backgroundColor: "#fff" }}>
        <h3>Pregled konfiguracije</h3>
        <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <SidebarRow label="Procesor" val={cpu?.title} />
          <SidebarRow label="Matična" val={mb?.title} />
          <SidebarRow label="Memorija" val={ram?.title} />
          <SidebarRow label="Grafička" val={gpu?.title} />
          <SidebarRow label="Kućište" val={pcCase?.title} />
          <SidebarRow label="Napajanje" val={psu?.title} />
          <SidebarRow label="Hladnjak" val={cooler?.title} />
          <div style={{ display: "flex", justifyContent: "space-between", color: "#28a745", fontWeight: "bold" }}>
            <span>Usluga slaganja:</span>
            <span>{ASSEMBLY_FEE} €</span>
          </div>
        </div>
        <hr style={{ margin: "20px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "20px" }}>
          <span>Ukupno:</span>
          <span>{totalPrice().toFixed(2)} €</span>
        </div>
      </div>
    </div>
  );
}

function SidebarRow({ label, val }: { label: string; val?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "#888" }}>{label}:</span>
      <span style={{ textAlign: "right", maxWidth: "150px" }}>{val || "—"}</span>
    </div>
  );
}

const brandBtnStyle = { flex: 1, padding: "20px", cursor: "pointer", border: "1px solid #ddd", borderRadius: "10px", background: "white", fontSize: "18px" };
const checkoutBtnStyle = { width: "100%", padding: "20px", cursor: "pointer", border: "none", background: "#000", color: "white", fontWeight: "bold", borderRadius: "10px", fontSize: "18px" };
const itemCardStyle = { display: "flex", justifyContent: "space-between", width: "100%", padding: "15px", marginBottom: "10px", cursor: "pointer", border: "1px solid #eee", background: "#fff", borderRadius: "8px" };