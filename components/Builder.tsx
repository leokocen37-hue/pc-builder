"use client";

import { CSSProperties, useEffect, useState, Suspense, useRef } from "react";
import { shopifyFetch } from "@/lib/shopify";
import { useSearchParams, useRouter } from "next/navigation";

// --- TYPES ---
type ProductNode = {
  id: string;
  title: string;
  featuredImage?: { url: string; altText?: string };
  variants: { edges: { node: { id: string; title: string; price: { amount: string } } }[] };
  selectedVariant?: any; 
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

type Step = "brand" | "cpu" | "motherboard" | "ram" | "gpu" | "ssd" | "hdd" | "case" | "psu" | "cooler" | "os" | "review";

const STEPS: Step[] = ["brand", "cpu", "motherboard", "ram", "gpu", "ssd", "hdd", "case", "psu", "cooler", "os", "review"];

const STEP_LABELS: Record<Step, string> = {
  brand: "Platform", cpu: "Processor", motherboard: "Motherboard", ram: "Memory",
  gpu: "Graphics Card", ssd: "Storage", hdd: "Secondary Storage", case: "Case",
  psu: "Power Supply", cooler: "Cooling", os: "Operating System", review: "Configure Components"
};

const ASSEMBLY_FEE = 200;

// --- COLOR PALETTE (From your image) ---
const COLORS = {
  bgMain: "#0a0c10",
  bgCard: "#161b22",
  bgDark: "#010409",
  border: "#30363d",
  textMain: "#f0f6fc",
  textMuted: "#8b949e",
  accent: "#f59e0b" // Orange
};

function BuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialized = useRef(false);

  // --- STATE ---
  const [stepIndex, setStepIndex] = useState(0);
  const [products, setProducts] = useState<ProductNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedVarId, setSelectedVarId] = useState("");
  const [startX, setStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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
  const [addingExtra, setAddingExtra] = useState<"gpu2" | "ssd2" | "hdd2" | null>(null);

  const isReviewStep = STEPS[stepIndex] === "review";

  // --- LOGIC HELPERS ---
  const calculateSystemTDP = () => {
    const parts = [cpu, mb, ram, gpu, gpu2, pcCase, cooler];
    return parts.reduce((sum, part) => sum + Number(part?.pcfTdp?.value || 0), 100);
  };

  const estimatedDraw = calculateSystemTDP();
  const psuCapacity = Number(psu?.pcfWattage?.value || 0);
  const powerPercentage = psuCapacity > 0 ? Math.min((estimatedDraw / psuCapacity) * 100, 100) : Math.min((estimatedDraw / 1000) * 100, 100);

  const getQualityScore = (quality?: string) => {
    const q = (quality || "").toLowerCase();
    if (q === "excellent") return 4;
    if (q === "very good") return 3;
    if (q === "good") return 2;
    return q === "average" ? 1 : 0;
  };

  const checkBottleneck = () => {
    if (!cpu || !gpu) return null;
    const cpuScore = getQualityScore(cpu.pcfQuality?.value);
    const gpuScore = getQualityScore(gpu.pcfQuality?.value);
    if (gpuScore >= 3 && cpuScore <= 2 && (gpuScore - cpuScore >= 2)) return "⚠️ Bottleneck: Vaš procesor je preslab za ovu grafičku karticu.";
    return null;
  };

  const bottleneckWarning = checkBottleneck();

  // --- FETCHING ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isReviewStep) {
      const params = new URLSearchParams();
      if (brand) params.set("brand", brand);
      if (cpu) params.set("cpu", cpu.selectedVariant?.id || cpu.id);
      if (mb) params.set("mb", mb.selectedVariant?.id || mb.id);
      if (ram) params.set("ram", ram.selectedVariant?.id || ram.id);
      if (gpu) params.set("gpu", gpu.selectedVariant?.id || gpu.id);
      if (gpu2) params.set("gpu2", gpu2.selectedVariant?.id || gpu2.id);
      if (ssd) params.set("ssd", ssd.selectedVariant?.id || ssd.id);
      if (ssd2) params.set("ssd2", ssd2.selectedVariant?.id || ssd2.id);
      if (hdd) params.set("hdd", hdd.selectedVariant?.id || hdd.id);
      if (hdd2) params.set("hdd2", hdd2.selectedVariant?.id || hdd2.id);
      if (pcCase) params.set("case", pcCase.selectedVariant?.id || pcCase.id);
      if (psu) params.set("psu", psu.selectedVariant?.id || psu.id);
      if (cooler) params.set("cooler", cooler.selectedVariant?.id || cooler.id);
      if (os) params.set("os", os.selectedVariant?.id || os.id);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [stepIndex, brand, cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os, router, isReviewStep]);

  useEffect(() => {
    if (initialized.current) return;
    async function fetchAndSync() {
      try {
        const data = await shopifyFetch<any>(`
          query {
            products(first: 250) {
              edges {
                node {
                  id title
                  featuredImage { url altText }
                  variants(first: 50) { edges { node { id title price { amount } } } }
                  pcfType: metafield(namespace: "pcf", key: "type") { value }
                  pcfBrand: metafield(namespace: "pcf", key: "brand") { value }
                  pcfSocket: metafield(namespace: "pcf", key: "socket") { value }
                  pcfTdp: metafield(namespace: "pcf", key: "tdp") { value }
                  pcfRamType: metafield(namespace: "pcf", key: "ram_type") { value }
                  pcfFormFactor: metafield(namespace: "pcf", key: "form_factor") { value }
                  pcfSupportedFormFactors: metafield(namespace: "pcf", key: "supported_form_factors") { value }
                  pcfMaxGpuLength: metafield(namespace: "pcf", key: "max_gpu_length") { value }
                  pcfWattage: metafield(namespace: "pcf", key: "wattage") { value }
                  pcfQuality: metafield(namespace: "pcf", key: "quality") { value }
                  pcfBadge: metafield(namespace: "pcf", key: "badge") { value }
                }
              }
            }
          }
        `);
        const allProducts = data.products.edges.map((e: any) => e.node);
        setProducts(allProducts);
        
        const loadParam = (param: string, setter: any) => {
          const val = searchParams.get(param);
          if (!val) return;
          const found = allProducts.find((p: any) => p.id === val || p.variants.edges.some((v: any) => v.node.id === val));
          if (found) {
            const varNode = found.variants.edges.find((v: any) => v.node.id === val)?.node || found.variants.edges[0].node;
            setter({ ...found, selectedVariant: varNode });
          }
        };

        if (searchParams.get("brand")) setBrand(searchParams.get("brand"));
        loadParam("cpu", setCpu); loadParam("mb", setMb); loadParam("ram", setRam);
        loadParam("gpu", setGpu); loadParam("gpu2", setGpu2); 
        loadParam("ssd", setSsd); loadParam("ssd2", setSsd2);
        loadParam("hdd", setHdd); loadParam("hdd2", setHdd2);
        loadParam("case", setPcCase); loadParam("psu", setPsu); 
        loadParam("cooler", setCooler); loadParam("os", setOs);

        if (searchParams.get("cpu") && searchParams.get("case")) setStepIndex(STEPS.indexOf("review"));
      } catch (err: any) { setErrorMessage(err.message); } finally { setLoading(false); initialized.current = true; }
    }
    fetchAndSync();
  }, [searchParams]);

  useEffect(() => {
    setActiveIndex(0);
    setDragOffset(0);
  }, [stepIndex]);

  // --- CAROUSEL PHYSICS ---
  const currentStep = STEPS[stepIndex];
  const currentProducts = products.filter(p => {
    const type = p.pcfType?.value;
    if (currentStep === "cpu") return type === "cpu" && p.pcfBrand?.value === brand;
    if (currentStep === "motherboard") return type === "motherboard" && p.pcfSocket?.value === cpu?.pcfSocket?.value;
    if (currentStep === "ram") return type === "ram" && p.pcfRamType?.value === mb?.pcfRamType?.value;
    if (currentStep === "gpu") return type === "gpu";
    if (currentStep === "ssd") return type === "ssd";
    if (currentStep === "hdd") return type === "hdd";
    if (currentStep === "case") {
       const supported = p.pcfSupportedFormFactors?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
       const mbFits = supported.includes((mb?.pcfFormFactor?.value || "").toLowerCase());
       const gpuLen = Math.max(Number(gpu?.pcfGpuLength?.value || 0), Number(gpu2?.pcfGpuLength?.value || 0));
       return type === "case" && mbFits && gpuLen <= Number(p.pcfMaxGpuLength?.value || 0);
    }
    if (currentStep === "psu") return type === "psu" && Number(p.pcfWattage?.value || 0) >= (calculateSystemTDP() + 100);
    if (currentStep === "cooler") {
      const sockets = p.pcfSocket?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
      return type === "cooler" && sockets.includes((cpu?.pcfSocket?.value || "").toLowerCase());
    }
    if (currentStep === "os") return type === "os";
    return false;
  }).sort((a, b) => getQualityScore(b.pcfQuality?.value) - getQualityScore(a.pcfQuality?.value));

  const activeProduct = currentProducts[activeIndex];
  useEffect(() => { if (activeProduct) setSelectedVarId(activeProduct.variants.edges[0].node.id); }, [activeProduct]);

  const getOffset = (index: number) => {
    const N = currentProducts.length;
    if (N === 0) return 0;
    let offset = ((index - activeIndex) % N + N) % N;
    if (offset > Math.floor(N / 2)) offset -= N;
    return offset;
  };

  const getCardStyle = (exactOffset: number, isMobile: boolean) => {
    const absOffset = Math.abs(exactOffset);
    const sign = Math.sign(exactOffset) || 1;
    const baseOffset1 = isMobile ? 120 : 250;
    const baseOffset2 = isMobile ? 180 : 400;
    let translateX = 0, scale = 1, opacity = 1, zIndex = 10;

    if (absOffset <= 1) {
      translateX = exactOffset * baseOffset1;
      scale = 1 - (0.15 * absOffset);
      opacity = 1 - (0.5 * absOffset);
      zIndex = 10 - Math.round(absOffset * 5);
    } else if (absOffset <= 2) {
      const fraction = absOffset - 1;
      translateX = sign * (baseOffset1 + fraction * (baseOffset2 - baseOffset1));
      scale = 0.85 - (0.15 * fraction);
      opacity = 0.5 - (isMobile ? 0.5 : 0.3) * fraction;
      zIndex = 5 - Math.round(fraction * 3);
    } else {
      translateX = sign * (baseOffset2 + (absOffset - 2) * 100);
      scale = 0.7; opacity = 0; zIndex = 0;
    }
    return { transform: `translateX(${translateX}px) scale(${scale})`, opacity: Math.max(0, opacity), zIndex: Math.max(0, zIndex), transition: isDragging ? "none" : "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)" };
  };

  const handlePointerDown = (e: React.PointerEvent) => { setStartX(e.clientX); setDragOffset(0); setIsDragging(false); };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (startX === null) return;
    const diff = e.clientX - startX;
    const slideWidth = isMobile ? 120 : 250; 
    const jumps = Math.trunc(diff / slideWidth);

    if (jumps !== 0) {
      setActiveIndex((prev) => {
        let next = prev - jumps;
        while (next < 0) next += currentProducts.length; 
        return next % currentProducts.length;
      });
      setStartX((prev) => (prev !== null ? prev + jumps * slideWidth : e.clientX));
      setDragOffset(diff - jumps * slideWidth);
    } else { setDragOffset(diff); }
    if (Math.abs(diff) > 15) setIsDragging(true); 
  };
  const handlePointerUp = () => {
    if (startX !== null) {
      const slideWidth = isMobile ? 120 : 250;
      if (dragOffset > slideWidth / 3) setActiveIndex((prev) => (prev - 1 + currentProducts.length) % currentProducts.length);
      else if (dragOffset < -slideWidth / 3) setActiveIndex((prev) => (prev + 1) % currentProducts.length);
    }
    setDragOffset(0); setStartX(null); setTimeout(() => setIsDragging(false), 50); 
  };

  // --- ACTIONS ---
  const handleSelection = (p: ProductNode) => {
    if (isDragging) return;
    const setters: any = { cpu: setCpu, motherboard: setMb, ram: setRam, gpu: setGpu, ssd: setSsd, hdd: setHdd, case: setPcCase, psu: setPsu, cooler: setCooler, os: setOs };
    const variantNode = p.variants.edges.find((v: any) => v.node.id === selectedVarId)?.node || p.variants.edges[0].node;
    if (setters[currentStep]) setters[currentStep]({ ...p, selectedVariant: variantNode });
    setStepIndex(prev => prev + 1);
  };

  const currentTotal = () => [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os].reduce((sum, p) => sum + Number(p?.selectedVariant?.price?.amount || p?.variants.edges[0].node.price.amount || 0), 0) + (isReviewStep ? ASSEMBLY_FEE : 0);

  const handleCheckout = async () => {
    setIsProcessing(true);
    const summary = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os]
      .filter(Boolean).map(p => `${p?.title}${p?.selectedVariant && p?.selectedVariant?.title !== 'Default Title' ? ` (${p?.selectedVariant?.title})` : ''}`).join(", ");
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ totalPrice: currentTotal(), summary }) });
      const data = await res.json();
      if (data.draftOrder?.invoiceUrl) window.location.href = data.draftOrder.invoiceUrl;
      else { alert("Greška pri kreiranju narudžbe."); setIsProcessing(false); }
    } catch { alert("Serverska greška"); setIsProcessing(false); }
  };

  const selectedPartsList = [
    { key: "cpu", label: "PROCESSOR", item: cpu },
    { key: "gpu", label: "GRAPHICS CARD", item: gpu },
    { key: "gpu2", label: "2ND GRAPHICS CARD", item: gpu2 },
    { key: "mb", label: "MOTHERBOARD", item: mb },
    { key: "ram", label: "MEMORY", item: ram },
    { key: "ssd", label: "STORAGE", item: ssd },
    { key: "ssd2", label: "2ND STORAGE", item: ssd2 },
    { key: "hdd", label: "HARD DRIVE", item: hdd },
    { key: "hdd2", label: "2ND HARD DRIVE", item: hdd2 },
    { key: "psu", label: "POWER SUPPLY", item: psu },
    { key: "case", label: "CASE", item: pcCase },
    { key: "cooler", label: "COOLING", item: cooler },
    { key: "os", label: "OPERATING SYSTEM", item: os }
  ].filter(p => p.item);

  if (loading) return <div style={{ padding: "100px", textAlign: "center", color: COLORS.textMain }}>Učitavanje...</div>;

  return (
    <div style={{ background: COLORS.bgMain, minHeight: '100vh', width: '100%', color: COLORS.textMain, fontFamily: "system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "20px 10px" : "40px 20px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: "30px" }}>
        
        {/* --- LEFT COLUMN: MAIN CONTENT --- */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", minHeight: isMobile ? "auto" : "85vh" }}>
          
          {/* Top Bar for active selection steps */}
          {!isReviewStep && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: COLORS.bgCard, padding: "15px 25px", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
                <h1 style={{ margin: 0, fontSize: isMobile ? "18px" : "22px", fontWeight: "600" }}>{STEP_LABELS[currentStep]}</h1>
              </div>
              {stepIndex > 0 && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
                  <button onClick={() => setStepIndex(stepIndex - 1)} style={navBtnStyle}>← BACK</button>
                  <button onClick={() => { setStepIndex(0); setBrand(null); }} style={{ ...navBtnStyle, color: "#ff4d4d" }}>RESET</button>
                  {["hdd", "os"].includes(currentStep) && <button onClick={() => setStepIndex(stepIndex + 1)} style={{...navBtnStyle, marginLeft: "auto"}}>SKIP ⏭</button>}
                </div>
              )}
            </>
          )}

          {/* BRAND SELECTION */}
          {currentStep === "brand" ? (
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "20px", justifyContent: "center", alignItems: "center", flex: 1 }}>
              <button onClick={() => { setBrand("intel"); setStepIndex(1); }} style={{ ...brandBtnStyle, borderTop: "4px solid #0066cc" }}>
                INTEL
              </button>
              <button onClick={() => { setBrand("amd"); setStepIndex(1); }} style={{ ...brandBtnStyle, borderTop: "4px solid #cc4400" }}>
                AMD
              </button>
            </div>

          // REVIEW STEP (The new design)
          ) : isReviewStep ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px", paddingRight: isMobile ? "0" : "20px" }}>
              <div style={{ marginBottom: "10px" }}>
                <div style={{ color: COLORS.accent, fontSize: "12px", fontWeight: "bold", letterSpacing: "1.5px", marginBottom: "5px" }}>STEP BY STEP</div>
                <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "700" }}>Configure Components</h1>
              </div>

              {selectedPartsList.map((part) => (
                <div key={part.key} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: isMobile ? "20px 15px" : "20px 30px", position: "relative", display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{ position: "absolute", top: "-10px", left: "20px", background: COLORS.border, padding: "4px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px", color: COLORS.textMuted }}>
                    {part.label}
                  </div>
                  <div style={{ width: "60px", height: "60px", background: COLORS.bgDark, borderRadius: "8px", padding: "5px", flexShrink: 0 }}>
                    {/* Added optional chaining here */}
                    <img src={part.item?.featuredImage?.url} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: COLORS.textMain }}>
                      {/* Added optional chaining here */}
                      {part.item?.title} {part.item?.selectedVariant && part.item?.selectedVariant.title !== "Default Title" ? `(${part.item?.selectedVariant.title})` : ""}
                    </div>
                    <div style={{ fontSize: "12px", color: COLORS.textMuted, marginTop: "4px" }}>
                      {/* Added optional chaining here */}
                      {part.item?.pcfSocket?.value || part.item?.pcfFormFactor?.value || part.item?.pcfWattage?.value || "Standard Component"}
                    </div>
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: COLORS.textMain }}>
                    {/* Added optional chaining here */}
                    €{part.item?.selectedVariant?.price?.amount || part.item?.variants.edges[0].node.price.amount}
                  </div>
                </div>
              ))}

              {/* UPSELL SECTION */}
              <div style={{ marginTop: "20px" }}>
                <h3 style={{ color: COLORS.textMain, fontSize: "18px", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "10px", marginBottom: "15px" }}>Add Extras</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <UpsellRow label="2nd Graphics Card" item={gpu2} onAdd={() => setAddingExtra("gpu2")} onRemove={() => setGpu2(null)} isAdding={addingExtra === "gpu2"} />
                  {addingExtra === "gpu2" && !gpu2 && <UpsellDropdown type="gpu" onSelect={(p:any) => {setGpu2(p); setAddingExtra(null);}} products={products} />}
                  
                  <UpsellRow label="2nd Storage (SSD)" item={ssd2} onAdd={() => setAddingExtra("ssd2")} onRemove={() => setSsd2(null)} isAdding={addingExtra === "ssd2"} />
                  {addingExtra === "ssd2" && !ssd2 && <UpsellDropdown type="ssd" onSelect={(p:any) => {setSsd2(p); setAddingExtra(null);}} products={products} />}
                  
                  <UpsellRow label="Mass Storage (HDD)" item={hdd2} onAdd={() => setAddingExtra("hdd2")} onRemove={() => setHdd2(null)} isAdding={addingExtra === "hdd2"} />
                  {addingExtra === "hdd2" && !hdd2 && <UpsellDropdown type="hdd" onSelect={(p:any) => {setHdd2(p); setAddingExtra(null);}} products={products} />}
                </div>
              </div>

            </div>

          // COMPONENT SELECTION (Carousel)
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onPointerCancel={handlePointerUp}
                style={{ position: "relative", width: "100%", height: isMobile ? "350px" : "450px", touchAction: "pan-y", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {currentProducts.map((p, idx) => {
                  const baseOffset = getOffset(idx);
                  const exactOffset = baseOffset + (dragOffset / (isMobile ? 120 : 250));
                  const { transform, opacity, zIndex } = getCardStyle(exactOffset, isMobile);
                  const isActive = baseOffset === 0;

                  return (
                    <div key={p.id} onClick={() => { if(isActive) handleSelection(p); else setActiveIndex(idx); }}
                      style={{ ...cardStyle, transform, opacity, zIndex, border: isActive ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}` }}>
                      
                      <div style={{ height: "50%", width: "100%", background: COLORS.bgDark, borderRadius: "8px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "15px" }}>
                        {p.featuredImage ? <img src={p.featuredImage.url} style={{ width: "100%", height: "100%", objectFit: "contain" }} draggable="false" /> : <span>📦</span>}
                      </div>
                      
                      <h3 style={{ fontSize: "14px", margin: "0 0 10px 0", color: COLORS.textMain, fontWeight: "600", lineHeight: "1.3" }}>{p.title}</h3>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: isActive ? COLORS.accent : COLORS.textMain, marginTop: "auto" }}>
                        €{p.variants.edges[0].node.price.amount}
                      </div>
                      
                      {isActive && <div style={{ fontSize: "10px", color: COLORS.textMuted, marginTop: "10px", letterSpacing: "1px" }}>CLICK TO SELECT</div>}
                    </div>
                  );
                })}
              </div>

              {/* Variant Selector */}
              {activeProduct?.variants.edges.length > 1 && (
                <select value={selectedVarId} onChange={(e) => setSelectedVarId(e.target.value)} 
                  style={{ marginTop: "20px", width: "250px", padding: "12px", borderRadius: "8px", border: `1px solid ${COLORS.border}`, background: COLORS.bgCard, color: COLORS.textMain, outline: "none", cursor: "pointer" }}>
                  {activeProduct.variants.edges.map((v: any) => (
                    <option key={v.node.id} value={v.node.id}>{v.node.title !== "Default Title" ? v.node.title : "Standard"}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: ORDER SUMMARY SIDEBAR --- */}
        <div style={{ width: isMobile ? "100%" : "380px", flexShrink: 0 }}>
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "16px", padding: "30px", position: isMobile ? "relative" : "sticky", top: "40px" }}>
            
            <div style={{ fontSize: "12px", color: COLORS.textMuted, fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "5px" }}>
              Estimated Total
            </div>
            <div style={{ fontSize: "42px", fontWeight: "800", color: COLORS.textMain, marginBottom: "30px", display: "flex", alignItems: "baseline" }}>
              €{currentTotal().toFixed(2)}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" }}>
              {selectedPartsList.map(part => (
                <MiniSidebarRow key={part.key} label={part.label} item={part.item} />
              ))}
              {isReviewStep && (
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ width: "40px", height: "40px", background: COLORS.bgDark, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🛠️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", color: COLORS.textMuted, textTransform: "uppercase" }}>SERVICE</div>
                    <div style={{ fontSize: "12px", color: COLORS.textMain, fontWeight: "bold" }}>Professional Assembly</div>
                  </div>
                  <div style={{ fontSize: "12px", color: COLORS.textMuted }}>€{ASSEMBLY_FEE.toFixed(2)}</div>
                </div>
              )}
            </div>
            
            {bottleneckWarning && <div style={warningStyle}>{bottleneckWarning}</div>}
            
            <div style={{ marginBottom: "25px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: COLORS.textMuted, marginBottom: "8px" }}>
                <span>Power Draw:</span> <span>{estimatedDraw}W / {psuCapacity || "---"}W</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: COLORS.bgDark, borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${powerPercentage}%`, height: "100%", background: psuCapacity > 0 && estimatedDraw >= psuCapacity ? "#ff4d4d" : COLORS.accent, transition: "width 0.4s ease" }} />
              </div>
            </div>

            <button disabled={isProcessing} onClick={handleCheckout} style={{ ...checkoutBtnStyle, background: COLORS.accent, color: "#000" }}>
              🛒 {isProcessing ? "Processing..." : "Add to Cart"}
            </button>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <div style={trustBadgeStyle}>
                <span style={{ fontSize: "16px", color: COLORS.accent }}>🚚</span>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "bold", color: COLORS.textMain }}>Free Shipping</div>
                  <div style={{ fontSize: "9px", color: COLORS.textMuted }}>3-5 business days</div>
                </div>
              </div>
              <div style={trustBadgeStyle}>
                <span style={{ fontSize: "16px", color: COLORS.accent }}>🛡️</span>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "bold", color: COLORS.textMain }}>2-Year Warranty</div>
                  <div style={{ fontSize: "9px", color: COLORS.textMuted }}>Full coverage</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function MiniSidebarRow({ label, item }: { label: string, item: any }) {
  if (!item) return null;
  const price = item.selectedVariant?.price?.amount || item.variants.edges[0].node.price.amount;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
      <div style={{ width: "40px", height: "40px", background: COLORS.bgDark, borderRadius: "6px", padding: "4px", flexShrink: 0 }}>
        {item.featuredImage ? <img src={item.featuredImage.url} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <div style={{width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center"}}>📦</div>}
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ fontSize: "10px", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        <div style={{ fontSize: "12px", color: COLORS.textMain, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.title}
        </div>
      </div>
      <div style={{ fontSize: "12px", color: COLORS.textMuted }}>
        €{price}
      </div>
    </div>
  );
}

function UpsellRow({ label, item, onAdd, onRemove, isAdding }: any) {
  if (!item) {
    return (
      <button onClick={onAdd} style={{ width: "100%", padding: "15px", border: `1px dashed ${COLORS.border}`, background: "transparent", color: COLORS.textMain, fontWeight: "bold", borderRadius: "12px", cursor: "pointer", textAlign: "left", fontSize: "14px", transition: "0.2s" }}>
        {isAdding ? "Cancel" : `➕ Add ${label}`}
      </button>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", borderRadius: "12px", background: COLORS.bgDark, border: `1px solid ${COLORS.border}`, fontSize: "14px" }}>
      <span><strong>{label}:</strong> {item.title}</span>
      <button onClick={onRemove} style={{ color: "#ff4d4d", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }}>✖ Remove</button>
    </div>
  );
}

function UpsellDropdown({ type, onSelect, products }: any) {
  const options = products.filter((p:any) => p.pcfType?.value === type).sort((a:any, b:any) => Number(b.variants.edges[0].node.price.amount) - Number(a.variants.edges[0].node.price.amount));
  return (
    <div style={{ marginTop: "10px", maxHeight: "250px", overflowY: "auto", background: COLORS.bgDark, border: `1px solid ${COLORS.border}`, borderRadius: "12px" }}>
      {options.map((p:any) => (
        <div key={p.id}>
          {p.variants.edges.map((v:any) => (
            <button key={v.node.id} onClick={() => onSelect({...p, selectedVariant: v.node})} 
              style={{ width: "100%", padding: "15px 20px", border: "none", borderBottom: `1px solid ${COLORS.border}`, background: "none", color: COLORS.textMain, display: "flex", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}>
              <span>{p.title} {v.node.title !== "Default Title" ? `(${v.node.title})` : ""}</span> 
              <span style={{ color: COLORS.accent, fontWeight: "bold" }}>€{v.node.price.amount}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- STYLES ---
const navBtnStyle: CSSProperties = { padding: "10px 20px", borderRadius: "8px", background: COLORS.bgCard, color: COLORS.textMain, border: `1px solid ${COLORS.border}`, cursor: "pointer", fontWeight: "bold", fontSize: "12px" };
const brandBtnStyle: CSSProperties = { width: "100%", maxWidth: "300px", height: "180px", fontSize: "28px", fontWeight: "bold", color: COLORS.textMain, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "16px", cursor: "pointer", transition: "0.2s" };
const navArrowStyle: CSSProperties = { background: COLORS.bgDark, border: `1px solid ${COLORS.border}`, color: COLORS.textMain, borderRadius: "50%", cursor: "pointer", width: "50px", height: "50px", fontSize: "24px", position: "absolute", zIndex: 50 };
const cardStyle: CSSProperties = { position: "absolute", width: "260px", height: "340px", background: COLORS.bgCard, borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", cursor: "pointer", userSelect: "none" };
const warningStyle: CSSProperties = { marginBottom: "20px", padding: "12px", background: "rgba(245, 158, 11, 0.1)", border: `1px solid rgba(245, 158, 11, 0.3)`, color: COLORS.accent, borderRadius: "8px", fontSize: "12px", lineHeight: "1.4" };
const checkoutBtnStyle: CSSProperties = { width: "100%", padding: "20px", fontWeight: "800", cursor: "pointer", borderRadius: "12px", fontSize: "18px", border: "none" };
const trustBadgeStyle: CSSProperties = { flex: 1, display: "flex", alignItems: "center", gap: "10px", background: COLORS.bgDark, border: `1px solid ${COLORS.border}`, padding: "12px", borderRadius: "12px" };

export default function Builder() { 
  return (
    <Suspense fallback={<div style={{color: "white", padding: "100px", textAlign: "center", background: COLORS.bgMain, minHeight: "100vh"}}>Loading Application...</div>}>
      <BuilderContent />
    </Suspense>
  ); 
}