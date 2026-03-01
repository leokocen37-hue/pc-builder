"use client";

import { CSSProperties, useEffect, useState, useCallback, Suspense } from "react";
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
  pcfQuality?: { value: string };
  pcfBadge?: { value: string }; // NEW METAFIELD FOR CUSTOM TEXT
};

type Step = "brand" | "cpu" | "motherboard" | "ram" | "gpu" | "ssd" | "hdd" | "case" | "psu" | "cooler" | "os" | "review";
const STEPS: Step[] = ["brand", "cpu", "motherboard", "ram", "gpu", "ssd", "hdd", "case", "psu", "cooler", "os", "review"];

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
  const [ssd, setSsd] = useState<ProductNode | null>(null);
  const [hdd, setHdd] = useState<ProductNode | null>(null);
  const [pcCase, setPcCase] = useState<ProductNode | null>(null);
  const [psu, setPsu] = useState<ProductNode | null>(null);
  const [cooler, setCooler] = useState<ProductNode | null>(null);
  const [os, setOs] = useState<ProductNode | null>(null);

  // Hidden internal fee added to the final math
  const ASSEMBLY_FEE = 200;
  const isReviewStep = STEPS[stepIndex] === "review";

  const calculateSystemTDP = () => {
    const parts = [cpu, mb, ram, gpu, pcCase, cooler];
    const componentsDraw = parts.reduce((sum, part) => {
      return sum + Number(part?.pcfTdp?.value || 0);
    }, 0);
    return componentsDraw > 0 ? componentsDraw + 100 : 0; 
  };

  const estimatedDraw = calculateSystemTDP();
  const psuCapacity = Number(psu?.pcfWattage?.value || 0);

  const powerPercentage = psuCapacity > 0 
    ? Math.min((estimatedDraw / psuCapacity) * 100, 100) 
    : Math.min((estimatedDraw / 1000) * 100, 100);

  // BOTTLENECK CHECKER LOGIC (Still uses the hidden pcfQuality)
  const getQualityScore = (quality?: string) => {
    const q = (quality || "").toLowerCase();
    if (q === "excellent") return 4;
    if (q === "very good") return 3;
    if (q === "good") return 2;
    if (q === "average") return 1;
    return 0;
  };

  const checkBottleneck = () => {
    if (!cpu || !gpu) return null;
    const cpuScore = getQualityScore(cpu.pcfQuality?.value);
    const gpuScore = getQualityScore(gpu.pcfQuality?.value);

    // If GPU is high-end (3+) but CPU is budget (2 or lower)
    if (gpuScore >= 3 && cpuScore <= 2 && (gpuScore - cpuScore >= 2)) {
      return "⚠️ Upozorenje (Bottleneck): Vaš procesor je znatno slabiji od odabrane grafičke kartice. Grafička kartica neće moći raditi punim kapacitetom. Preporučujemo jači procesor.";
    }
    // If CPU is high-end (4) but GPU is budget (2 or lower)
    if (cpuScore >= 4 && gpuScore <= 2) {
      return "ℹ️ Napomena: Odabrali ste vrhunski procesor i budžet grafičku karticu. Ovo je odlično za radne stanice, ali za gaming razmislite o jačoj grafičkoj kartici.";
    }
    return null;
  };

  const bottleneckWarning = checkBottleneck();

  const updateURL = useCallback((selections: any) => {
    const params = new URLSearchParams();
    if (selections.brand) params.set("brand", selections.brand);
    if (selections.cpu?.id) params.set("cpu", selections.cpu.id);
    if (selections.mb?.id) params.set("mb", selections.mb.id);
    if (selections.ram?.id) params.set("ram", selections.ram.id);
    if (selections.gpu?.id) params.set("gpu", selections.gpu.id);
    if (selections.ssd?.id) params.set("ssd", selections.ssd.id);
    if (selections.hdd?.id) params.set("hdd", selections.hdd.id);
    if (selections.pcCase?.id) params.set("case", selections.pcCase.id);
    if (selections.psu?.id) params.set("psu", selections.psu.id);
    if (selections.cooler?.id) params.set("cooler", selections.cooler.id);
    if (selections.os?.id) params.set("os", selections.os.id);
    
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
                  pcfQuality: metafield(namespace: "pcf", key: "quality") { value }
                  pcfBadge: metafield(namespace: "pcf", key: "badge") { value }
                }
              }
            }
          }
        `);
        const allProducts = data.products.edges.map((e: any) => e.node);
        setProducts(allProducts);

        const uBrand = searchParams.get("brand");
        const uCpu = allProducts.find((p: any) => p.id === searchParams.get("cpu"));
        const uMb = allProducts.find((p: any) => p.id === searchParams.get("mb"));
        const uRam = allProducts.find((p: any) => p.id === searchParams.get("ram"));
        const uGpu = allProducts.find((p: any) => p.id === searchParams.get("gpu"));
        const uSsd = allProducts.find((p: any) => p.id === searchParams.get("ssd"));
        const uHdd = allProducts.find((p: any) => p.id === searchParams.get("hdd"));
        const uCase = allProducts.find((p: any) => p.id === searchParams.get("case"));
        const uPsu = allProducts.find((p: any) => p.id === searchParams.get("psu"));
        const uCooler = allProducts.find((p: any) => p.id === searchParams.get("cooler"));
        const uOs = allProducts.find((p: any) => p.id === searchParams.get("os"));

        if (uBrand) setBrand(uBrand);
        if (uCpu) setCpu(uCpu);
        if (uMb) setMb(uMb);
        if (uRam) setRam(uRam);
        if (uGpu) setGpu(uGpu);
        if (uSsd) setSsd(uSsd);
        if (uHdd) setHdd(uHdd);
        if (uCase) setPcCase(uCase);
        if (uPsu) setPsu(uPsu);
        if (uCooler) setCooler(uCooler);
        if (uOs) setOs(uOs);

        if (uCpu && uGpu && uCase && uCooler && uSsd) {
          setStepIndex(STEPS.indexOf("review"));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchAndSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSelection = (type: string, p: ProductNode) => {
    let nextState = { brand, cpu, mb, ram, gpu, ssd, hdd, pcCase, psu, cooler, os };
    if (type === "cpu") { setCpu(p); nextState.cpu = p; }
    else if (type === "mb") { setMb(p); nextState.mb = p; }
    else if (type === "ram") { setRam(p); nextState.ram = p; }
    else if (type === "gpu") { setGpu(p); nextState.gpu = p; }
    else if (type === "ssd") { setSsd(p); nextState.ssd = p; }
    else if (type === "hdd") { setHdd(p); nextState.hdd = p; }
    else if (type === "pcCase") { setPcCase(p); nextState.pcCase = p; }
    else if (type === "psu") { setPsu(p); nextState.psu = p; }
    else if (type === "cooler") { setCooler(p); nextState.cooler = p; }
    else if (type === "os") { setOs(p); nextState.os = p; }

    updateURL(nextState);
    setStepIndex((prev) => prev + 1);
  };

  const handleSkip = () => {
    let nextState = { brand, cpu, mb, ram, gpu, ssd, hdd, pcCase, psu, cooler, os };
    if (STEPS[stepIndex] === "hdd") { setHdd(null); nextState.hdd = null; }
    if (STEPS[stepIndex] === "os") { setOs(null); nextState.os = null; }
    
    updateURL(nextState);
    setStepIndex((prev) => prev + 1);
  };

  const shareBuild = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link kopiran!");
  };

  const totalPrice = () => {
    const compPrice = [cpu, mb, ram, gpu, ssd, hdd, pcCase, psu, cooler, os].reduce((sum, p) => sum + Number(p?.variants.edges[0]?.node.price.amount || 0), 0);
    return compPrice + ASSEMBLY_FEE;
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    // Silent summary without fee disclosure
    const summary = [cpu, mb, ram, gpu, ssd, hdd, pcCase, psu, cooler, os].filter(Boolean).map(p => p?.title).join(", ");
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

  const getQualityColor = (quality: string) => {
    const q = quality.toLowerCase();
    if (q === "excellent") return "#28a745"; // Green
    if (q === "very good") return "#007bff"; // Blue
    if (q === "good") return "#17a2b8";      // Light Blue
    if (q === "average") return "#6c757d";   // Gray
    return "#888"; 
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
            
            {["hdd", "os"].includes(STEPS[stepIndex]) && (
              <button 
                style={{ ...btnStyle, marginBottom: "20px", width: "100%", background: "#f8f9fa", border: "1px dashed #ccc", color: "#666" }} 
                onClick={handleSkip}
              >
                Preskoči ovaj korak (Nije obavezno) ⏭️
              </button>
            )}

            {products.filter(p => {
              const type = p.pcfType?.value;
              
              if (STEPS[stepIndex] === "cpu") return type === "cpu" && p.pcfBrand?.value === brand;
              if (STEPS[stepIndex] === "motherboard") return type === "motherboard" && p.pcfSocket?.value === cpu?.pcfSocket?.value;
              if (STEPS[stepIndex] === "ram") return type === "ram" && p.pcfRamType?.value === mb?.pcfRamType?.value;
              if (STEPS[stepIndex] === "gpu") return type === "gpu";
              if (STEPS[stepIndex] === "ssd") return type === "ssd";
              if (STEPS[stepIndex] === "hdd") return type === "hdd";
              if (STEPS[stepIndex] === "os") return type === "os";
              
              if (STEPS[stepIndex] === "case") {
                if (type !== "case") return false;
                const supported = p.pcfSupportedFormFactors?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
                const mbFits = supported.includes((mb?.pcfFormFactor?.value || "").toLowerCase());
                const gpuFits = Number(gpu?.pcfGpuLength?.value || 0) <= Number(p.pcfMaxGpuLength?.value || 0);
                return mbFits && gpuFits;
              }
              
              if (STEPS[stepIndex] === "psu") {
                const requiredWattage = calculateSystemTDP() + 100;
                return type === "psu" && Number(p.pcfWattage?.value || 0) >= requiredWattage;
              }
              
              if (STEPS[stepIndex] === "cooler") {
                if (type !== "cooler") return false;
                const sockets = p.pcfSocket?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
                return sockets.includes((cpu?.pcfSocket?.value || "").toLowerCase());
              }
              
              return false;
            })
            .sort((a, b) => {
              // STILL SORTS BY THE HIDDEN QUALITY TIER!
              const weights: Record<string, number> = { "excellent": 4, "very good": 3, "good": 2, "average": 1 };
              const wA = weights[a.pcfQuality?.value?.toLowerCase() || ""] || 0;
              const wB = weights[b.pcfQuality?.value?.toLowerCase() || ""] || 0;
              return wB - wA; 
            })
            .map((p) => (
              <button 
                key={p.id} 
                style={cardStyle} 
                onClick={() => {
                  const typeMap: any = { cpu: "cpu", motherboard: "mb", ram: "ram", gpu: "gpu", ssd: "ssd", hdd: "hdd", case: "pcCase", psu: "psu", cooler: "cooler", os: "os" };
                  handleSelection(typeMap[STEPS[stepIndex]], p);
                }}
              >
                <span style={{ fontWeight: "500", color: "#000" }}>{p.title}</span>
                
                {/* NEW CUSTOM BADGE RENDERER */}
                {p.pcfBadge?.value && (
                  <span style={{ 
                    marginTop: "8px", 
                    fontSize: "11px", 
                    fontWeight: "bold",
                    backgroundColor: p.pcfQuality?.value ? getQualityColor(p.pcfQuality.value) : "#007bff",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "inline-block"
                  }}>
                    {p.pcfBadge.value}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {STEPS[stepIndex] === "review" && (
          <div style={{ textAlign: "center", padding: "40px", background: "#f8f9fa", borderRadius: "15px" }}>
            <h1>Build je spreman!</h1>
            <p style={{ fontSize: "28px", margin: "20px 0", fontWeight: "bold", color: "#28a745" }}>
              Ukupna cijena: {totalPrice().toFixed(2)} €
            </p>
            <p style={{ color: "#666", fontSize: "14px" }}>(Uključen PDV)</p>
            <button disabled={isProcessing} onClick={handleCheckout} style={checkoutBtnStyle}>
              {isProcessing ? "Obrađujem..." : `Naruči i Plati`}
            </button>
          </div>
        )}

        {stepIndex > 0 && <button onClick={() => setStepIndex(stepIndex - 1)} style={{ marginTop: "30px", cursor: "pointer", background: "none", border: "1px solid #ccc", padding: "8px 15px", borderRadius: "5px" }}>← Natrag</button>}
      </div>

      <div style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: "16px", padding: "25px", background: "#fff", height: "fit-content" }}>
        <h3 style={{ marginTop: 0 }}>Vaša Konfiguracija</h3>
        <SidebarRow label="Procesor" val={cpu?.title} />
        <SidebarRow label="Matična" val={mb?.title} />
        <SidebarRow label="Memorija" val={ram?.title} />
        <SidebarRow label="Grafička" val={gpu?.title} />
        <SidebarRow label="SSD" val={ssd?.title} />
        <SidebarRow label="HDD" val={hdd?.title} />
        <SidebarRow label="Kućište" val={pcCase?.title} />
        <SidebarRow label="Napajanje" val={psu?.title} />
        <SidebarRow label="Hladnjak" val={cooler?.title} />
        <SidebarRow label="Sustav" val={os?.title} />
        
        <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #eee" }} />
        
        {bottleneckWarning && (
          <div style={{ marginBottom: "20px", padding: "12px", background: "#fff3cd", borderRadius: "8px", border: "1px solid #ffeeba", color: "#856404", fontSize: "13px", lineHeight: "1.4" }}>
            {bottleneckWarning}
          </div>
        )}

        {(estimatedDraw > 0) && (
          <div style={{ marginBottom: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", fontWeight: "bold", color: "#333" }}>
              <span>Potrošnja sustava:</span>
              <span>{estimatedDraw}W {psuCapacity > 0 ? `/ ${psuCapacity}W` : ""}</span>
            </div>
            
            <div style={{ width: "100%", height: "8px", background: "#e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ 
                height: "100%", 
                width: `${powerPercentage}%`, 
                background: psuCapacity > 0 && estimatedDraw >= psuCapacity ? "#dc3545" : (psuCapacity > 0 ? "#28a745" : "#007bff"),
                transition: "width 0.4s ease, background 0.4s ease" 
              }} />
            </div>
            
            <p style={{ fontSize: "11px", color: "#777", marginTop: "8px", textAlign: "right" }}>
              {psuCapacity === 0 
                ? "*Uključeno ~100W za diskove i periferiju." 
                : (estimatedDraw >= psuCapacity ? "Upozorenje: Napajanje je preslabo!" : "Napajanje je optimalno.")}
            </p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "18px" }}>
          <span>Ukupno:</span>
          <span>{isReviewStep ? `${totalPrice().toFixed(2)} €` : "—"}</span>
        </div>
        
        {!isReviewStep && <p style={{ fontSize: "12px", color: "#999", marginTop: "10px" }}>* Cijena će biti vidljiva na kraju.</p>}
        
        <button onClick={shareBuild} style={{ width: "100%", marginTop: "20px", padding: "10px", borderRadius: "8px", border: "1px solid #007bff", color: "#007bff", background: "#fff", cursor: "pointer" }}>🔗 Podijeli build</button>
      </div>
    </div>
  );
}

export default function Builder() {
  return (
    <Suspense fallback={<div>Učitavanje...</div>}>
      <BuilderContent />
    </Suspense>
  );
}

function SidebarRow({ label, val }: { label: string; val?: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "10px" }}><span style={{ color: "#888" }}>{label}:</span><span style={{ textAlign: "right", marginLeft: "10px", fontWeight: val ? "500" : "normal", color: val ? "#000" : "#ccc" }}>{val || "—"}</span></div>;
}

const btnStyle: CSSProperties = { flex: 1, padding: "20px", cursor: "pointer", border: "1px solid #ddd", background: "#fff", borderRadius: "8px", fontSize: "18px" };
const checkoutBtnStyle: CSSProperties = { width: "100%", padding: "20px", background: "#000", color: "#fff", fontWeight: "bold", cursor: "pointer", borderRadius: "8px", fontSize: "18px", border: "none", marginTop: "10px" };
const cardStyle: CSSProperties = { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "100%", padding: "20px", marginBottom: "10px", cursor: "pointer", border: "1px solid #eee", background: "#fff", borderRadius: "8px", fontSize: "16px", textAlign: "center", transition: "0.2s" };