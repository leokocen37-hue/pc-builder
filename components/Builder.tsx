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
  pcfBadge?: { value: string };
};

type Step = "brand" | "cpu" | "motherboard" | "ram" | "gpu" | "gpu2" | "ssd" | "ssd2" | "hdd" | "hdd2" | "case" | "psu" | "cooler" | "os" | "review";

const STEPS: Step[] = [
  "brand", "cpu", "motherboard", "ram", 
  "gpu", "gpu2", 
  "ssd", "ssd2", 
  "hdd", "hdd2", 
  "case", "psu", "cooler", "os", "review"
];

const STEP_LABELS: Record<Step, string> = {
  brand: "Platformu",
  cpu: "Procesor",
  motherboard: "Matičnu ploču",
  ram: "Radnu memoriju",
  gpu: "Grafičku karticu (1. Odabir)",
  gpu2: "Drugu grafičku karticu (Opcionalno)",
  ssd: "Glavni SSD",
  ssd2: "Drugi SSD (Opcionalno)",
  hdd: "Tvrdi disk - HDD (Opcionalno)",
  hdd2: "Drugi HDD (Opcionalno)",
  case: "Kućište",
  psu: "Napajanje",
  cooler: "Hladnjak procesora",
  os: "Operativni sustav (Opcionalno)",
  review: "Pregled"
};

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
  const [gpu2, setGpu2] = useState<ProductNode | null>(null);
  const [ssd, setSsd] = useState<ProductNode | null>(null);
  const [ssd2, setSsd2] = useState<ProductNode | null>(null);
  const [hdd, setHdd] = useState<ProductNode | null>(null);
  const [hdd2, setHdd2] = useState<ProductNode | null>(null);
  const [pcCase, setPcCase] = useState<ProductNode | null>(null);
  const [psu, setPsu] = useState<ProductNode | null>(null);
  const [cooler, setCooler] = useState<ProductNode | null>(null);
  const [os, setOs] = useState<ProductNode | null>(null);

  const ASSEMBLY_FEE = 200;

  const calculateSystemTDP = () => {
    const parts = [cpu, mb, ram, gpu, gpu2, pcCase, cooler];
    const componentsDraw = parts.reduce((sum, part) => {
      return sum + Number(part?.pcfTdp?.value || 0);
    }, 0);
    return componentsDraw > 0 ? componentsDraw + 100 : 0; 
  };

  const estimatedDraw = calculateSystemTDP();
  const psuCapacity = Number(psu?.pcfWattage?.value || 0);
  const powerPercentage = psuCapacity > 0 ? Math.min((estimatedDraw / psuCapacity) * 100, 100) : Math.min((estimatedDraw / 1000) * 100, 100);

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

    if (gpuScore >= 3 && cpuScore <= 2 && (gpuScore - cpuScore >= 2)) {
      return "⚠️ Upozorenje (Bottleneck): Vaš procesor je znatno slabiji od odabrane grafičke kartice. Grafička kartica neće moći raditi punim kapacitetom.";
    }
    if (cpuScore >= 4 && gpuScore <= 2) {
      return "ℹ️ Napomena: Odabrali ste vrhunski procesor i budžet grafičku karticu. Odlično za radne stanice, ali za gaming razmislite o jačoj grafičkoj.";
    }
    return null;
  };

  const bottleneckWarning = checkBottleneck();

  useEffect(() => {
    if (STEPS[stepIndex] === "review") {
      const params = new URLSearchParams();
      if (brand) params.set("brand", brand);
      if (cpu?.id) params.set("cpu", cpu.id);
      if (mb?.id) params.set("mb", mb.id);
      if (ram?.id) params.set("ram", ram.id);
      if (gpu?.id) params.set("gpu", gpu.id);
      if (gpu2?.id) params.set("gpu2", gpu2.id);
      if (ssd?.id) params.set("ssd", ssd.id);
      if (ssd2?.id) params.set("ssd2", ssd2.id);
      if (hdd?.id) params.set("hdd", hdd.id);
      if (hdd2?.id) params.set("hdd2", hdd2.id);
      if (pcCase?.id) params.set("case", pcCase.id);
      if (psu?.id) params.set("psu", psu.id);
      if (cooler?.id) params.set("cooler", cooler.id);
      if (os?.id) params.set("os", os.id);
      
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [stepIndex, brand, cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os, router]);

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
        if (uBrand) setBrand(uBrand);
        
        const loadParam = (param: string, setter: any) => {
          const found = allProducts.find((p: any) => p.id === searchParams.get(param));
          if (found) setter(found);
        };

        loadParam("cpu", setCpu); loadParam("mb", setMb); loadParam("ram", setRam);
        loadParam("gpu", setGpu); loadParam("gpu2", setGpu2); 
        loadParam("ssd", setSsd); loadParam("ssd2", setSsd2);
        loadParam("hdd", setHdd); loadParam("hdd2", setHdd2);
        loadParam("case", setPcCase); loadParam("psu", setPsu); 
        loadParam("cooler", setCooler); loadParam("os", setOs);

        if (searchParams.get("cpu") && searchParams.get("gpu") && searchParams.get("case")) {
          setStepIndex(STEPS.indexOf("review"));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchAndSync();
  }, [searchParams]); 

  const handleSelection = (type: string, p: ProductNode) => {
    if (type === "cpu") setCpu(p);
    else if (type === "motherboard") setMb(p); // MATCHES STEPS ARRAY EXACTLY
    else if (type === "ram") setRam(p);
    else if (type === "gpu") setGpu(p);
    else if (type === "gpu2") setGpu2(p);
    else if (type === "ssd") setSsd(p);
    else if (type === "ssd2") setSsd2(p);
    else if (type === "hdd") setHdd(p);
    else if (type === "hdd2") setHdd2(p);
    else if (type === "case") setPcCase(p); // MATCHES STEPS ARRAY EXACTLY
    else if (type === "psu") setPsu(p);
    else if (type === "cooler") setCooler(p);
    else if (type === "os") setOs(p);

    setStepIndex((prev) => prev + 1);
  };

  const handleSkip = () => {
    const currentStep = STEPS[stepIndex];
    if (currentStep === "gpu2") setGpu2(null);
    if (currentStep === "ssd2") setSsd2(null);
    if (currentStep === "hdd") setHdd(null);
    if (currentStep === "hdd2") setHdd2(null);
    if (currentStep === "os") setOs(null);
    
    setStepIndex((prev) => prev + 1);
  };

  const resetBuild = () => {
    setStepIndex(0);
    setBrand(null); setCpu(null); setMb(null); setRam(null); 
    setGpu(null); setGpu2(null); setSsd(null); setSsd2(null); 
    setHdd(null); setHdd2(null); setPcCase(null); setPsu(null); 
    setCooler(null); setOs(null);
    router.replace(window.location.pathname, { scroll: false }); 
  };

  const shareBuild = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link za vašu konfiguraciju je kopiran!");
  };

  const totalPrice = () => {
    const compPrice = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os].reduce((sum, p) => sum + Number(p?.variants.edges[0]?.node.price.amount || 0), 0);
    return compPrice + ASSEMBLY_FEE;
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    const summary = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os].filter(Boolean).map(p => p?.title).join(", ");
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

  const getBadgeStyle = (badgeText: string) => {
    const t = badgeText.toLowerCase();
    if (t.includes("ultimativni") || t.includes("kompromisa") || t.includes("apsolutni") || t.includes("profesionalce") || t.includes("trezor")) 
      return { bg: "#6f42c1", color: "#fff" }; 
    if (t.includes("best buy") || t.includes("kralj")) 
      return { bg: "#fd7e14", color: "#fff" }; 
    if (t.includes("zlatna") || t.includes("standard")) 
      return { bg: "#ffc107", color: "#000" }; 
    if (t.includes("budžet") || t.includes("osnovni") || t.includes("start")) 
      return { bg: "#20c997", color: "#fff" }; 
    if (t.includes("premium") || t.includes("masivna") || t.includes("maksimalna") || t.includes("zvijer")) 
      return { bg: "#343a40", color: "#fff" }; 
    return { bg: "#007bff", color: "#fff" }; 
  };

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Učitavanje...</div>;

  return (
    <div style={{ display: "flex", maxWidth: "1250px", margin: "40px auto", gap: "40px", padding: "0 20px" }}>
      <div style={{ flex: 2 }}>
        <div style={{ marginBottom: "15px", fontWeight: "bold", color: "#007bff" }}>KORAK {stepIndex + 1} / {STEPS.length}</div>

        {STEPS[stepIndex] === "brand" && (
          <div>
            <h1>Započni Build</h1>
            <div style={{ display: "flex", gap: "20px" }}>
              <button style={btnStyle} onClick={() => { setBrand("intel"); setStepIndex(1); }}>Intel</button>
              <button style={btnStyle} onClick={() => { setBrand("amd"); setStepIndex(1); }}>AMD</button>
            </div>
          </div>
        )}

        {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
          <div>
            <h1 style={{ textTransform: "capitalize" }}>Odaberi: {STEP_LABELS[STEPS[stepIndex]]}</h1>
            
            {["gpu2", "ssd2", "hdd", "hdd2", "os"].includes(STEPS[stepIndex]) && (
              <button 
                style={{ ...btnStyle, marginBottom: "20px", width: "100%", background: "#f8f9fa", border: "1px dashed #ccc", color: "#666" }} 
                onClick={handleSkip}
              >
                Preskoči ovaj korak (Nije obavezno) ⏭️
              </button>
            )}

            {products.filter(p => {
              const type = p.pcfType?.value;
              const currentStep = STEPS[stepIndex];
              
              if (currentStep === "cpu") return type === "cpu" && p.pcfBrand?.value === brand;
              if (currentStep === "motherboard") return type === "motherboard" && p.pcfSocket?.value === cpu?.pcfSocket?.value;
              if (currentStep === "ram") return type === "ram" && p.pcfRamType?.value === mb?.pcfRamType?.value;
              
              if (currentStep === "gpu" || currentStep === "gpu2") return type === "gpu";
              if (currentStep === "ssd" || currentStep === "ssd2") return type === "ssd";
              if (currentStep === "hdd" || currentStep === "hdd2") return type === "hdd";
              
              if (currentStep === "os") return type === "os";
              
              if (currentStep === "case") {
                if (type !== "case") return false;
                const supported = p.pcfSupportedFormFactors?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
                const mbFits = supported.includes((mb?.pcfFormFactor?.value || "").toLowerCase());
                const gpuLength = Math.max(Number(gpu?.pcfGpuLength?.value || 0), Number(gpu2?.pcfGpuLength?.value || 0));
                const gpuFits = gpuLength <= Number(p.pcfMaxGpuLength?.value || 0);
                return mbFits && gpuFits;
              }
              
              if (currentStep === "psu") {
                const requiredWattage = calculateSystemTDP() + 100;
                return type === "psu" && Number(p.pcfWattage?.value || 0) >= requiredWattage;
              }
              
              if (currentStep === "cooler") {
                if (type !== "cooler") return false;
                const sockets = p.pcfSocket?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
                return sockets.includes((cpu?.pcfSocket?.value || "").toLowerCase());
              }
              
              return false;
            })
            .sort((a, b) => {
              const wA = getQualityScore(a.pcfQuality?.value);
              const wB = getQualityScore(b.pcfQuality?.value);
              if (wB !== wA) return wB - wA; 
              
              const priceA = Number(a.variants.edges[0]?.node.price.amount || 0);
              const priceB = Number(b.variants.edges[0]?.node.price.amount || 0);
              return priceB - priceA; 
            })
            .map((p) => {
              const price = Number(p.variants.edges[0]?.node.price.amount || 0);
              const badgeStyle = p.pcfBadge?.value ? getBadgeStyle(p.pcfBadge.value) : null;

              return (
                <button 
                  key={p.id} 
                  style={cardStyle} 
                  onClick={() => handleSelection(STEPS[stepIndex], p)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                    <div style={{ textAlign: "left" }}>
                      <span style={{ fontWeight: "600", color: "#000", fontSize: "16px" }}>{p.title}</span>
                      
                      {p.pcfBadge?.value && badgeStyle && (
                        <div style={{ marginTop: "6px" }}>
                          <span style={{ 
                            fontSize: "11px", fontWeight: "bold", backgroundColor: badgeStyle.bg, 
                            color: badgeStyle.color, padding: "4px 10px", borderRadius: "12px", 
                            textTransform: "uppercase", letterSpacing: "0.5px", display: "inline-block"
                          }}>
                            {p.pcfBadge.value}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ fontWeight: "bold", color: "#28a745", fontSize: "16px", minWidth: "80px", textAlign: "right" }}>
                      {price > 0 ? `${price.toFixed(2)} €` : "—"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {STEPS[stepIndex] === "review" && (
          <div style={{ textAlign: "center", padding: "40px", background: "#f8f9fa", borderRadius: "15px", border: "1px solid #ddd" }}>
            <h1>🎉 Build je spreman!</h1>
            <p style={{ fontSize: "28px", margin: "20px 0", fontWeight: "bold", color: "#28a745" }}>
              Ukupna cijena: {totalPrice().toFixed(2)} €
            </p>
            <p style={{ color: "#666", fontSize: "14px" }}>(Uključen PDV i usluga slaganja)</p>
            <button disabled={isProcessing} onClick={handleCheckout} style={checkoutBtnStyle}>
              {isProcessing ? "Obrađujem..." : `Naruči i Plati`}
            </button>
            <button onClick={shareBuild} style={{ width: "100%", marginTop: "15px", padding: "15px", borderRadius: "8px", border: "2px solid #007bff", color: "#007bff", background: "#fff", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>
              🔗 Kopiraj link za dijeljenje
            </button>
          </div>
        )}

        {stepIndex > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px" }}>
            <button onClick={() => setStepIndex(stepIndex - 1)} style={{ cursor: "pointer", background: "none", border: "1px solid #ccc", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold" }}>
              ← Natrag
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: "16px", padding: "25px", background: "#fff", height: "fit-content", position: "sticky", top: "40px" }}>
        <h3 style={{ marginTop: 0, borderBottom: "2px solid #f0f0f0", paddingBottom: "15px" }}>Vaša Konfiguracija</h3>
        
        <SidebarRow label="Procesor" val={cpu?.title} />
        <SidebarRow label="Matična" val={mb?.title} />
        <SidebarRow label="Memorija" val={ram?.title} />
        <SidebarRow label="Grafička (1)" val={gpu?.title} />
        {gpu2 && <SidebarRow label="Grafička (2)" val={gpu2.title} />}
        <SidebarRow label="SSD (1)" val={ssd?.title} />
        {ssd2 && <SidebarRow label="SSD (2)" val={ssd2.title} />}
        {hdd && <SidebarRow label="HDD (1)" val={hdd.title} />}
        {hdd2 && <SidebarRow label="HDD (2)" val={hdd2.title} />}
        <SidebarRow label="Kućište" val={pcCase?.title} />
        <SidebarRow label="Napajanje" val={psu?.title} />
        <SidebarRow label="Hladnjak" val={cooler?.title} />
        {os && <SidebarRow label="Sustav" val={os.title} />}
        
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

        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "20px", color: "#000" }}>
          <span>Ukupno:</span>
          <span>{totalPrice().toFixed(2)} €</span>
        </div>
        
        <p style={{ fontSize: "12px", color: "#999", marginTop: "5px", textAlign: "right" }}>
          Uključuje uslugu slaganja ({ASSEMBLY_FEE} €)
        </p>

        <button 
          onClick={resetBuild} 
          style={{ width: "100%", marginTop: "25px", padding: "12px", borderRadius: "8px", border: "none", color: "#fff", background: "#dc3545", cursor: "pointer", fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
        >
          🔄 Počni ispočetka
        </button>
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
  if (!val) return null; 
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "12px", borderBottom: "1px dashed #eee", paddingBottom: "4px" }}>
      <span style={{ color: "#666", minWidth: "80px" }}>{label}:</span>
      <span style={{ textAlign: "right", marginLeft: "10px", fontWeight: "600", color: "#000" }}>{val}</span>
    </div>
  );
}

const btnStyle: CSSProperties = { flex: 1, padding: "20px", cursor: "pointer", border: "1px solid #ddd", background: "#fff", borderRadius: "8px", fontSize: "18px", fontWeight: "bold", transition: "0.2s" };
const checkoutBtnStyle: CSSProperties = { width: "100%", padding: "20px", background: "#000", color: "#fff", fontWeight: "bold", cursor: "pointer", borderRadius: "8px", fontSize: "18px", border: "none", marginTop: "10px" };
const cardStyle: CSSProperties = { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", width: "100%", padding: "15px 20px", marginBottom: "12px", cursor: "pointer", border: "1px solid #e0e0e0", background: "#fff", borderRadius: "10px", transition: "all 0.2s ease-in-out" };