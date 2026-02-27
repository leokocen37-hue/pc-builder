"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { shopifyFetch } from "@/lib/shopify";
import { useSearchParams, useRouter } from "next/navigation";

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

// This is the main component logic
function BuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [products, setProducts] = useState<ProductNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [brand, setBrand] = useState<string | null>(null);
  const [cpu, setCpu] = useState<ProductNode | null>(null);
  const [mb, setMb] = useState<ProductNode | null>(null);
  const [ram, setRam] = useState<ProductNode | null>(null);
  const [gpu, setGpu] = useState<ProductNode | null>(null);
  const [pcCase, setPcCase] = useState<ProductNode | null>(null);
  const [psu, setPsu] = useState<ProductNode | null>(null);
  const [cooler, setCooler] = useState<ProductNode | null>(null);

  const ASSEMBLY_FEE = 200;

  const updateURL = useCallback((selections: any) => {
    const params = new URLSearchParams();
    if (selections.brand) params.set("brand", selections.brand);
    if (selections.cpu?.id) params.set("cpu", selections.cpu.id);
    if (selections.mb?.id) params.set("mb", selections.mb.id);
    if (selections.ram?.id) params.set("ram", selections.ram.id);
    if (selections.gpu?.id) params.set("gpu", selections.gpu.id);
    if (selections.pcCase?.id) params.set("case", selections.pcCase.id);
    if (selections.psu?.id) params.set("psu", selections.psu.id);
    if (selections.cooler?.id) params.set("cooler", selections.cooler.id);
    
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    async function fetchAndSync() {
      try {
        const data = await shopifyFetch<any>(`
          query {
            products(first: 250) {
              edges {
                node {
                  id
                  title
                  variants(first: 1) { edges { node { id price { amount } } } }
                  pcfType: metafield(namespace: "pcf", key: "type") { value }
                  pcfBrand: metafield(namespace: "pcf", key: "brand") { value }
                  pcfSocket: metafield(namespace: "pcf", key: "socket") { value }
                  pcfTdp: metafield(namespace: "pcf", key: "tdp") { value }
                  pcfRamType: metafield(namespace: "pcf", key: "ram_type") { value }
                  pcfFormFactor: metafield(namespace: "pcf", key: "form_factor") { value }
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
        const allProducts = data.products.edges.map((e: any) => e.node);
        setProducts(allProducts);

        const urlBrand = searchParams.get("brand");
        if (urlBrand) setBrand(urlBrand);

        const urlCpu = allProducts.find((p: any) => p.id === searchParams.get("cpu"));
        const urlMb = allProducts.find((p: any) => p.id === searchParams.get("mb"));
        const urlRam = allProducts.find((p: any) => p.id === searchParams.get("ram"));
        const urlGpu = allProducts.find((p: any) => p.id === searchParams.get("gpu"));
        const urlCase = allProducts.find((p: any) => p.id === searchParams.get("case"));
        const urlPsu = allProducts.find((p: any) => p.id === searchParams.get("psu"));
        const urlCooler = allProducts.find((p: any) => p.id === searchParams.get("cooler"));

        if (urlCpu) setCpu(urlCpu);
        if (urlMb) setMb(urlMb);
        if (urlRam) setRam(urlRam);
        if (urlGpu) setGpu(urlGpu);
        if (urlCase) setPcCase(urlCase);
        if (urlPsu) setPsu(urlPsu);
        if (urlCooler) setCooler(urlCooler);

        if (urlCpu) setStepIndex(STEPS.indexOf("review"));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAndSync();
  }, [searchParams]);

  const handleSelection = (type: string, p: ProductNode) => {
    let nextCpu = cpu, nextMb = mb, nextRam = ram, nextGpu = gpu, nextCase = pcCase, nextPsu = psu, nextCooler = cooler;

    if (type === "cpu") { setCpu(p); nextCpu = p; }
    if (type === "mb") { setMb(p); nextMb = p; }
    if (type === "ram") { setRam(p); nextRam = p; }
    if (type === "gpu") { setGpu(p); nextGpu = p; }
    if (type === "pcCase") { setPcCase(p); nextCase = p; }
    if (type === "psu") { setPsu(p); nextPsu = p; }
    if (type === "cooler") { setCooler(p); nextCooler = p; }

    updateURL({ brand, cpu: nextCpu, mb: nextMb, ram: nextRam, gpu: nextGpu, pcCase: nextCase, psu: nextPsu, cooler: nextCooler });
    setStepIndex(stepIndex + 1);
  };

  const shareBuild = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link kopiran!");
  };

  const totalPrice = () => {
    const compPrice = [cpu, mb, ram, gpu, pcCase, psu, cooler].reduce((sum, p) => sum + Number(p?.variants.edges[0]?.node.price.amount || 0), 0);
    return compPrice + ASSEMBLY_FEE;
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    const summary = [cpu, mb, ram, gpu, pcCase, psu, cooler].filter(Boolean).map(p => p?.title).join(", ") + " | + Slaganje (200€)";
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalPrice: totalPrice(), summary }),
      });
      const data = await res.json();
      if (data.draftOrder?.invoiceUrl) window.location.href = data.draftOrder.invoiceUrl;
      else { alert("Greška"); setIsProcessing(false); }
    } catch (error) {
      alert("Serverska greška");
      setIsProcessing(false);
    }
  };

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Učitavanje...</div>;

  return (
    <div style={{ display: "flex", maxWidth: "1200px", margin: "40px auto", gap: "40px", padding: "0 20px" }}>
      <div style={{ flex: 2 }}>
        <div style={{ marginBottom: "15px", fontWeight: "bold", color: "#007bff" }}>KORAK {stepIndex + 1} / {STEPS.length}</div>

        {STEPS[stepIndex] === "brand" && (
          <div>
            <h1>Započni Build</h1>
            <div style={{ display: "flex", gap: "20px" }}>
              <button style={btnStyle} onClick={() => { setBrand("intel"); updateURL({ brand: "intel" }); setStepIndex(1); }}>Intel</button>
              <button style={btnStyle} onClick={() => { setBrand("amd"); updateURL({ brand: "amd" }); setStepIndex(1); }}>AMD</button>
            </div>
          </div>
        )}

        {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
          <div>
            <h1 style={{ textTransform: "capitalize" }}>Odaberi {STEPS[stepIndex]}</h1>
            {products.filter(p => {
              const type = p.pcfType?.value;
              if (STEPS[stepIndex] === "cpu") return type === "cpu" && p.pcfBrand?.value === brand;
              if (STEPS[stepIndex] === "motherboard") return type === "motherboard" && p.pcfSocket?.value === cpu?.pcfSocket?.value;
              if (STEPS[stepIndex] === "ram") return type === "ram" && p.pcfRamType?.value === mb?.pcfRamType?.value;
              if (STEPS[stepIndex] === "gpu") return type === "gpu";
              if (STEPS[stepIndex] === "case") return type === "case" && p.pcfSupportedFormFactors?.value?.split(",").map(s => s.trim().toLowerCase()).includes(mb?.pcfFormFactor?.value?.toLowerCase() || "");
              if (STEPS[stepIndex] === "psu") return type === "psu" && Number(p.pcfWattage?.value || 0) >= (Number(cpu?.pcfTdp?.value || 0) + Number(gpu?.pcfTdp?.value || 0) + 150);
              if (STEPS[stepIndex] === "cooler") return type === "cooler" && p.pcfSocket?.value?.split(",").map(s => s.trim().toLowerCase()).includes(cpu?.pcfSocket?.value?.toLowerCase() || "");
              return false;
            }).map((p) => (
              <button key={p.id} style={cardStyle} onClick={() => {
                const typeMap: any = { cpu: "cpu", motherboard: "mb", ram: "ram", gpu: "gpu", case: "pcCase", psu: "psu", cooler: "cooler" };
                handleSelection(typeMap[STEPS[stepIndex]], p);
              }}>
                <span>{p.title}</span>
                <strong>{p.variants.edges[0].node.price.amount} €</strong>
              </button>
            ))}
          </div>
        )}

        {STEPS[stepIndex] === "review" && (
          <div style={{ textAlign: "center", padding: "40px", background: "#f8f9fa", borderRadius: "15px" }}>
            <h1>Build je spreman!</h1>
            <button disabled={isProcessing} onClick={handleCheckout} style={checkoutBtnStyle}>
              {isProcessing ? "Obrađujem..." : `Plati — ${totalPrice().toFixed(2)} €`}
            </button>
          </div>
        )}

        {stepIndex > 0 && <button onClick={() => setStepIndex(stepIndex - 1)} style={{ marginTop: "30px", cursor: "pointer" }}>← Natrag</button>}
      </div>

      <div style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: "16px", padding: "25px" }}>
        <h3>Pregled</h3>
        <SidebarRow label="Procesor" val={cpu?.title} />
        <SidebarRow label="Matična" val={mb?.title} />
        <SidebarRow label="Memorija" val={ram?.title} />
        <SidebarRow label="Grafička" val={gpu?.title} />
        <SidebarRow label="Kućište" val={pcCase?.title} />
        <SidebarRow label="Napajanje" val={psu?.title} />
        <SidebarRow label="Hladnjak" val={cooler?.title} />
        <div style={{ marginTop: "20px", fontWeight: "bold" }}>Ukupno: {totalPrice().toFixed(2)} €</div>
        <button onClick={shareBuild} style={{ width: "100%", marginTop: "20px", cursor: "pointer" }}>🔗 Podijeli</button>
      </div>
    </div>
  );
}

// THIS IS THE FIX FOR THE BUILD ERROR
export default function Builder() {
  return (
    <Suspense fallback={<div>Učitavanje...</div>}>
      <BuilderContent />
    </Suspense>
  );
}

function SidebarRow({ label, val }: { label: string; val?: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}><span>{label}:</span><span>{val || "—"}</span></div>;
}

const btnStyle = { flex: 1, padding: "20px", cursor: "pointer" };
const checkoutBtnStyle = { width: "100%", padding: "20px", background: "#000", color: "#fff", fontWeight: "bold", cursor: "pointer" };
const cardStyle = { display: "flex", justifyContent: "space-between", width: "100%", padding: "15px", marginBottom: "10px", cursor: "pointer" };