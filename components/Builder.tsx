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

  // --- COMPATIBILITY FILTERS ---
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
      const required = Number(cpu.pcfTdp?.value || 0) + Number(gpu.pcfTdp?.value || 0) + 150;
      return Number(p.pcfWattage?.value || 0) >= required;
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

  // --- PROFESSIONAL DRAFT ORDER CHECKOUT ---
  const handleCheckout = async () => {
    setIsProcessing(true);
    const components = [cpu, mb, ram, gpu, pcCase, psu, cooler].filter(Boolean);
    const summary = components.map(p => p?.title).join(", ");
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
        // Redirect to Shopify Checkout
        window.location.href = data.draftOrder.invoiceUrl;
      } else {
        const errorMsg = data.userErrors?.[0]?.message || data.error || "Došlo je do greške.";
        alert("Greška: " + errorMsg);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Checkout Request Failed", error);
      alert("Serverska greška pri kreiranju narudžbe.");
      setIsProcessing(false);
    }
  };

  if (loading) return <div style={{ padding: "100px", textAlign: "center", fontSize: "20px" }}>Učitavanje komponenti...</div>;

  return (
    <div style={{ display: "flex", maxWidth: "1200px", margin: "40px auto", gap: "40px", padding: "0 20px", fontFamily: "sans-serif" }}>
      
      {/* Configuration Area */}
      <div style={{ flex: 2 }}>
        <div style={{ marginBottom: "15px", fontWeight: "bold", color: "#007bff", letterSpacing: "1px" }}>
          KORAK {stepIndex + 1} / {STEPS.length}
        </div>

        {currentStep === "brand" && (
          <div>
            <h1 style={{ fontSize: "32px", marginBottom: "30px" }}>Započnite svoju konfiguraciju</h1>
            <p style={{ marginBottom: "20px", color: "#666" }}>Odaberite platformu procesora:</p>
            <div style={{ display: "flex", gap: "20px" }}>
              <button style={brandBtnStyle} onClick={() => { setBrand("intel"); setStepIndex(1); }}>
                <div style={{ fontSize: "20px" }}>Intel Core</div>
                <div style={{ fontWeight: "normal", fontSize: "14px", marginTop: "5px" }}>LGA1700 Platforma</div>
              </button>
              <button style={brandBtnStyle} onClick={() => { setBrand("amd"); setStepIndex(1); }}>
                <div style={{ fontSize: "20px" }}>AMD Ryzen</div>
                <div style={{ fontWeight: "normal", fontSize: "14px", marginTop: "5px" }}>AM5 Platforma</div>
              </button>
            </div>
          </div>
        )}

        {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
          <div>
            <h1 style={{ fontSize: "28px", marginBottom: "25px", textTransform: "capitalize" }}>Odaberite {currentStep}</h1>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: "40px", border: "1px dashed #ccc", textAlign: "center" }}>
                <p>Nažalost, trenutno nemamo kompatibilnih dijelova za vaš odabir.</p>
                <button onClick={() => setStepIndex(stepIndex - 1)} style={{ color: "#007bff", background: "none", border: "none", cursor: "pointer" }}>Vratite se korak natrag</button>
              </div>
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
                  <span style={{ fontWeight: "500" }}>{p.title}</span>
                  <strong style={{ color: "#28a745" }}>{p.variants.edges[0].node.price.amount} €</strong>
                </button>
              ))
            )}
          </div>
        )}

        {currentStep === "review" && (
          <div style={{ textAlign: "center", padding: "40px", background: "#f8f9fa", borderRadius: "15px" }}>
            <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Vaše računalo je spremno!</h1>
            <p style={{ color: "#666", marginBottom: "40px" }}>Provjerite popis komponenti u desnom stupcu prije narudžbe.</p>
            <button 
              disabled={isProcessing}
              onClick={handleCheckout} 
              style={{ ...checkoutBtnStyle, opacity: isProcessing ? 0.7 : 1 }}
            >
              {isProcessing ? "Obrađujem..." : `Naruči Konfiguraciju — ${totalPrice().toFixed(2)} €`}
            </button>
          </div>
        )}

        {stepIndex > 0 && (
          <button 
            onClick={() => setStepIndex(stepIndex - 1)} 
            style={{ marginTop: "40px", background: "none", border: "none", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
          >
            ← Natrag na {STEPS[stepIndex - 1]}
          </button>
        )}
      </div>

      {/* Sidebar Summary */}
      <div style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: "16px", padding: "30px", height: "fit-content", backgroundColor: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "20px" }}>Pregled Builda</h3>
        <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "15px" }}>
          <SidebarRow label="Procesor" val={cpu?.title} />
          <SidebarRow label="Matična Ploča" val={mb?.title} />
          <SidebarRow label="Radna Memorija" val={ram?.title} />
          <SidebarRow label="Grafička Kartica" val={gpu?.title} />
          <SidebarRow label="Kućište" val={pcCase?.title} />
          <SidebarRow label="Napajanje" val={psu?.title} />
          <SidebarRow label="Hladnjak" val={cooler?.title} />
        </div>
        <hr style={{ margin: "25px 0", border: "0", borderTop: "1px solid #eee" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "22px", color: "#333" }}>
          <span>Ukupno:</span>
          <span>{totalPrice().toFixed(2)} €</span>
        </div>
        <p style={{ fontSize: "12px", color: "#999", marginTop: "15px", textAlign: "center" }}>PDV uključen u cijenu</p>
      </div>
    </div>
  );
}

function SidebarRow({ label, val }: { label: string; val?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ color: "#aaa", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }}>{label}</span>
      <span style={{ color: val ? "#333" : "#ccc", fontWeight: val ? "500" : "normal" }}>{val || "—"}</span>
    </div>
  );
}

const brandBtnStyle = { flex: 1, padding: "30px", cursor: "pointer", border: "2px solid #e0e0e0", background: "white", fontWeight: "bold", borderRadius: "12px", transition: "all 0.2s" };
const checkoutBtnStyle = { width: "100%", padding: "24px", cursor: "pointer", border: "none", background: "#000", color: "white", fontWeight: "bold", borderRadius: "12px", fontSize: "20px", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" };
const itemCardStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "20px", marginBottom: "12px", cursor: "pointer", border: "1px solid #eee", background: "#fff", borderRadius: "10px", fontSize: "16px", textAlign: "left" as const, transition: "transform 0.1s" };