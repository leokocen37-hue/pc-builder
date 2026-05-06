"use client";

import { CSSProperties, useEffect, useState, Suspense, useRef } from "react";
import { shopifyFetch } from "@/lib/shopify";
import { useSearchParams, useRouter } from "next/navigation";

// --- TYPES ---
type ProductNode = {
  id: string;
  title: string;
  featuredImage?: { url: string; altText?: string };
  variants: { 
    edges: { 
      node: { 
        id: string; 
        title: string; 
        price: { amount: string } 
      } 
    }[] 
  };
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

type Step = 
  | "brand" 
  | "cpu" 
  | "motherboard" 
  | "ram" 
  | "gpu" 
  | "ssd" 
  | "hdd" 
  | "case" 
  | "psu" 
  | "cooler" 
  | "os" 
  | "review";

const STEPS: Step[] = [
  "brand", 
  "cpu", 
  "motherboard", 
  "ram", 
  "gpu", 
  "ssd", 
  "hdd", 
  "case", 
  "psu", 
  "cooler", 
  "os", 
  "review"
];

const STEP_LABELS: Record<Step, string> = {
  brand: "Platforma", 
  cpu: "Procesor", 
  motherboard: "Matična ploča", 
  ram: "Radna memorija",
  gpu: "Grafička kartica", 
  ssd: "Glavni SSD", 
  hdd: "Tvrdi disk (Opcionalno)", 
  case: "Kućište",
  psu: "Napajanje", 
  cooler: "Hladnjak procesora", 
  os: "Operativni sustav (Opcionalno)", 
  review: "Pregled Konfiguracije"
};

const ASSEMBLY_FEE = 200;

// --- COLOR PALETTE ---
const COLORS = {
  bgMain: "#0a0c10",
  bgCard: "#161b22",
  bgDark: "#010409",
  border: "#30363d",
  textMain: "#f0f6fc",
  textMuted: "#8b949e",
  accent: "#B500B5"
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

  // --- HARDWARE LOGIC ---
  const calculateSystemTDP = () => {
    const parts = [cpu, mb, ram, gpu, gpu2, pcCase, cooler];
    const componentsDraw = parts.reduce((sum, part) => {
      return sum + Number(part?.pcfTdp?.value || 0);
    }, 0);
    return componentsDraw + 150; // Requested: 150W base overhead
  };

  const estimatedDraw = calculateSystemTDP();
  const psuCapacity = Number(psu?.pcfWattage?.value || 0);
  
  let powerPercentage = 50;
  if (psuCapacity > 0) {
    powerPercentage = Math.min((estimatedDraw / psuCapacity) * 100, 100);
  } else {
    powerPercentage = Math.min((estimatedDraw / 1000) * 100, 100);
  }

  const getQualityScore = (quality?: string) => {
    const q = (quality || "").toLowerCase();
    if (q === "excellent") return 4;
    if (q === "very good") return 3;
    if (q === "good") return 2;
    if (q === "average") return 1;
    return 0;
  };

  const getBadgeStyle = (badgeText: string) => {
    const t = badgeText.toLowerCase();
    if (t.includes("ultimativni") || t.includes("apsolutni") || t.includes("vrh")) {
      return { bg: "linear-gradient(135deg, #6f42c1, #8a2be2)", color: "#fff" }; 
    }
    if (t.includes("best buy") || t.includes("kralj")) {
      return { bg: "linear-gradient(135deg, #fd7e14, #ff851b)", color: "#fff" }; 
    }
    if (t.includes("standard") || t.includes("zlatna")) {
      return { bg: "linear-gradient(135deg, #ffc107, #ffb300)", color: "#000" }; 
    }
    if (t.includes("premium") || t.includes("zvijer")) {
      return { bg: "linear-gradient(135deg, #6c757d, #495057)", color: "#fff" }; 
    }
    return { bg: "linear-gradient(135deg, #007bff, #0056b3)", color: "#fff" }; 
  };

  const checkBottleneck = () => {
    if (!cpu || !gpu) return null;
    const cpuScore = getQualityScore(cpu.pcfQuality?.value);
    const gpuScore = getQualityScore(gpu.pcfQuality?.value);
    
    if (gpuScore >= 3 && cpuScore <= 2 && (gpuScore - cpuScore >= 2)) {
      return "⚠️ Upozorenje (Bottleneck): Vaš procesor je preslab za odabranu grafičku karticu.";
    }
    return null;
  };

  const bottleneckWarning = checkBottleneck();

  // --- DATA FETCHING & EFFECTS ---
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
                  id
                  title
                  featuredImage { url altText }
                  variants(first: 50) { 
                    edges { 
                      node { 
                        id 
                        title 
                        price { amount } 
                      } 
                    } 
                  }
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
        
        if (!data || !data.products) {
          throw new Error("Shopify didn't return a valid products object.");
        }

        const allProducts = data.products.edges.map((e: any) => e.node);
        setProducts(allProducts);
        
        const loadParam = (param: string, setter: any) => {
          const val = searchParams.get(param);
          if (!val) return;
          
          const found = allProducts.find((p: any) => 
            p.id === val || p.variants.edges.some((v: any) => v.node.id === val)
          );
          
          if (found) {
            const varNode = found.variants.edges.find((v: any) => v.node.id === val)?.node || found.variants.edges[0].node;
            setter({ ...found, selectedVariant: varNode });
          }
        };

        const uBrand = searchParams.get("brand");
        if (uBrand) setBrand(uBrand);

        loadParam("cpu", setCpu); 
        loadParam("mb", setMb); 
        loadParam("ram", setRam);
        loadParam("gpu", setGpu); 
        loadParam("gpu2", setGpu2); 
        loadParam("ssd", setSsd); 
        loadParam("ssd2", setSsd2);
        loadParam("hdd", setHdd); 
        loadParam("hdd2", setHdd2);
        loadParam("case", setPcCase); 
        loadParam("psu", setPsu); 
        loadParam("cooler", setCooler); 
        loadParam("os", setOs);

        if (searchParams.get("cpu") && searchParams.get("case")) {
          setStepIndex(STEPS.indexOf("review"));
        }
      } catch (err: any) { 
        setErrorMessage(err.message || "Unknown error occurred while fetching.");
      } finally { 
        setLoading(false); 
        initialized.current = true; 
      }
    }
    
    fetchAndSync();
  }, [searchParams]);

  useEffect(() => {
    setActiveIndex(0);
    setDragOffset(0);
  }, [stepIndex]);

  // --- CAROUSEL LOGIC & FILTERING ---
  const currentStep = STEPS[stepIndex];
  
  const currentProducts = products.filter(p => {
    const type = p.pcfType?.value;
    
    if (currentStep === "cpu") {
      return type === "cpu" && p.pcfBrand?.value === brand;
    }
    if (currentStep === "motherboard") {
      return type === "motherboard" && p.pcfSocket?.value === cpu?.pcfSocket?.value;
    }
    if (currentStep === "ram") {
      return type === "ram" && p.pcfRamType?.value === mb?.pcfRamType?.value;
    }
    if (currentStep === "gpu") {
      return type === "gpu";
    }
    if (currentStep === "ssd") {
      return type === "ssd";
    }
    if (currentStep === "hdd") {
      return type === "hdd";
    }
    if (currentStep === "case") {
      if (type !== "case") return false;
      const supported = p.pcfSupportedFormFactors?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
      const mbFits = supported.includes((mb?.pcfFormFactor?.value || "").toLowerCase());
      
      const gpuLength1 = Number(gpu?.pcfGpuLength?.value || 0);
      const gpuLength2 = Number(gpu2?.pcfGpuLength?.value || 0);
      const maxGpuLength = Math.max(gpuLength1, gpuLength2);
      
      const caseAllowsGpu = maxGpuLength <= Number(p.pcfMaxGpuLength?.value || 0);
      
      return mbFits && caseAllowsGpu;
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
    if (currentStep === "os") {
      return type === "os";
    }
    
    return false;
  }).sort((a, b) => {
    const wA = getQualityScore(a.pcfQuality?.value);
    const wB = getQualityScore(b.pcfQuality?.value);
    if (wB !== wA) return wB - wA; 
    
    const priceA = Number(a.variants.edges[0]?.node.price.amount || 0);
    const priceB = Number(b.variants.edges[0]?.node.price.amount || 0);
    return priceB - priceA; 
  });

  const activeProduct = currentProducts[activeIndex];

  useEffect(() => {
    if (activeProduct) {
      setSelectedVarId(activeProduct.variants.edges[0].node.id);
    }
  }, [activeProduct]);

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
    
    const baseOffset1 = isMobile ? 110 : 220;
    const baseOffset2 = isMobile ? 170 : 380;

    let translateX = 0;
    let scale = 1.1;
    let opacity = 1;
    let zIndex = 10;

    if (absOffset <= 1) {
      translateX = exactOffset * baseOffset1;
      scale = 1.1 - (0.25 * absOffset);
      opacity = 1 - (0.4 * absOffset);
      zIndex = 10 - Math.round(absOffset * 5);
    } else if (absOffset <= 2) {
      const fraction = absOffset - 1;
      translateX = sign * (baseOffset1 + fraction * (baseOffset2 - baseOffset1));
      scale = 0.85 - (0.15 * fraction);
      opacity = 0.6 - (isMobile ? 0.6 : 0.3) * fraction;
      zIndex = 5 - Math.round(fraction * 3);
    } else {
      translateX = sign * (baseOffset2 + (absOffset - 2) * 100);
      scale = 0.7 - (0.2 * (absOffset - 2));
      opacity = 0;
      zIndex = 0;
    }

    return { 
      transform: `translateX(${translateX}px) scale(${scale})`, 
      opacity: Math.max(0, opacity), 
      zIndex: Math.max(0, zIndex),
      transition: isDragging ? "none" : "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)"
    };
  };

  // --- INTERACTION & DRAG PHYSICS ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setStartX(e.clientX);
    setDragOffset(0);
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX === null) return;
    const diff = e.clientX - startX;
    const slideWidth = isMobile ? 110 : 220; 
    
    const jumps = Math.trunc(diff / slideWidth);

    if (jumps !== 0) {
      setActiveIndex((prev) => {
        let next = prev - jumps;
        while (next < 0) next += currentProducts.length; 
        return next % currentProducts.length;
      });
      setStartX((prev) => (prev !== null ? prev + jumps * slideWidth : e.clientX));
      setDragOffset(diff - jumps * slideWidth);
    } else {
      setDragOffset(diff);
    }

    if (Math.abs(diff) > 15) { 
      setIsDragging(true); 
    }
  };

  const handlePointerUp = () => {
    if (startX !== null) {
      const slideWidth = isMobile ? 110 : 220;
      let newActiveIndex = activeIndex;
      let didSnap = false;
      
      if (dragOffset > slideWidth / 3) {
        newActiveIndex = (activeIndex - 1 + currentProducts.length) % currentProducts.length;
        didSnap = true;
      } else if (dragOffset < -slideWidth / 3) {
        newActiveIndex = (activeIndex + 1) % currentProducts.length;
        didSnap = true;
      }
      
      setActiveIndex(newActiveIndex);

      // Requested Feature: Auto-select item if dragging resulted in a snap
      if (didSnap) {
        const snappedProduct = currentProducts[newActiveIndex];
        if (snappedProduct) {
          // Slight timeout to let the snap animation finish before moving to next step
          setTimeout(() => {
            handleSelection(currentStep, snappedProduct);
          }, 400); 
        }
      }
    }
    setDragOffset(0); 
    setStartX(null);
    setTimeout(() => setIsDragging(false), 50); 
  };

  const handleSelection = (type: string, p: ProductNode) => {
    if (isDragging) return;
    
    const variantNode = p.variants.edges.find((v: any) => v.node.id === selectedVarId)?.node || p.variants.edges[0].node;
    const productWithVariant = { ...p, selectedVariant: variantNode };

    if (type === "cpu") setCpu(productWithVariant);
    else if (type === "motherboard") setMb(productWithVariant); 
    else if (type === "ram") setRam(productWithVariant);
    else if (type === "gpu") setGpu(productWithVariant);
    else if (type === "ssd") setSsd(productWithVariant);
    else if (type === "hdd") setHdd(productWithVariant);
    else if (type === "case") setPcCase(productWithVariant); 
    else if (type === "psu") setPsu(productWithVariant);
    else if (type === "cooler") setCooler(productWithVariant);
    else if (type === "os") setOs(productWithVariant);
    
    setStepIndex((prev) => prev + 1);
    setActiveIndex(0);
  };

  const handleSkip = () => {
    if (currentStep === "hdd") setHdd(null);
    if (currentStep === "os") setOs(null);
    setStepIndex((prev) => prev + 1);
    setActiveIndex(0);
  };

  const resetBuild = () => {
    // 1. Reset all state to null
    setStepIndex(0);
    setBrand(null); 
    setCpu(null); 
    setMb(null); 
    setRam(null); 
    setGpu(null); 
    setGpu2(null); 
    setSsd(null); 
    setSsd2(null); 
    setHdd(null); 
    setHdd2(null); 
    setPcCase(null); 
    setPsu(null); 
    setCooler(null); 
    setOs(null); 
    setAddingExtra(null);
    
    // 2. Erase the URL entirely to drop the parameters completely
    window.history.replaceState(null, '', window.location.pathname);
  };

  const currentTotal = () => {
    const parts = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os];
    const compPrice = parts.reduce((sum, p) => {
      return sum + Number(p?.selectedVariant?.price?.amount || p?.variants?.edges[0]?.node.price.amount || 0);
    }, 0);
    
    return isReviewStep ? compPrice + ASSEMBLY_FEE : compPrice;
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    
    const parts = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os];
    const summary = parts
      .filter(Boolean)
      .map(p => {
        const varTitle = p?.selectedVariant && p?.selectedVariant?.title !== 'Default Title' ? ` (${p?.selectedVariant?.title})` : '';
        return `${p?.title}${varTitle}`;
      })
      .join(", ");
      
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          totalPrice: currentTotal(), 
          summary: summary 
        }),
      });
      
      const data = await res.json();
      
      if (data.draftOrder?.invoiceUrl) {
        window.location.href = data.draftOrder.invoiceUrl;
      } else { 
        alert("Dogodila se greška pri kreiranju narudžbe."); 
        setIsProcessing(false); 
      }
    } catch (error) {
      alert("Serverska greška.");
      setIsProcessing(false);
    }
  };

  const selectedPartsList = [
    { key: "cpu", label: "PROCESOR", item: cpu },
    { key: "gpu", label: "GRAFIČKA KARTICA", item: gpu },
    { key: "gpu2", label: "2. GRAFIČKA KARTICA", item: gpu2 },
    { key: "mb", label: "MATIČNA PLOČA", item: mb },
    { key: "ram", label: "RADNA MEMORIJA", item: ram },
    { key: "ssd", label: "GLAVNI SSD", item: ssd },
    { key: "ssd2", label: "DODATNI SSD", item: ssd2 },
    { key: "hdd", label: "TVRDI DISK", item: hdd },
    { key: "hdd2", label: "DODATNI HDD", item: hdd2 },
    { key: "psu", label: "NAPAJANJE", item: psu },
    { key: "case", label: "KUĆIŠTE", item: pcCase },
    { key: "cooler", label: "HLAĐENJE", item: cooler },
    { key: "os", label: "OPERATIVNI SUSTAV", item: os }
  ].filter(p => p.item);

  // --- UI RENDERING ---
  if (loading) {
    return (
      <div style={{ padding: "100px", textAlign: "center", color: "white" }}>
        Učitavanje komponenti...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={{ padding: "50px", textAlign: "center", color: "white", minHeight: "100vh", background: "#222" }}>
        <h2 style={{ color: "#ff4d4d" }}>Problem sa spajanjem</h2>
        <p>Aplikacija se trenutno ne može povezati sa serverom.</p>
        <p style={{ fontSize: "12px", color: "#888" }}>({errorMessage})</p>
      </div>
    );
  }

  const containerStyle: CSSProperties = {
    background: COLORS.bgMain,
    minHeight: '100vh', 
    width: '100%', 
    color: '#fff', 
    padding: isMobile ? '20px 10px' : '40px 20px', 
    transition: 'background 0.5s ease', 
    overflowX: "hidden" as const
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", maxWidth: "1400px", margin: "0 auto", gap: isMobile ? "20px" : "40px" }}>
        
        {/* === LEFT MAIN AREA === */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", minHeight: isMobile ? "auto" : "80vh", position: "relative" }}>
          
          {/* Header */}
          {!isReviewStep && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: COLORS.bgCard, padding: "15px 30px", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? "18px" : "24px", textTransform: "uppercase", letterSpacing: "2px" }}>
                {STEP_LABELS[currentStep]}
              </h1>
            </div>
          )}

          {/* Navigation Bar */}
          {stepIndex > 0 && !isReviewStep && (
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  onClick={() => setStepIndex(stepIndex - 1)} 
                  style={{ ...navBtnStyle, background: COLORS.bgCard }}
                >
                  ← NAZAD
                </button>
                <button 
                  onClick={resetBuild} 
                  style={{ ...navBtnStyle, background: COLORS.bgCard, color: "#ff4d4d" }}
                >
                  🔄 ISPOČETKA
                </button>
              </div>
              {["hdd", "os"].includes(currentStep) && (
                <button 
                  onClick={handleSkip} 
                  style={{ ...navBtnStyle, background: COLORS.bgCard, color: COLORS.textMuted }}
                >
                  PRESKOČI ⏭
                </button>
              )}
            </div>
          )}

          {/* --- STEP 0: BRAND --- */}
          {currentStep === "brand" && (
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "30px", justifyContent: "center", alignItems: "center", flex: 1 }}>
              <button 
                onClick={() => { setBrand("intel"); setStepIndex(1); }} 
                style={{ ...brandBtnStyle, borderTop: "4px solid #0066cc" }}
              >
                INTEL
              </button>
              <button 
                onClick={() => { setBrand("amd"); setStepIndex(1); }} 
                style={{ ...brandBtnStyle, borderTop: "4px solid #cc4400" }}
              >
                AMD
              </button>
            </div>
          )}

          {/* --- MIDDLE STEPS: CAROUSEL --- */}
          {stepIndex > 0 && stepIndex < STEPS.length - 1 && currentProducts.length > 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" }}>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: isMobile ? "300px" : "400px", position: "relative" }}>
                
                <button 
                  onClick={() => setActiveIndex((activeIndex - 1 + currentProducts.length) % currentProducts.length)} 
                  style={{ ...navArrowStyle, left: isMobile ? "5px" : "0" }}
                >
                  &lt;
                </button>

                {/* Physics Wrapper */}
                <div 
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp} 
                  onPointerCancel={handlePointerUp}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", position: "relative", touchAction: "pan-y" }}
                >
                  {currentProducts.map((p, idx) => {
                    const baseOffset = getOffset(idx);
                    const slideWidth = isMobile ? 110 : 220; 
                    const exactOffset = baseOffset + (dragOffset / slideWidth);
                    
                    const { transform, opacity, zIndex } = getCardStyle(exactOffset, isMobile);
                    const isVisible = opacity > 0;
                    const isActive = baseOffset === 0 && !isDragging; 

                    if (!isVisible && !isDragging) return <div key={p.id} style={{ display: "none" }} />;
                    
                    const badgeStyle = p.pcfBadge?.value ? getBadgeStyle(p.pcfBadge.value) : null;

                    return (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          if (isDragging) return; 
                          if (baseOffset === 0) {
                            handleSelection(currentStep, p);
                          } else {
                            setActiveIndex(idx);
                          }
                        }}
                        style={{
                          ...cardStyle,
                          width: isMobile ? "160px" : "220px",
                          height: isMobile ? "210px" : "260px",
                          border: isActive ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
                          padding: isMobile ? "10px" : "20px 15px",
                          opacity: opacity,
                          zIndex: zIndex,
                          transform: transform,
                          boxShadow: isActive ? `0 15px 35px rgba(0,0,0,0.6)` : "0 5px 15px rgba(0,0,0,0.3)",
                        }}
                      >
                         {p.featuredImage ? (
                           <img 
                             draggable="false" 
                             src={p.featuredImage.url} 
                             alt={p.title} 
                             style={{ width: "100%", height: "55%", objectFit: "contain", marginBottom: "5px", pointerEvents: "none" }} 
                           />
                         ) : (
                           <div style={{ width: "100%", height: "55%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", borderRadius: "8px", marginBottom: "5px", pointerEvents: "none" }}>
                             <span style={{ fontSize: isMobile ? "30px" : "50px" }}>📦</span>
                           </div>
                         )}

                         <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", width: "100%", pointerEvents: "none" }}>
                            {p.pcfBadge?.value && badgeStyle && (
                               <span style={{
                                   ...badgeBase,
                                   background: badgeStyle.bg,
                                   color: badgeStyle.color,
                                   fontSize: isMobile ? "9px" : "10px",
                               }}>
                                   {p.pcfBadge.value}
                               </span>
                            )}
                            <h3 style={{ fontSize: isMobile ? "12px" : "14px", margin: 0, fontWeight: "600", color: isActive ? "#fff" : "#aaa", lineHeight: "1.2" }}>
                              {p.title}
                            </h3>
                         </div>
                         
                         {isActive && (
                            <div style={{ position: "absolute", bottom: isMobile ? "-25px" : "-30px", fontSize: isMobile ? "11px" : "13px", color: COLORS.accent, fontWeight: "bold", opacity: 0.9, letterSpacing: "1px", pointerEvents: "none" }}>
                               KLIKNI ZA ODABIR
                            </div>
                         )}
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={() => setActiveIndex((activeIndex + 1) % currentProducts.length)} 
                  style={{ ...navArrowStyle, right: isMobile ? "5px" : "0" }}
                >
                  &gt;
                </button>
              </div>

              {/* Variants and Price Selection */}
              <div style={{ marginTop: isMobile ? "10px" : "20px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                 {activeProduct?.variants.edges.length > 1 && (
                    <select 
                      value={selectedVarId} 
                      onChange={(e) => setSelectedVarId(e.target.value)} 
                      style={{ 
                        width: isMobile ? "100%" : "250px", 
                        padding: "12px", 
                        borderRadius: "8px", 
                        border: `1px solid ${COLORS.border}`, 
                        background: COLORS.bgCard, 
                        color: "#fff", 
                        marginBottom: "15px", 
                        fontSize: isMobile ? "14px" : "16px", 
                        outline: "none", 
                        cursor: "pointer", 
                        textAlign: "center" 
                      }}
                    >
                      {activeProduct.variants.edges.map((v: any) => (
                        <option key={v.node.id} value={v.node.id}>
                          {v.node.title !== "Default Title" ? v.node.title : "Standard"}
                        </option>
                      ))}
                    </select>
                 )}
                 <div style={{ fontSize: isMobile ? "28px" : "36px", fontWeight: "900", color: COLORS.accent, textShadow: "0px 2px 10px rgba(0,0,0,0.5)" }}>
                    €{Number(activeProduct?.variants.edges.find((v:any) => v.node.id === selectedVarId)?.node.price.amount || activeProduct?.variants.edges[0].node.price.amount || 0).toFixed(2)} 
                 </div>
              </div>

            </div>
          )}

          {/* --- FINAL STEP: REVIEW & UPSELLS --- */}
          {currentStep === "review" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px", paddingRight: isMobile ? "0" : "20px" }}>
              
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <button onClick={() => setStepIndex(stepIndex - 1)} style={navBtnStyle}>← NAZAD NA UREĐIVANJE</button>
                <button onClick={resetBuild} style={{ ...navBtnStyle, color: "#ff4d4d" }}>🔄 KRENI ISPOČETKA</button>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <div style={{ color: COLORS.accent, fontSize: "12px", fontWeight: "bold", letterSpacing: "1.5px", marginBottom: "5px" }}>KORAK PO KORAK</div>
                <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "700" }}>Pregled Konfiguracije</h1>
              </div>

              {selectedPartsList.map((part) => (
                <div key={part.key} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: isMobile ? "20px 15px" : "20px 30px", position: "relative", display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{ position: "absolute", top: "-10px", left: "20px", background: COLORS.border, padding: "4px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px", color: COLORS.textMuted }}>
                    {part.label}
                  </div>
                  <div style={{ width: "60px", height: "60px", background: COLORS.bgDark, borderRadius: "8px", padding: "5px", flexShrink: 0 }}>
                    <img src={part.item?.featuredImage?.url} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: COLORS.textMain }}>
                      {part.item?.title} {part.item?.selectedVariant && part.item?.selectedVariant.title !== "Default Title" ? `(${part.item?.selectedVariant.title})` : ""}
                    </div>
                    {/* Removed subtext completely from Review cards as requested */}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: COLORS.textMain }}>
                    €{part.item?.selectedVariant?.price?.amount || part.item?.variants.edges[0].node.price.amount}
                  </div>
                </div>
              ))}

              {/* Upsells Section */}
              <div style={{ marginTop: "20px" }}>
                <h3 style={{ color: COLORS.textMain, fontSize: "18px", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "10px", marginBottom: "15px" }}>
                  Dodatne Komponente
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <UpsellRow 
                    label="2. Grafička kartica" 
                    item={gpu2} 
                    onAdd={() => setAddingExtra(addingExtra === "gpu2" ? null : "gpu2")} 
                    onRemove={() => setGpu2(null)} 
                    isAdding={addingExtra === "gpu2"}
                  />
                  {addingExtra === "gpu2" && !gpu2 && (
                    <div style={dropdownStyle}>
                      {products.filter(p => p.pcfType?.value === "gpu").map(p => (
                        <div key={p.id}>
                          {p.variants.edges.map(v => (
                            <button 
                              key={v.node.id} 
                              style={dropdownItemStyle} 
                              onClick={() => { setGpu2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}
                            >
                              <span>{p.title} {v.node.title !== "Default Title" ? `(${v.node.title})` : ""}</span> 
                              <span style={{color: COLORS.accent, fontWeight: "bold"}}>€{v.node.price.amount}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  <UpsellRow 
                    label="Dodatni SSD" 
                    item={ssd2} 
                    onAdd={() => setAddingExtra(addingExtra === "ssd2" ? null : "ssd2")} 
                    onRemove={() => setSsd2(null)} 
                    isAdding={addingExtra === "ssd2"}
                  />
                  {addingExtra === "ssd2" && !ssd2 && (
                    <div style={dropdownStyle}>
                      {products.filter(p => p.pcfType?.value === "ssd").map(p => (
                        <div key={p.id}>
                          {p.variants.edges.map(v => (
                            <button 
                              key={v.node.id} 
                              style={dropdownItemStyle} 
                              onClick={() => { setSsd2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}
                            >
                              <span>{p.title} {v.node.title !== "Default Title" ? `(${v.node.title})` : ""}</span> 
                              <span style={{color: COLORS.accent, fontWeight: "bold"}}>€{v.node.price.amount}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  <UpsellRow 
                    label="Dodatni HDD" 
                    item={hdd2} 
                    onAdd={() => setAddingExtra(addingExtra === "hdd2" ? null : "hdd2")} 
                    onRemove={() => setHdd2(null)} 
                    isAdding={addingExtra === "hdd2"}
                  />
                  {addingExtra === "hdd2" && !hdd2 && (
                    <div style={dropdownStyle}>
                      {products.filter(p => p.pcfType?.value === "hdd").map(p => (
                        <div key={p.id}>
                          {p.variants.edges.map(v => (
                            <button 
                              key={v.node.id} 
                              style={dropdownItemStyle} 
                              onClick={() => { setHdd2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}
                            >
                              <span>{p.title} {v.node.title !== "Default Title" ? `(${v.node.title})` : ""}</span> 
                              <span style={{color: COLORS.accent, fontWeight: "bold"}}>€{v.node.price.amount}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === RIGHT SIDEBAR === */}
        <div style={{ width: isMobile ? "100%" : "380px", flexShrink: 0 }}>
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "16px", padding: "30px", position: isMobile ? "relative" : "sticky", top: "40px" }}>
            
            <div style={{ fontSize: "12px", color: COLORS.textMuted, fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "5px" }}>
              UKUPNA CIJENA
            </div>
            <div style={{ fontSize: "42px", fontWeight: "800", color: COLORS.textMain, marginBottom: "30px", display: "flex", alignItems: "baseline" }}>
              €{currentTotal().toFixed(2)}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" }}>
              {selectedPartsList.map(part => (
                <MiniSidebarRow key={part.key} label={part.label} item={part.item} />
              ))}
            </div>
            
            {bottleneckWarning && (
              <div style={warningStyle}>
                {bottleneckWarning}
              </div>
            )}

            <div style={{ marginBottom: "25px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: COLORS.textMuted, marginBottom: "8px" }}>
                <span>Potrošnja (W):</span> <span>{estimatedDraw}W / {psuCapacity || "---"}W</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: COLORS.bgDark, borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ 
                  width: `${powerPercentage}%`, 
                  height: "100%", 
                  background: psuCapacity > 0 && estimatedDraw >= psuCapacity ? "#ff4d4d" : COLORS.accent, 
                  transition: "width 0.4s ease" 
                }} />
              </div>
            </div>

            <button disabled={isProcessing} onClick={handleCheckout} style={{ ...checkoutBtnStyle, background: COLORS.accent, color: "#fff" }}>
              🛒 {isProcessing ? "Obrađujem..." : "Dodaj u košaricu"}
            </button>
            {/* Removed Trust Badges here as requested */}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function MiniSidebarRow({ label, item }: { label: string, item: ProductNode | null }) {
  if (!item) return null;
  const price = item.selectedVariant?.price?.amount || item.variants?.edges?.[0]?.node?.price?.amount || "0.00";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
      <div style={{ width: "40px", height: "40px", background: COLORS.bgDark, borderRadius: "6px", padding: "4px", flexShrink: 0 }}>
        {item.featuredImage?.url ? <img src={item.featuredImage.url} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <div style={{width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center"}}>📦</div>}
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

function UpsellRow({ label, item, onAdd, onRemove, isAdding }: { label: string, item: ProductNode | null, onAdd: () => void, onRemove: () => void, isAdding: boolean }) {
  if (!item) {
    return (
      <button 
        onClick={onAdd} 
        style={{ width: "100%", padding: "15px", border: `1px dashed ${COLORS.border}`, background: "transparent", color: COLORS.textMain, fontWeight: "bold", borderRadius: "12px", cursor: "pointer", textAlign: "left", fontSize: "14px", transition: "0.2s" }}
      >
        {isAdding ? "Odustani" : `➕ Dodaj: ${label}`}
      </button>
    );
  }
  
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", borderRadius: "12px", background: COLORS.bgDark, border: `1px solid ${COLORS.border}`, fontSize: "14px" }}>
      <span><strong>{label}:</strong> {item.title}</span>
      <button 
        onClick={onRemove} 
        style={{ color: "#ff4d4d", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }}
      >
        ✖ Ukloni
      </button>
    </div>
  );
}

// --- STYLES ---
const navBtnStyle: CSSProperties = { 
  padding: "10px 20px", 
  borderRadius: "8px", 
  background: COLORS.bgCard, 
  color: COLORS.textMain, 
  border: `1px solid ${COLORS.border}`, 
  cursor: "pointer", 
  fontWeight: "bold", 
  fontSize: "12px" 
};

const brandBtnStyle: CSSProperties = { 
  width: "100%", 
  maxWidth: "300px", 
  height: "180px", 
  fontSize: "28px", 
  fontWeight: "bold", 
  color: COLORS.textMain, 
  background: COLORS.bgCard, 
  border: `1px solid ${COLORS.border}`, 
  borderRadius: "16px", 
  cursor: "pointer", 
  transition: "0.2s" 
};

const navArrowStyle: CSSProperties = { 
  background: COLORS.bgDark, 
  border: `1px solid ${COLORS.border}`, 
  color: COLORS.textMain, 
  borderRadius: "50%", 
  cursor: "pointer", 
  width: "50px", 
  height: "50px", 
  fontSize: "24px", 
  position: "absolute", 
  zIndex: 50 
};

const cardStyle: CSSProperties = { 
  position: "absolute", 
  background: COLORS.bgCard, 
  borderRadius: "16px", 
  display: "flex", 
  flexDirection: "column", 
  cursor: "pointer", 
  userSelect: "none" 
};

const badgeBase: CSSProperties = { 
  position: "absolute", 
  top: "10px", 
  left: "10px", 
  padding: "3px 8px", 
  borderRadius: "12px", 
  fontWeight: "bold", 
  textTransform: "uppercase", 
  letterSpacing: "0.5px", 
  boxShadow: "0 2px 4px rgba(0,0,0,0.4)" 
};

const warningStyle: CSSProperties = { 
  marginBottom: "20px", 
  padding: "12px", 
  background: "rgba(245, 158, 11, 0.1)", 
  border: `1px solid rgba(245, 158, 11, 0.3)`, 
  color: COLORS.accent, 
  borderRadius: "8px", 
  fontSize: "12px", 
  lineHeight: "1.4" 
};

const checkoutBtnStyle: CSSProperties = { 
  width: "100%", 
  padding: "20px", 
  fontWeight: "800", 
  cursor: "pointer", 
  borderRadius: "12px", 
  fontSize: "18px", 
  border: "none" 
};

const dropdownStyle: CSSProperties = { 
  marginTop: "10px", 
  maxHeight: "250px", 
  overflowY: "auto", 
  border: `1px solid ${COLORS.border}`, 
  background: COLORS.bgDark,
  borderRadius: "12px" 
};

const dropdownItemStyle: CSSProperties = { 
  width: "100%", 
  display: "flex", 
  justifyContent: "space-between", 
  padding: "15px 20px", 
  border: "none", 
  borderBottom: `1px solid ${COLORS.border}`, 
  background: "transparent", 
  color: COLORS.textMain, 
  cursor: "pointer", 
  textAlign: "left" 
};

export default function Builder() { 
  return (
    <Suspense fallback={<div style={{color: "white", padding: "100px", textAlign: "center", background: COLORS.bgMain, minHeight: "100vh"}}>Učitavanje aplikacije...</div>}>
      <BuilderContent />
    </Suspense>
  ); 
}