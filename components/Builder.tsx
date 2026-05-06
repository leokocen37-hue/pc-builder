"use client";

import { CSSProperties, useEffect, useState, Suspense, useRef } from "react";
import { shopifyFetch } from "@/lib/shopify";
import { useSearchParams, useRouter } from "next/navigation";

// --- TIPOLOGIJA (TYPES) ---
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

// --- KONSTANTE (CONSTANTS) ---
const STEPS: Step[] = ["brand", "cpu", "motherboard", "ram", "gpu", "ssd", "hdd", "case", "psu", "cooler", "os", "review"];

const STEP_LABELS: Record<Step, string> = {
  brand: "Platformu", cpu: "Procesor", motherboard: "Matična ploča", ram: "Radna memorija",
  gpu: "Grafička kartica", ssd: "Glavni SSD", hdd: "Tvrdi disk (Opcionalno)", case: "Kućište",
  psu: "Napajanje", cooler: "Hladnjak procesora", os: "Operativni sustav (Opcionalno)", review: "Pregled"
};

const ASSEMBLY_FEE = 200;

function BuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialized = useRef(false);

  // --- STATE HOOKOVI (STATE) ---
  const [stepIndex, setStepIndex] = useState(0);
  const [products, setProducts] = useState<ProductNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Navigacija i Drag logika
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedVarId, setSelectedVarId] = useState("");
  const [startX, setStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Odabrane komponente
  const [addingExtra, setAddingExtra] = useState<"gpu2" | "ssd2" | "hdd2" | null>(null);
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

  const isReviewStep = STEPS[stepIndex] === "review";

  // --- POMOĆNE FUNKCIJE (HELPERS) ---
  const calculateSystemTDP = () => {
    const parts = [cpu, mb, ram, gpu, gpu2, pcCase, cooler];
    const componentsDraw = parts.reduce((sum, part) => sum + Number(part?.pcfTdp?.value || 0), 0);
    return componentsDraw + 100; 
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

  const getBadgeStyle = (badgeText: string) => {
    const t = badgeText.toLowerCase();
    if (t.includes("ultimativni") || t.includes("kompromisa") || t.includes("apsolutni") || t.includes("profesionalce") || t.includes("trezor") || t.includes("vrh")) 
      return { bg: "linear-gradient(135deg, #6f42c1, #8a2be2)", color: "#fff" }; 
    if (t.includes("best buy") || t.includes("kralj")) 
      return { bg: "linear-gradient(135deg, #fd7e14, #ff851b)", color: "#fff" }; 
    if (t.includes("zlatna") || t.includes("standard") || t.includes("radna stanica")) 
      return { bg: "linear-gradient(135deg, #ffc107, #ffb300)", color: "#000" }; 
    if (t.includes("budžet") || t.includes("osnovni") || t.includes("start")) 
      return { bg: "linear-gradient(135deg, #20c997, #12b886)", color: "#fff" }; 
    if (t.includes("premium") || t.includes("masivna") || t.includes("maksimalna") || t.includes("zvijer") || t.includes("čudovište")) 
      return { bg: "linear-gradient(135deg, #6c757d, #495057)", color: "#fff" }; 
    return { bg: "linear-gradient(135deg, #007bff, #0056b3)", color: "#fff" }; 
  };

  const checkBottleneck = () => {
    if (!cpu || !gpu) return null;
    const cpuScore = getQualityScore(cpu.pcfQuality?.value);
    const gpuScore = getQualityScore(gpu.pcfQuality?.value);
    if (gpuScore >= 3 && cpuScore <= 2 && (gpuScore - cpuScore >= 2)) return "⚠️ Upozorenje (Bottleneck): Vaš procesor je znatno slabiji od odabrane grafičke kartice.";
    if (cpuScore >= 4 && gpuScore <= 2) return "ℹ️ Napomena: Odabrali ste vrhunski procesor i budžet grafičku karticu.";
    return null;
  };

  const bottleneckWarning = checkBottleneck();

  // --- EFEKTI (EFFECTS) ---
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
  }, [stepIndex, brand, cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os, router]);

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
                  pcfType: metafield(namespace: "custom", key: "type") { value }
                  pcfBrand: metafield(namespace: "custom", key: "brand") { value }
                  pcfSocket: metafield(namespace: "custom", key: "socket") { value }
                  pcfTdp: metafield(namespace: "custom", key: "tdp") { value }
                  pcfRamType: metafield(namespace: "custom", key: "ram_type") { value }
                  pcfFormFactor: metafield(namespace: "custom", key: "form_factor") { value }
                  pcfSupportedFormFactors: metafield(namespace: "custom", key: "supported_form_factors") { value }
                  pcfMaxGpuLength: metafield(namespace: "custom", key: "max_gpu_length") { value }
                  pcfMaxCoolerHeight: metafield(namespace: "custom", key: "max_cooler_height") { value }
                  pcfWattage: metafield(namespace: "custom", key: "wattage") { value }
                  pcfCoolerHeight: metafield(namespace: "custom", key: "cooler_height") { value }
                  pcfMaxTdp: metafield(namespace: "custom", key: "max_tdp") { value }
                  pcfQuality: metafield(namespace: "custom", key: "quality") { value }
                  pcfBadge: metafield(namespace: "custom", key: "badge") { value }
                }
              }
            }
          }
        `);
        
        if (!data || !data.products) throw new Error("Shopify returned invalid data.");

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

        if (searchParams.get("cpu") && searchParams.get("gpu") && searchParams.get("case")) {
          setStepIndex(STEPS.indexOf("review"));
        }
      } catch (err: any) { 
        console.error("Fetch Error:", err); 
        setErrorMessage(err.message || "Unknown error occurred.");
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

  // --- FILTERIRANJE PROIZVODA (FILTERING) ---
  const currentStep = STEPS[stepIndex];
  const currentProducts = products.filter(p => {
    const type = p.pcfType?.value;
    if (currentStep === "cpu") return type === "cpu" && p.pcfBrand?.value === brand;
    if (currentStep === "motherboard") return type === "motherboard" && p.pcfSocket?.value === cpu?.pcfSocket?.value;
    if (currentStep === "ram") return type === "ram" && p.pcfRamType?.value === mb?.pcfRamType?.value;
    if (currentStep === "gpu") return type === "gpu";
    if (currentStep === "ssd") return type === "ssd";
    if (currentStep === "hdd") return type === "hdd";
    if (currentStep === "os") return type === "os";
    
    if (currentStep === "case") {
      if (type !== "case") return false;
      const supported = p.pcfSupportedFormFactors?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
      const mbFits = supported.includes((mb?.pcfFormFactor?.value || "").toLowerCase());
      const gpuLength = Math.max(Number(gpu?.pcfGpuLength?.value || 0), Number(gpu2?.pcfGpuLength?.value || 0));
      return mbFits && (gpuLength <= Number(p.pcfMaxGpuLength?.value || 0));
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
  }).sort((a, b) => {
    const wA = getQualityScore(a.pcfQuality?.value);
    const wB = getQualityScore(b.pcfQuality?.value);
    if (wB !== wA) return wB - wA; 
    const priceA = Number(a.variants.edges[0]?.node.price.amount || 0);
    const priceB = Number(b.variants.edges[0]?.node.price.amount || 0);
    if (priceB !== priceA) return priceB - priceA; 
    const tdpA = Number(a.pcfTdp?.value || 0);
    const tdpB = Number(b.pcfTdp?.value || 0);
    if (tdpB !== tdpA) return tdpB - tdpA;
    return a.title.localeCompare(b.title);
  });

  const activeProduct = currentProducts[activeIndex];

  useEffect(() => {
    if (activeProduct) {
      setSelectedVarId(activeProduct.variants.edges[0].node.id);
    }
  }, [activeProduct]);

  // --- KORISNIČKE AKCIJE (HANDLERS) ---
  const handleSelection = (type: string, p: ProductNode) => {
    if (type === "cpu") setCpu(p);
    else if (type === "motherboard") setMb(p); 
    else if (type === "ram") setRam(p);
    else if (type === "gpu") setGpu(p);
    else if (type === "ssd") setSsd(p);
    else if (type === "hdd") setHdd(p);
    else if (type === "case") setPcCase(p); 
    else if (type === "psu") setPsu(p);
    else if (type === "cooler") setCooler(p);
    else if (type === "os") setOs(p);
    setStepIndex((prev) => prev + 1);
  };

  const handleSkip = () => {
    if (STEPS[stepIndex] === "hdd") setHdd(null);
    if (STEPS[stepIndex] === "os") setOs(null);
    setStepIndex((prev) => prev + 1);
  };

  const resetBuild = () => {
    setStepIndex(0);
    setBrand(null); setCpu(null); setMb(null); setRam(null); 
    setGpu(null); setGpu2(null); setSsd(null); setSsd2(null); 
    setHdd(null); setHdd2(null); setPcCase(null); setPsu(null); 
    setCooler(null); setOs(null); setAddingExtra(null);
    router.replace(window.location.pathname, { scroll: false }); 
  };

  const shareBuild = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link za vašu konfiguraciju je uspješno kopiran!");
  };

  const currentTotal = () => {
    const compPrice = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os]
      .reduce((sum, p) => sum + Number(p?.selectedVariant?.price?.amount || p?.variants?.edges[0]?.node.price.amount || 0), 0);
    return isReviewStep ? compPrice + ASSEMBLY_FEE : compPrice;
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    const summary = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os]
      .filter(Boolean)
      .map(p => `${p?.title}${p?.selectedVariant && p?.selectedVariant?.title !== 'Default Title' ? ` (${p?.selectedVariant?.title})` : ''}`)
      .join(", ");
      
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalPrice: currentTotal(), summary }),
      });
      const data = await res.json();
      if (data.draftOrder?.invoiceUrl) {
        window.location.href = data.draftOrder.invoiceUrl;
      } else { 
        alert("Greška pri kreiranju narudžbe."); 
        setIsProcessing(false); 
      }
    } catch (error) {
      alert("Dogodila se serverska greška.");
      setIsProcessing(false);
    }
  };

  const getSortedExtras = (type: string) => {
    return products
      .filter(p => p.pcfType?.value === type)
      .sort((a, b) => Number(b.variants.edges[0]?.node.price.amount || 0) - Number(a.variants.edges[0]?.node.price.amount || 0));
  };

  // --- DRAG FIZIKA (CAROUSEL PHYSICS) ---
  const getCardStyle = (exactOffset: number, isMobile: boolean) => {
    const absOffset = Math.abs(exactOffset);
    const sign = Math.sign(exactOffset) || 1;
    const baseOffset1 = isMobile ? 110 : 220;
    const baseOffset2 = isMobile ? 170 : 380;
    let translateX = 0, scale = 1.1, opacity = 1, zIndex = 10;

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
      zIndex: Math.max(0, zIndex) 
    };
  };

  const getOffset = (index: number) => {
    const N = currentProducts.length;
    if (N === 0) return 0;
    let offset = ((index - activeIndex) % N + N) % N;
    if (offset > Math.floor(N / 2)) offset -= N;
    return offset;
  };

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
    if (Math.abs(diff) > 15) setIsDragging(true); 
  };

  const handlePointerUp = () => {
    if (startX !== null) {
      const slideWidth = isMobile ? 110 : 220;
      if (dragOffset > slideWidth / 3) {
        setActiveIndex((prev) => (prev - 1 + currentProducts.length) % currentProducts.length);
      } else if (dragOffset < -slideWidth / 3) {
        setActiveIndex((prev) => (prev + 1) % currentProducts.length);
      }
    }
    setDragOffset(0); 
    setStartX(null);
    setTimeout(() => setIsDragging(false), 50); 
  };

  // --- RENDERIRANJE (UI) ---
  if (loading) {
    return <div style={{ padding: "100px", textAlign: "center", color: "white" }}>Učitavanje komponenti...</div>;
  }

  if (errorMessage) {
    return (
      <div style={{ padding: "50px", textAlign: "center", color: "white", minHeight: "100vh", background: "#222" }}>
        <h2 style={{ color: "#ff4d4d" }}>Problem sa spajanjem</h2>
        <p>Aplikacija se trenutno ne može povezati sa serverom. Molimo pokušajte ponovno kasnije.</p>
        <p style={{ fontSize: "12px", color: "#888" }}>({errorMessage})</p>
      </div>
    );
  }

  const bgStyle = {
    background: brand === 'amd' ? 'linear-gradient(135deg, #222 45%, #e05e00 45%)' :
                brand === 'intel' ? 'linear-gradient(135deg, #222 45%, #0066cc 45%)' :
                'linear-gradient(135deg, #222 45%, #333 45%)',
    minHeight: '100vh', width: '100%', color: '#fff',
    padding: isMobile ? '20px 10px' : '40px 20px',
    transition: 'background 0.5s ease-in-out', overflowX: "hidden" as const
  };

  return (
    <div style={bgStyle}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", maxWidth: "1400px", margin: "0 auto", gap: isMobile ? "20px" : "40px" }}>
        
        {/* LIJEVI GLAVNI DIO (LEFT MAIN AREA) */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", minHeight: isMobile ? "auto" : "80vh", position: "relative" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? "10px" : "20px", background: "rgba(0,0,0,0.4)", padding: isMobile ? "10px 15px" : "15px 30px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? "18px" : "24px", textTransform: "uppercase", letterSpacing: "2px" }}>
              {STEP_LABELS[STEPS[stepIndex]]}
            </h1>
            <div style={{ fontSize: isMobile ? "16px" : "20px", fontWeight: "bold" }}>
              €{currentTotal().toFixed(2)}
            </div>
          </div>

          {stepIndex > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: isMobile ? "15px" : "30px" }}>
              <div style={{ display: "flex", gap: isMobile ? "10px" : "15px" }}>
                <button 
                  onClick={() => setStepIndex(stepIndex - 1)} 
                  style={{ padding: isMobile ? "8px 15px" : "10px 20px", borderRadius: "20px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontWeight: "bold", fontSize: isMobile ? "12px" : "14px", transition: "0.2s" }}
                >
                  ← NAZAD
                </button>
                <button 
                  onClick={resetBuild} 
                  style={{ padding: isMobile ? "8px 15px" : "10px 20px", borderRadius: "20px", background: "rgba(220, 53, 69, 0.15)", color: "#ff8787", border: "1px solid rgba(220, 53, 69, 0.4)", cursor: "pointer", fontWeight: "bold", fontSize: isMobile ? "12px" : "14px", transition: "0.2s" }}
                >
                  🔄 ISPOČETKA
                </button>
              </div>
              {["hdd", "os"].includes(STEPS[stepIndex]) && (
                <button 
                  onClick={handleSkip} 
                  style={{ padding: isMobile ? "8px 15px" : "10px 20px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", color: "#aaa", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontWeight: "bold", fontSize: isMobile ? "12px" : "14px", transition: "0.2s" }}
                >
                  PRESKOČI ⏭
                </button>
              )}
            </div>
          )}

          {/* ODABIR BRANDA (BRAND SELECTION) */}
          {STEPS[stepIndex] === "brand" && (
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "15px" : "30px", justifyContent: "center", alignItems: "center", flex: 1, padding: isMobile ? "30px 0" : "0" }}>
              <button 
                onClick={() => { setBrand("intel"); setStepIndex(1); }} 
                style={{ ...brandBtnStyle, width: isMobile ? "100%" : "250px", height: isMobile ? "100px" : "150px", background: "linear-gradient(135deg, #004488, #0066cc)" }}
              >
                INTEL
              </button>
              <button 
                onClick={() => { setBrand("amd"); setStepIndex(1); }} 
                style={{ ...brandBtnStyle, width: isMobile ? "100%" : "250px", height: isMobile ? "100px" : "150px", background: "linear-gradient(135deg, #cc4400, #ff6600)" }}
              >
                AMD
              </button>
            </div>
          )}

          {/* VRTULJAK KOMPONENTI (CAROUSEL) */}
          {stepIndex > 0 && stepIndex < STEPS.length - 1 && currentProducts.length > 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" }}>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: isMobile ? "300px" : "400px", position: "relative" }}>
                <button 
                  onClick={() => setActiveIndex((activeIndex - 1 + currentProducts.length) % currentProducts.length)} 
                  style={{...navArrowStyle, width: isMobile ? "35px" : "50px", height: isMobile ? "35px" : "50px", fontSize: isMobile ? "20px" : "30px", position: "absolute", left: isMobile ? "5px" : "0", zIndex: 50}}
                >
                  &lt;
                </button>

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
                            const variantNode = p.variants.edges.find((v:any) => v.node.id === selectedVarId)?.node || p.variants.edges[0].node;
                            handleSelection(STEPS[stepIndex], { ...p, selectedVariant: variantNode });
                          } else {
                            setActiveIndex(idx);
                          }
                        }}
                        style={{
                          position: "absolute", width: isMobile ? "160px" : "220px", height: isMobile ? "210px" : "260px",
                          background: "linear-gradient(145deg, rgba(50,50,50,0.9), rgba(20,20,20,0.9))",
                          border: isActive ? `2px solid ${brand === 'amd' ? '#ff6600' : '#0066cc'}` : "1px solid #444",
                          borderRadius: "15px", display: "flex", flexDirection: "column", justifyContent: "space-between",
                          alignItems: "center", textAlign: "center", padding: isMobile ? "10px" : "20px 15px",
                          cursor: isDragging ? "grabbing" : "pointer",
                          transition: isDragging ? "none" : "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)", 
                          opacity, zIndex, transform,
                          boxShadow: isActive ? `0 15px 35px rgba(0,0,0,0.6)` : "0 5px 15px rgba(0,0,0,0.3)",
                          userSelect: "none" 
                        }}
                      >
                         {p.featuredImage ? (
                           <img draggable="false" src={p.featuredImage.url} alt={p.title} style={{ width: "100%", height: "55%", objectFit: "contain", marginBottom: "5px", pointerEvents: "none" }} />
                         ) : (
                           <div style={{ width: "100%", height: "55%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", borderRadius: "8px", marginBottom: "5px", pointerEvents: "none" }}>
                             <span style={{ fontSize: isMobile ? "30px" : "50px" }}>📦</span>
                           </div>
                         )}

                         <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", width: "100%", pointerEvents: "none" }}>
                            {p.pcfBadge?.value && badgeStyle && (
                               <span style={{ background: badgeStyle.bg, color: badgeStyle.color, padding: "3px 8px", borderRadius: "12px", fontSize: isMobile ? "9px" : "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", boxShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>
                                   {p.pcfBadge.value}
                               </span>
                            )}
                            <h3 style={{ fontSize: isMobile ? "12px" : "14px", margin: 0, fontWeight: "600", color: isActive ? "#fff" : "#aaa", lineHeight: "1.2" }}>{p.title}</h3>
                         </div>
                         
                         {isActive && (
                            <div style={{ position: "absolute", bottom: isMobile ? "-25px" : "-30px", fontSize: isMobile ? "11px" : "13px", color: brand === 'amd' ? '#ffcc00' : '#66b3ff', fontWeight: "bold", opacity: 0.9, letterSpacing: "1px", pointerEvents: "none" }}>
                               KLIKNI ZA ODABIR
                            </div>
                         )}
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={() => setActiveIndex((activeIndex + 1) % currentProducts.length)} 
                  style={{...navArrowStyle, width: isMobile ? "35px" : "50px", height: isMobile ? "35px" : "50px", fontSize: isMobile ? "20px" : "30px", position: "absolute", right: isMobile ? "5px" : "0", zIndex: 50}}
                >
                  &gt;
                </button>
              </div>

              <div style={{ marginTop: isMobile ? "10px" : "20px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                 {activeProduct?.variants.edges.length > 1 && (
                    <select 
                      value={selectedVarId} 
                      onChange={(e) => setSelectedVarId(e.target.value)} 
                      style={{ width: isMobile ? "100%" : "250px", maxWidth: "300px", padding: "12px", borderRadius: "8px", border: `1px solid ${brand === 'amd' ? '#ff6600' : '#0066cc'}`, background: "rgba(0,0,0,0.5)", color: "#fff", marginBottom: "15px", fontSize: isMobile ? "14px" : "16px", outline: "none", cursor: "pointer", textAlign: "center" }}
                    >
                      {activeProduct.variants.edges.map((v: any) => (
                        <option key={v.node.id} value={v.node.id}>{v.node.title !== "Default Title" ? v.node.title : "Standard"}</option>
                      ))}
                    </select>
                 )}
                 <div style={{ fontSize: isMobile ? "28px" : "36px", fontWeight: "900", color: brand === 'amd' ? '#ffcc00' : '#66b3ff', textShadow: "0px 2px 10px rgba(0,0,0,0.5)" }}>
                    {Number(activeProduct?.variants.edges.find((v:any) => v.node.id === selectedVarId)?.node.price.amount || activeProduct?.variants.edges[0].node.price.amount || 0).toFixed(2)} €
                 </div>
              </div>
            </div>
          )}

          {/* ZADNJA STRANICA - PREGLED I DODACI (REVIEW STEP) */}
          {STEPS[stepIndex] === "review" && (
            <div style={{ textAlign: "center", color: "#fff", width: "100%", paddingBottom: "40px", paddingTop: "20px" }}>
              <div style={{ padding: isMobile ? "20px" : "40px", background: "rgba(0,0,0,0.5)", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                <h1 style={{ fontSize: isMobile ? "24px" : "32px" }}>🎉 Konfiguracija je spremna!</h1>
                <p style={{ fontSize: isMobile ? "22px" : "28px", margin: "20px 0", fontWeight: "bold", color: brand === 'amd' ? '#ffcc00' : '#66b3ff' }}>
                  Ukupna cijena: {currentTotal().toFixed(2)} €
                </p>
                <p style={{ color: "#aaa", fontSize: isMobile ? "12px" : "14px" }}>
                  (Uključen PDV i usluga slaganja od {ASSEMBLY_FEE} €)
                </p>
                
                <button 
                  disabled={isProcessing} 
                  onClick={handleCheckout} 
                  style={{ ...checkoutBtnStyle, background: brand === 'amd' ? '#ff6600' : '#0066cc', color: "#fff", border: "none", marginTop: "20px" }}
                >
                  {isProcessing ? "Obrađujem..." : `Naruči i Plati`}
                </button>

                <button 
                  onClick={shareBuild} 
                  style={{ width: "100%", marginTop: "15px", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", background: "transparent", cursor: "pointer", fontSize: isMobile ? "14px" : "16px", fontWeight: "bold" }}
                >
                  🔗 Kopiraj link za dijeljenje
                </button>
              </div>

              {/* DODATNE NADOGRADNJE (UPSELLS) */}
              <div style={{ textAlign: "left", marginTop: "30px", padding: isMobile ? "15px" : "25px", background: "rgba(0,0,0,0.5)", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                <h3 style={{ marginTop: 0, borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "10px", color: "#fff", fontSize: isMobile ? "16px" : "18px" }}>
                  Opcionalne Nadogradnje
                </h3>
                
                <div style={{ marginTop: "15px" }}>
                  {!gpu2 ? (
                    <button onClick={() => setAddingExtra(addingExtra === "gpu2" ? null : "gpu2")} style={{...upsellBtnStyle, background: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.2)", fontSize: isMobile ? "12px" : "14px"}}>
                      {addingExtra === "gpu2" ? "Odustani" : "➕ Dodaj 2. Grafičku (Za 3D i AI)"}
                    </button>
                  ) : (
                    <div style={{...addedUpsellStyle, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)"}}>
                      <span style={{ fontSize: isMobile ? "12px" : "14px" }}><strong>2. GPU:</strong> {gpu2.title}</span>
                      <button onClick={() => setGpu2(null)} style={removeBtnStyle}>✖ Ukloni</button>
                    </div>
                  )}
                  {addingExtra === "gpu2" && !gpu2 && (
                    <div style={{...dropdownListStyle, background: "#222", borderColor: "#444"}}>
                      {getSortedExtras("gpu").flatMap(p => p.variants.edges.map(v => (
                          <button key={v.node.id} style={{...dropdownItemStyle, background: "#222", color: "#fff", borderBottomColor: "#333", fontSize: isMobile ? "12px" : "14px"}} onClick={() => { setGpu2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}>
                            <span>{p.title} {v.node.title !== "Default Title" ? `- ${v.node.title}` : ""}</span> 
                            <span style={{color: brand === 'amd' ? '#ffcc00' : '#66b3ff', fontWeight: "bold"}}>{Number(v.node.price.amount).toFixed(2)} €</span>
                          </button>
                      )))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "15px" }}>
                  {!ssd2 ? (
                    <button onClick={() => setAddingExtra(addingExtra === "ssd2" ? null : "ssd2")} style={{...upsellBtnStyle, background: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.2)", fontSize: isMobile ? "12px" : "14px"}}>
                      {addingExtra === "ssd2" ? "Odustani" : "➕ Dodaj 2. SSD (Dodatna brza pohrana)"}
                    </button>
                  ) : (
                    <div style={{...addedUpsellStyle, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)"}}>
                      <span style={{ fontSize: isMobile ? "12px" : "14px" }}><strong>2. SSD:</strong> {ssd2.title}</span>
                      <button onClick={() => setSsd2(null)} style={removeBtnStyle}>✖ Ukloni</button>
                    </div>
                  )}
                  {addingExtra === "ssd2" && !ssd2 && (
                    <div style={{...dropdownListStyle, background: "#222", borderColor: "#444"}}>
                      {getSortedExtras("ssd").flatMap(p => p.variants.edges.map(v => (
                          <button key={v.node.id} style={{...dropdownItemStyle, background: "#222", color: "#fff", borderBottomColor: "#333", fontSize: isMobile ? "12px" : "14px"}} onClick={() => { setSsd2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}>
                            <span>{p.title} {v.node.title !== "Default Title" ? `- ${v.node.title}` : ""}</span> 
                            <span style={{color: brand === 'amd' ? '#ffcc00' : '#66b3ff', fontWeight: "bold"}}>{Number(v.node.price.amount).toFixed(2)} €</span>
                          </button>
                      )))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "15px" }}>
                  {!hdd2 ? (
                    <button onClick={() => setAddingExtra(addingExtra === "hdd2" ? null : "hdd2")} style={{...upsellBtnStyle, background: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.2)", fontSize: isMobile ? "12px" : "14px"}}>
                      {addingExtra === "hdd2" ? "Odustani" : "➕ Dodaj 2. HDD (Masivna pohrana)"}
                    </button>
                  ) : (
                    <div style={{...addedUpsellStyle, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)"}}>
                      <span style={{ fontSize: isMobile ? "12px" : "14px" }}><strong>2. HDD:</strong> {hdd2.title}</span>
                      <button onClick={() => setHdd2(null)} style={removeBtnStyle}>✖ Ukloni</button>
                    </div>
                  )}
                  {addingExtra === "hdd2" && !hdd2 && (
                    <div style={{...dropdownListStyle, background: "#222", borderColor: "#444"}}>
                      {getSortedExtras("hdd").flatMap(p => p.variants.edges.map(v => (
                          <button key={v.node.id} style={{...dropdownItemStyle, background: "#222", color: "#fff", borderBottomColor: "#333", fontSize: isMobile ? "12px" : "14px"}} onClick={() => { setHdd2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}>
                            <span>{p.title} {v.node.title !== "Default Title" ? `- ${v.node.title}` : ""}</span> 
                            <span style={{color: brand === 'amd' ? '#ffcc00' : '#66b3ff', fontWeight: "bold"}}>{Number(v.node.price.amount).toFixed(2)} €</span>
                          </button>
                      )))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DESNI SIDEBAR (RIGHT SIDEBAR) */}
        <div style={{ 
          flex: 1, background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", 
          borderRadius: "16px", padding: isMobile ? "15px" : "25px", height: "fit-content", position: isMobile ? "relative" : "sticky", 
          top: "40px", marginTop: isMobile ? "20px" : "0"
        }}>
          <h3 style={{ marginTop: 0, borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "15px", color: "#fff", fontSize: isMobile ? "18px" : "20px" }}>Vaša Konfiguracija</h3>
          
          <SidebarRow label="Procesor" item={cpu} />
          <SidebarRow label="Matična" item={mb} />
          <SidebarRow label="Memorija" item={ram} />
          <SidebarRow label="Grafička" item={gpu} />
          {gpu2 && <SidebarRow label="Grafička 2" item={gpu2} />}
          <SidebarRow label="SSD" item={ssd} />
          {ssd2 && <SidebarRow label="SSD 2" item={ssd2} />}
          {hdd && <SidebarRow label="HDD" item={hdd} /> }
          {hdd2 && <SidebarRow label="HDD 2" item={hdd2} />}
          <SidebarRow label="Kućište" item={pcCase} />
          <SidebarRow label="Napajanje" item={psu} />
          <SidebarRow label="Hladnjak" item={cooler} />
          {os && <SidebarRow label="Sustav" item={os} />}
          
          <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid rgba(255,255,255,0.2)" }} />
          
          {bottleneckWarning && (
            <div style={{ marginBottom: "20px", padding: "12px", background: "rgba(255, 193, 7, 0.2)", borderRadius: "8px", border: "1px solid rgba(255, 193, 7, 0.5)", color: "#ffdd57", fontSize: "13px" }}>
              {bottleneckWarning}
            </div>
          )}

          <div style={{ marginBottom: "20px", padding: "15px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", fontWeight: "bold", color: "#ddd" }}>
              <span>Potrošnja sustava:</span>
              <span>{estimatedDraw}W {psuCapacity > 0 ? `/ ${psuCapacity}W` : ""}</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${powerPercentage}%`, background: psuCapacity > 0 && estimatedDraw >= psuCapacity ? "#dc3545" : (psuCapacity > 0 ? "#28a745" : (brand === 'amd' ? '#ff6600' : '#0066cc')), transition: "width 0.4s ease, background 0.4s ease" }} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: isMobile ? "18px" : "20px", color: "#fff" }}>
            <span>Ukupno:</span>
            <span>{currentTotal().toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Builder() {
  return (
    <Suspense fallback={<div style={{color: "white", padding: "50px", textAlign: "center"}}>Učitavanje aplikacije...</div>}>
      <BuilderContent />
    </Suspense>
  );
}

// --- POMOĆNE UI KOMPONENTE (SUB-COMPONENTS) ---
function SidebarRow({ label, item }: { label: string; item?: ProductNode | null }) {
  if (!item) return null; 
  const variantName = item.selectedVariant && item.selectedVariant.title !== "Default Title" ? ` (${item.selectedVariant.title})` : "";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "12px", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "4px" }}>
      <span style={{ color: "#aaa", minWidth: "80px" }}>{label}:</span>
      <span style={{ textAlign: "right", marginLeft: "10px", fontWeight: "600", color: "#fff" }}>{item.title}{variantName}</span>
    </div>
  );
}

// --- STILOVI (STYLES) ---
const brandBtnStyle: CSSProperties = { fontSize: "32px", fontWeight: "bold", color: "#fff", border: "none", borderRadius: "16px", cursor: "pointer", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", transition: "transform 0.2s" };
const navArrowStyle: CSSProperties = { background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", cursor: "pointer", backdropFilter: "blur(5px)", transition: "0.2s" };
const checkoutBtnStyle: CSSProperties = { width: "100%", padding: "20px", fontWeight: "bold", cursor: "pointer", borderRadius: "8px", fontSize: "18px" };
const upsellBtnStyle: CSSProperties = { width: "100%", padding: "12px", border: "1px dashed", fontWeight: "bold", borderRadius: "8px", cursor: "pointer", textAlign: "left" as const };
const addedUpsellStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "8px", fontSize: "14px" };
const removeBtnStyle: CSSProperties = { color: "#ff4d4d", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" };
const dropdownListStyle: CSSProperties = { marginTop: "10px", maxHeight: "250px", overflowY: "auto", border: "1px solid", borderRadius: "8px" };
const dropdownItemStyle: CSSProperties = { width: "100%", display: "flex", justifyContent: "space-between", padding: "12px 15px", border: "none", borderBottom: "1px solid", cursor: "pointer", textAlign: "left" as const };