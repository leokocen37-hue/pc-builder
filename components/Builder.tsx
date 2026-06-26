"use client";

import React, { CSSProperties, useEffect, useState, Suspense, useRef } from "react";
import { shopifyFetch } from "@/lib/shopify";
import { useSearchParams, useRouter } from "next/navigation";

// --- TYPES ---
type ProductNode = {
  id: string;
  title: string;
  tags: string[];
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
  | "brand" | "cpu" | "motherboard" | "ram" | "gpu" | "ssd" 
  | "hdd" | "case" | "psu" | "cooler" | "os" | "review";

const STEPS: Step[] = [
  "brand", "cpu", "motherboard", "ram", "gpu", "ssd", 
  "hdd", "case", "psu", "cooler", "os", "review"
];

const STEP_LABELS: Record<Step, string> = {
  brand: "Platforma", cpu: "Procesor", motherboard: "Matična ploča", ram: "Radna memorija",
  gpu: "Grafička kartica", ssd: "Glavni SSD", hdd: "Tvrdi disk", case: "Kućište",
  psu: "Napajanje", cooler: "Hlađenje", os: "Sustav", review: "Pregled"
};

const ASSEMBLY_FEE = 200;

function BuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialized = useRef(false);

  // --- STATE ---
  const [stepIndex, setStepIndex] = useState(0);
  const [mode, setMode] = useState<'coverflow' | 'grid'>('coverflow');
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
  const dragMoved = useRef(false);
  const suppressClick = useRef(false);

  // Selections
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
  const [shareCopied, setShareCopied] = useState(false);

  const isReviewStep = STEPS[stepIndex] === "review";
  const isPicker = !isReviewStep && stepIndex > 0;

  // --- HARDWARE LOGIC ---
  const calculateSystemTDP = () => {
    const parts = [cpu, mb, ram, gpu, gpu2, pcCase, cooler];
    const componentsDraw = parts.reduce((sum, part) => sum + Number(part?.pcfTdp?.value || 0), 0);
    return componentsDraw + 150; 
  };

  const estimatedDraw = calculateSystemTDP();
  const psuCapacity = Number(psu?.pcfWattage?.value || 0);
  const powerPercentage = psuCapacity > 0 
    ? Math.min((estimatedDraw / psuCapacity) * 100, 100) 
    : Math.min((estimatedDraw / 1000) * 100, 100);
  const isOverPower = psuCapacity > 0 && estimatedDraw > psuCapacity;

  const getQualityScore = (quality?: string) => {
    const q = (quality || "").toLowerCase();
    if (q === "excellent") return 4;
    if (q === "very good") return 3;
    if (q === "good") return 2;
    if (q === "average") return 1;
    return 0;
  };

  const getBadgeColors = (text: string) => {
    const t = (text || '').toLowerCase();
    if (t.includes('ultimativni') || t.includes('apsolutni') || t.includes('vrh'))
      return { bg:'linear-gradient(135deg,#d81fd8,#7b2ff7)', color:'#fff', glow:'rgba(216,31,216,.5)' };
    if (t.includes('best buy') || t.includes('kralj'))
      return { bg:'linear-gradient(135deg,#ff9a3d,#ff5e00)', color:'#1a0d00', glow:'rgba(255,110,0,.4)' };
    if (t.includes('standard') || t.includes('zlatna'))
      return { bg:'linear-gradient(135deg,#ffd24a,#e0a400)', color:'#1a1400', glow:'rgba(224,164,0,.35)' };
    if (t.includes('premium') || t.includes('zvijer'))
      return { bg:'linear-gradient(135deg,#9aa3b5,#5b6678)', color:'#fff', glow:'rgba(120,130,150,.35)' };
    return { bg:'linear-gradient(135deg,#3da5ff,#1f6fe0)', color:'#fff', glow:'rgba(31,111,224,.4)' };
  };

  const extractGlyph = (title: string, type: string) => {
    if (type === 'gpu') {
      const match = title.match(/\d{4}( Ti| XT|X)?/i);
      return match ? match[0] : 'GPU';
    }
    if (type === 'cpu') {
      const match = title.match(/\d{4,5}[A-Z]{0,3}/i);
      return match ? match[0] : 'CPU';
    }
    if (type === 'ram') return 'RAM';
    if (type === 'motherboard') return 'MB';
    if (type === 'ssd') return 'SSD';
    return type.toUpperCase() || 'PC';
  };

  const extractSpec = (p: ProductNode) => {
    const parts = [];
    if (p.pcfSocket?.value) parts.push(p.pcfSocket.value.toUpperCase());
    if (p.pcfRamType?.value) parts.push(p.pcfRamType.value.toUpperCase());
    if (p.pcfTdp?.value) parts.push(`${p.pcfTdp.value}W`);
    if (p.pcfWattage?.value) parts.push(`${p.pcfWattage.value}W`);
    return parts.join(' · ') || p.pcfType?.value?.toUpperCase() || 'Standard';
  };

  const checkBottleneck = () => {
    if (!cpu || !gpu) return null;
    const cpuScore = getQualityScore(cpu.pcfQuality?.value);
    const gpuScore = getQualityScore(gpu.pcfQuality?.value);
    if (gpuScore >= 3 && cpuScore <= 2 && (gpuScore - cpuScore >= 2)) {
      return "⚠️ Bottleneck Upozorenje: Vaš procesor je preslab za ovu grafičku karticu.";
    }
    return null;
  };
  const bottleneckWarning = checkBottleneck();

  // --- DATA FETCHING & EFFECTS ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 860);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setIsProcessing(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
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
                  id title tags
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
        if (!data || !data.products) throw new Error("Shopify didn't return a valid products object.");
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
        const uBrand = searchParams.get("brand");
        if (uBrand) setBrand(uBrand);
        loadParam("cpu", setCpu); loadParam("mb", setMb); loadParam("ram", setRam);
        loadParam("gpu", setGpu); loadParam("gpu2", setGpu2); loadParam("ssd", setSsd); loadParam("ssd2", setSsd2);
        loadParam("hdd", setHdd); loadParam("hdd2", setHdd2); loadParam("case", setPcCase); 
        loadParam("psu", setPsu); loadParam("cooler", setCooler); loadParam("os", setOs);

        if (searchParams.get("cpu") && searchParams.get("case")) setStepIndex(STEPS.indexOf("review"));
      } catch (err: any) { setErrorMessage(err.message || "Unknown error occurred while fetching."); } 
      finally { setLoading(false); initialized.current = true; }
    }
    fetchAndSync();
  }, [searchParams]);

  useEffect(() => {
    setActiveIndex(0); setDragOffset(0); setIsProcessing(false); 
  }, [stepIndex]);

  // --- FILTERING ---
  const currentStep = STEPS[stepIndex];
  const currentProducts = products.filter(p => {
    const type = p.pcfType?.value;
    if (currentStep === "cpu") return type === "cpu" && p.pcfBrand?.value === brand;
    if (currentStep === "motherboard") return type === "motherboard" && p.pcfSocket?.value === cpu?.pcfSocket?.value;
    if (currentStep === "ram") {
      if (type !== "ram") return false;
      const socket = (mb?.pcfSocket?.value || cpu?.pcfSocket?.value || "").toLowerCase();
      let requiredRamType = socket === "am4" ? "ddr4" : "ddr5";
      const productRamType = (p.pcfRamType?.value || "").toLowerCase();
      if (productRamType && productRamType !== requiredRamType) return false;
      const pTags = p.tags || [];
      const lowerTags = pTags.map((t: string) => t.toLowerCase().trim());
      const titleLower = p.title.toLowerCase();
      const isXMP = lowerTags.includes("intel-xmp") || titleLower.includes("xmp");
      const isEXPO = lowerTags.includes("amd-expo") || titleLower.includes("expo");
      if (brand === "intel" && isEXPO && !isXMP) return false;
      if (brand === "amd" && isXMP && !isEXPO) return false;
      return true;
    }
    if (currentStep === "gpu") return type === "gpu";
    if (currentStep === "ssd") return type === "ssd";
    if (currentStep === "hdd") return type === "hdd";
    if (currentStep === "case") {
      if (type !== "case") return false;
      const mbFormFactor = (mb?.pcfFormFactor?.value || "atx").toLowerCase();
      const supported = p.pcfSupportedFormFactors?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
      const mbFits = supported.length === 0 || supported.includes(mbFormFactor) || supported.includes("atx");
      const gpuLength1 = Number(gpu?.pcfGpuLength?.value || 0);
      const gpuLength2 = Number(gpu2?.pcfGpuLength?.value || 0);
      const maxGpuLength = Math.max(gpuLength1, gpuLength2);
      const caseMaxGpuLength = Number(p.pcfMaxGpuLength?.value || 9999);
      return mbFits && (maxGpuLength <= caseMaxGpuLength);
    }
    if (currentStep === "psu") return type === "psu" && Number(p.pcfWattage?.value || 9999) >= (calculateSystemTDP() + 100);
    if (currentStep === "cooler") {
      if (type !== "cooler") return false;
      const sockets = p.pcfSocket?.value?.split(",").map(s => s.trim().toLowerCase()) || [];
      return sockets.includes((cpu?.pcfSocket?.value || "").toLowerCase());
    }
    if (currentStep === "os") return type === "os";
    return false;
  }).sort((a, b) => {
    const wA = getQualityScore(a.pcfQuality?.value);
    const wB = getQualityScore(b.pcfQuality?.value);
    if (wB !== wA) return wB - wA; 
    const priceA = Number(a.variants.edges[0]?.node.price.amount || 0);
    const priceB = Number(b.variants.edges[0]?.node.price.amount || 0);
    return priceB - priceA; 
  });

  const activeProduct = currentProducts[activeIndex] || null;

  useEffect(() => {
    if (activeProduct) setSelectedVarId(activeProduct.variants.edges[0].node.id);
  }, [activeProduct]);

  // --- DRAG LOGIC ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragMoved.current = false;
    setStartX(e.clientX);
    setDragOffset(0);
    setIsDragging(false);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX === null) return;
    const diff = e.clientX - startX;
    const slideWidth = isMobile ? 150 : 300; 
    const jumps = Math.trunc(diff / slideWidth);
    if (Math.abs(diff) > 4) dragMoved.current = true;
    
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
      const slideWidth = isMobile ? 150 : 300;
      let newActiveIndex = activeIndex;
      if (dragOffset > slideWidth / 3) newActiveIndex = (activeIndex - 1 + currentProducts.length) % currentProducts.length;
      else if (dragOffset < -slideWidth / 3) newActiveIndex = (activeIndex + 1) % currentProducts.length;
      
      setActiveIndex(newActiveIndex);

      if (dragMoved.current) {
        suppressClick.current = true;
        setTimeout(() => { suppressClick.current = false; }, 90);
      }
    }
    setDragOffset(0); setStartX(null); setTimeout(() => setIsDragging(false), 50); 
  };

  const getOffset = (index: number) => {
    const N = currentProducts.length;
    if (N === 0) return 0;
    let base = ((index - activeIndex) % N + N) % N; 
    if (base > Math.floor(N / 2)) base -= N;
    return base;
  };

  const getCardStyle = (exactOffset: number) => {
    const a = Math.abs(exactOffset);
    const sign = exactOffset === 0 ? 0 : (exactOffset < 0 ? -1 : 1);
    const bx = isMobile ? 168 : 320;
    let tx = 0, sc = 1, rot = 0, op = 1, z = 30;

    if (a <= 1) { 
      tx = exactOffset * bx; sc = 1 - 0.16 * a; rot = -exactOffset * 28; op = 1 - 0.52 * a; z = 30 - Math.round(a * 8); 
    }
    else if (a <= 2) { 
      const f = a - 1; tx = sign * (bx + f * (isMobile ? 80 : 175)); sc = 0.84 - 0.14 * f; rot = -sign * (28 + 12 * f); op = 0.48 - 0.42 * f; z = Math.round(20 - 10 * f); 
    }
    else { 
      tx = sign * (bx + (isMobile ? 80 : 175) + (a - 2) * 120); sc = 0.6; rot = -sign * 42; op = 0; z = 0; 
    }

    return { 
      transform: `translate(-50%,-50%) translateX(${tx}px) scale(${sc}) rotateY(${rot}deg)`, 
      opacity: Math.max(0, op), 
      zIndex: Math.max(0, z),
      transition: isDragging ? 'none' : 'transform .55s cubic-bezier(.22,.61,.36,1), opacity .45s ease, box-shadow .3s ease' 
    };
  };

  const handleSelection = (p: ProductNode) => {
    if (suppressClick.current) return;
    const variantNode = p.variants.edges.find((v: any) => v.node.id === selectedVarId)?.node || p.variants.edges[0].node;
    const productWithVariant = { ...p, selectedVariant: variantNode };

    if (currentStep === "cpu") setCpu(productWithVariant);
    else if (currentStep === "motherboard") setMb(productWithVariant); 
    else if (currentStep === "ram") setRam(productWithVariant);
    else if (currentStep === "gpu") setGpu(productWithVariant);
    else if (currentStep === "ssd") setSsd(productWithVariant);
    else if (currentStep === "hdd") setHdd(productWithVariant);
    else if (currentStep === "case") setPcCase(productWithVariant); 
    else if (currentStep === "psu") setPsu(productWithVariant);
    else if (currentStep === "cooler") setCooler(productWithVariant);
    else if (currentStep === "os") setOs(productWithVariant);
    
    setStepIndex((prev) => prev + 1); setActiveIndex(0);
  };

  const resetBuild = () => {
    setStepIndex(0); setBrand(null); setCpu(null); setMb(null); setRam(null); setGpu(null); setGpu2(null); setSsd(null); setSsd2(null); setHdd(null); setHdd2(null); setPcCase(null); setPsu(null); setCooler(null); setOs(null); setAddingExtra(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const currentTotal = () => {
    const parts = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os];
    const compPrice = parts.reduce((sum, p) => sum + Number(p?.selectedVariant?.price?.amount || p?.variants?.edges[0]?.node.price.amount || 0), 0);
    return isReviewStep ? compPrice + ASSEMBLY_FEE : compPrice;
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    const parts = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os];
    const summary = parts.filter(Boolean).map(p => `${p?.title}${p?.selectedVariant && p?.selectedVariant?.title !== 'Default Title' ? ` (${p?.selectedVariant?.title})` : ''}`).join(", ");
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ totalPrice: currentTotal(), summary }) });
      const data = await res.json();
      if (data.draftOrder?.invoiceUrl) window.location.href = data.draftOrder.invoiceUrl;
      else { alert("Dogodila se greška pri kreiranju narudžbe."); setIsProcessing(false); }
    } catch (error) { alert("Serverska greška."); setIsProcessing(false); }
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
    { key: "os", label: "SUSTAV", item: os }
  ].filter(p => p.item);

  if (loading) return <div style={{ padding: "100px", textAlign: "center", color: "white", fontFamily: "'Space Grotesk', sans-serif" }}>Učitavanje komponenti...</div>;
  if (errorMessage) return <div style={{ padding: "50px", textAlign: "center", color: "#ff4d4d", fontFamily: "'Space Grotesk', sans-serif" }}><h2>Greška sa serverom</h2><p>{errorMessage}</p></div>;

  // Inline CSS Variables & Styling overrides
  const mainStyle: CSSProperties = {
    minHeight: '100vh', fontFamily: "'Space Grotesk', sans-serif", color: '#f3f4f8',
    background: 'radial-gradient(1100px 560px at 72% -14%, rgba(216,31,216,.11), transparent 62%), #07080c',
    padding: isMobile ? '20px 15px 80px' : '26px 22px 64px'
  };

  const segBtn = (active: boolean): CSSProperties => ({
    padding: '9px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600, fontSize: '13px', background: active ? '#d81fd8' : 'transparent', color: active ? '#fff' : '#888da3',
    boxShadow: active ? '0 6px 18px -6px rgba(216,31,216,.85)' : 'none', transition: 'all .2s'
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .hover-glow:hover { filter: brightness(1.1); }
        .hover-border:hover { border-color: rgba(216,31,216,.4) !important; }
      `}</style>
      <div style={mainStyle}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          
          {/* HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '13px' }}>
              <div style={{ fontWeight: 700, fontSize: '21px', letterSpacing: '.4px' }}>RAČUNALO<span style={{ color: '#d81fd8' }}>.HR</span></div>
              {!isMobile && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '2.5px', color: '#5a5f73', textTransform: 'uppercase' }}>PC Builder</div>}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#888da3', letterSpacing: '2px' }}>KONFIGURATOR</div>
          </div>

          {/* STEP RAIL */}
          <div style={{ display: 'flex', gap: '7px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '26px' }}>
            {STEPS.map((l, i) => {
              const isActive = i === stepIndex;
              const isDone = i < stepIndex;
              const isClickable = isDone && stepIndex !== 11;
              return (
                <div key={l} onClick={() => { if(isClickable) setStepIndex(i); if(stepIndex===11) setStepIndex(i); }} 
                     style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, padding: '8px 14px 8px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', cursor: isClickable||stepIndex===11 ? 'pointer' : 'default', transition: 'all .2s',
                     background: isActive ? 'rgba(216,31,216,.13)' : 'transparent', border: isActive ? '1px solid rgba(216,31,216,.5)' : '1px solid rgba(255,255,255,.06)', color: isActive ? '#fff' : (isDone ? '#9499ac' : '#4a4f63') }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 600, background: isActive ? '#d81fd8' : 'rgba(255,255,255,.06)', color: isActive ? '#fff' : (isDone ? '#9499ac' : '#4a4f63') }}>
                    {isDone ? '✓' : String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{STEP_LABELS[l]}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
            
            {/* LEFT MAIN AREA */}
            <div style={{ flex: '1 1 580px', minWidth: '300px' }}>
              
              {/* STEP 0: BRAND */}
              {currentStep === "brand" && (
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "20px", marginTop: "40px" }}>
                  <button className="hover-glow" onClick={() => { setBrand("intel"); setStepIndex(1); }} 
                          style={{ flex:1, padding: "40px 20px", fontSize: "28px", fontWeight: 700, color: "#fff", background: "#11131b", border: "1px solid rgba(255,255,255,.07)", borderTop: "4px solid #0066cc", borderRadius: "16px", cursor: "pointer", transition: ".2s", fontFamily: "'Space Grotesk', sans-serif" }}>INTEL</button>
                  <button className="hover-glow" onClick={() => { setBrand("amd"); setStepIndex(1); }} 
                          style={{ flex:1, padding: "40px 20px", fontSize: "28px", fontWeight: 700, color: "#fff", background: "#11131b", border: "1px solid rgba(255,255,255,.07)", borderTop: "4px solid #cc4400", borderRadius: "16px", cursor: "pointer", transition: ".2s", fontFamily: "'Space Grotesk', sans-serif" }}>AMD</button>
                </div>
              )}

              {/* PICKER AREA */}
              {isPicker && currentProducts.length > 0 && (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '2.5px', color: '#d81fd8', marginBottom: '9px' }}>
                        KORAK {String(stepIndex+1).padStart(2,'0')} — ODABIR
                      </div>
                      <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, letterSpacing: '-.6px' }}>Odaberi komponentu</h2>
                      <div style={{ color: '#888da3', fontSize: '14px', marginTop: '7px' }}>{currentProducts.length} kompatibilnih modela</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', background: '#11131b', border: '1px solid rgba(255,255,255,.07)', borderRadius: '13px', padding: '4px' }}>
                      <button onClick={() => setMode('coverflow')} style={segBtn(mode === 'coverflow')}>Coverflow</button>
                      <button onClick={() => setMode('grid')} style={segBtn(mode === 'grid')}>Mreža</button>
                    </div>
                  </div>

                  {/* COVERFLOW */}
                  {mode === 'coverflow' && (
                    <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onPointerCancel={handlePointerUp}
                         style={{ position: 'relative', height: 'clamp(310px, 40vw, 440px)', perspective: '1700px', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'pan-y', marginBottom: '4px' }}>
                      
                      <button onClick={() => setActiveIndex((activeIndex - 1 + currentProducts.length) % currentProducts.length)} 
                              style={{ position: 'absolute', left: 0, zIndex: 60, width: '46px', height: '46px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(17,19,27,.72)', backdropFilter: 'blur(8px)', color: '#f3f4f8', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2px' }}>‹</button>
                      
                      {currentProducts.map((p, idx) => {
                        const baseOffset = getOffset(idx);
                        const sw = isMobile ? 150 : 300; 
                        const exactOffset = baseOffset + (dragOffset / sw);
                        const cs = getCardStyle(exactOffset);
                        const isActive = Math.abs(exactOffset) < 0.5 && !isDragging; 
                        const badgeC = p.pcfBadge?.value ? getBadgeColors(p.pcfBadge.value) : null;
                        
                        if (cs.opacity === 0 && !isDragging) return null;

                        return (
                          <div key={p.id} onClick={() => { if(isDragging) return; if (baseOffset === 0) handleSelection(p); else setActiveIndex(idx); }}
                               style={{ position: 'absolute', left: '50%', top: '50%', width: isMobile ? '196px' : '284px', height: isMobile ? '256px' : '360px', borderRadius: '18px', padding: isMobile ? '14px' : '18px', background: 'linear-gradient(165deg,#171b27,#0d0f17)', cursor: 'pointer', userSelect: 'none', transformOrigin: 'center center', willChange: 'transform',
                               border: isActive ? '1px solid rgba(216,31,216,.7)' : '1px solid rgba(255,255,255,.07)',
                               boxShadow: isActive ? '0 0 0 1px rgba(216,31,216,.55), 0 30px 70px -22px rgba(216,31,216,.5)' : '0 22px 44px -22px rgba(0,0,0,.85)',
                               display: 'flex', flexDirection: 'column', transform: cs.transform, opacity: cs.opacity, zIndex: cs.zIndex, transition: cs.transition }}>
                            
                            {badgeC && (
                              <span style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 6, padding: '4px 9px', borderRadius: '7px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 600, letterSpacing: '.6px', textTransform: 'uppercase', background: badgeC.bg, color: badgeC.color, boxShadow: `0 4px 14px ${badgeC.glow}` }}>{p.pcfBadge?.value}</span>
                            )}
                            
                            <div style={{ position: 'relative', width: '100%', height: '54%', borderRadius: '13px', overflow: 'hidden', background: 'linear-gradient(160deg,#1b2030,#0b0d14)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.045) 0 1px, transparent 1px 13px)' }}></div>
                              {p.featuredImage ? (
                                <img draggable="false" src={p.featuredImage.url} alt={p.title} style={{ width: '80%', height: '80%', objectFit: 'contain', zIndex: 2, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }} />
                              ) : (
                                <>
                                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '2.5px', color: '#6a7088', position: 'relative' }}>{p.pcfBrand?.value || p.vendor || 'PC'}</div>
                                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 'clamp(32px, 5vw, 48px)', color: '#cfd3e0', letterSpacing: '1px', position: 'relative', lineHeight: 1 }}>{extractGlyph(p.title, p.pcfType?.value || '')}</div>
                                </>
                              )}
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '13px' }}>
                              <div style={{ fontWeight: 600, fontSize: '15px', lineHeight: 1.25 }}>{p.title}</div>
                              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#888da3', marginTop: '5px' }}>{extractSpec(p)}</div>
                              
                              {p.variants.edges.length > 1 ? (
                                <select onClick={(e)=> e.stopPropagation()} value={isActive ? selectedVarId : p.variants.edges[0].node.id} onChange={(e) => { if(isActive) setSelectedVarId(e.target.value); }} style={{ width: '100%', padding: '6px', marginTop: '8px', borderRadius: '6px', background: '#0b0d14', color: '#fff', border: '1px solid rgba(255,255,255,.1)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px' }}>
                                  {p.variants.edges.map(v => <option key={v.node.id} value={v.node.id}>{v.node.title !== "Default Title" ? v.node.title : "Standard"}</option>)}
                                </select>
                              ) : (
                                <div style={{ fontWeight: 700, fontSize: '22px', color: '#fff', marginTop: '10px', letterSpacing: '-.3px' }}>€{Number(p.variants.edges[0].node.price.amount).toFixed(2)}</div>
                              )}
                              
                              {p.variants.edges.length > 1 && (
                                <div style={{ fontWeight: 700, fontSize: '18px', color: '#fff', marginTop: '6px', letterSpacing: '-.3px' }}>€{Number(p.variants.edges.find((v:any) => v.node.id === (isActive ? selectedVarId : p.variants.edges[0].node.id))?.node.price.amount || p.variants.edges[0].node.price.amount).toFixed(2)}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <button onClick={() => setActiveIndex((activeIndex + 1) % currentProducts.length)} 
                              style={{ position: 'absolute', right: 0, zIndex: 60, width: '46px', height: '46px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(17,19,27,.72)', backdropFilter: 'blur(8px)', color: '#f3f4f8', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2px' }}>›</button>
                    </div>
                  )}

                  {/* GRID */}
                  {mode === 'grid' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(198px, 1fr))', gap: '14px', marginBottom: '4px' }}>
                      {currentProducts.map((p, idx) => {
                        const selected = idx === activeIndex;
                        const badgeC = p.pcfBadge?.value ? getBadgeColors(p.pcfBadge.value) : null;
                        return (
                          <div key={p.id} onClick={() => { setActiveIndex(idx); if(selected) handleSelection(p); }} className="hover-border"
                               style={{ background: '#11131b', borderRadius: '16px', padding: '15px', cursor: 'pointer', transition: 'all .18s', border: selected ? '1px solid rgba(216,31,216,.7)' : '1px solid rgba(255,255,255,.07)', boxShadow: selected ? '0 0 0 1px rgba(216,31,216,.5), 0 20px 44px -24px rgba(216,31,216,.5)' : 'none' }}>
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '11px', overflow: 'hidden', background: 'linear-gradient(160deg,#1b2030,#0b0d14)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', marginBottom: '14px' }}>
                              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.045) 0 1px, transparent 1px 13px)' }}></div>
                              {badgeC && (
                                <span style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 6, padding: '3px 7px', borderRadius: '6px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', background: badgeC.bg, color: badgeC.color, boxShadow: `0 4px 14px ${badgeC.glow}` }}>{p.pcfBadge?.value}</span>
                              )}
                              {selected && (
                                <span style={{ position: 'absolute', bottom: '8px', right: '8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 600, color: '#fff', background: '#d81fd8', padding: '3px 7px', borderRadius: '6px', zIndex:10 }}>✓ ODABRANO</span>
                              )}
                              {p.featuredImage ? (
                                <img src={p.featuredImage.url} alt={p.title} style={{ width: '70%', height: '70%', objectFit: 'contain', zIndex: 2 }} />
                              ) : (
                                <>
                                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '2px', color: '#6a7088', position: 'relative' }}>{p.pcfBrand?.value || p.vendor || 'PC'}</div>
                                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: '34px', color: '#cfd3e0', letterSpacing: '1px', position: 'relative', lineHeight: 1 }}>{extractGlyph(p.title, p.pcfType?.value || '')}</div>
                                </>
                              )}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.25 }}>{p.title}</div>
                            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10.5px', color: '#888da3', marginTop: '6px' }}>{extractSpec(p)}</div>
                            <div style={{ fontWeight: 700, fontSize: '18px', marginTop: '10px', letterSpacing: '-.3px' }}>€{Number(p.variants.edges[0].node.price.amount).toFixed(2)}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* BOTTOM ACTION BAR */}
                  {activeProduct && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginTop: '18px', padding: '18px 22px', background: '#11131b', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px' }}>
                      <div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#888da3', letterSpacing: '2px' }}>ODABRANO</div>
                        <div style={{ fontWeight: 600, fontSize: '17px', marginTop: '4px' }}>{activeProduct.title} {activeProduct.variants.edges.length > 1 && `(${activeProduct.variants.edges.find((v:any) => v.node.id === selectedVarId)?.node.title || 'Standard'})`}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ fontWeight: 700, fontSize: '24px', letterSpacing: '-.5px' }}>
                          €{Number(activeProduct.variants.edges.find((v:any) => v.node.id === selectedVarId)?.node.price.amount || activeProduct.variants.edges[0].node.price.amount).toFixed(2)}
                        </div>
                        <button className="hover-glow" onClick={() => handleSelection(activeProduct)} 
                                style={{ padding: '13px 24px', borderRadius: '11px', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '14px', color: '#fff', background: 'linear-gradient(135deg,#d81fd8,#a020f0)', boxShadow: '0 12px 30px -10px rgba(216,31,216,.7)', transition: 'filter .2s' }}>
                          Odaberi i nastavi →
                        </button>
                      </div>
                    </div>
                  )}

                  {["hdd", "os"].includes(currentStep) && (
                    <div style={{ marginTop: '15px', textAlign: 'right' }}>
                      <button onClick={handleSkip} style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,.2)', color: '#888da3', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px' }}>Preskoči ovaj korak (Opcionalno)</button>
                    </div>
                  )}
                </div>
              )}

              {/* REVIEW AREA */}
              {isReviewStep && (
                <div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                    <button className="hover-border" onClick={() => setStepIndex(stepIndex - 1)} style={{ padding: '11px 18px', borderRadius: '10px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '13px', background: '#11131b', border: '1px solid rgba(255,255,255,.08)', color: '#f3f4f8', transition: 'border-color .2s' }}>← Uredi konfiguraciju</button>
                    <button className="hover-border" onClick={resetBuild} style={{ padding: '11px 18px', borderRadius: '10px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '13px', background: '#11131b', border: '1px solid rgba(255,255,255,.08)', color: '#ff6a82', transition: 'border-color .2s' }}>Kreni ispočetka</button>
                  </div>
                  <div style={{ marginBottom: '26px' }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '2.5px', color: '#d81fd8', marginBottom: '9px' }}>FINALNI PREGLED</div>
                    <h2 style={{ margin: 0, fontSize: 'clamp(26px, 3.2vw, 36px)', fontWeight: 700, letterSpacing: '-.6px' }}>Pregled konfiguracije</h2>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                    {selectedPartsList.map(p => (
                      <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '18px', background: '#11131b', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '16px 20px' }}>
                        <div style={{ width: '54px', height: '54px', flexShrink: 0, borderRadius: '10px', background: '#07080c', border: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {p.item?.featuredImage ? <img src={p.item.featuredImage.url} style={{ width:'80%', height:'80%', objectFit:'contain' }}/> : <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#5a5f73' }}>{extractGlyph(p.item?.title||'', p.item?.pcfType?.value||'')}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9.5px', color: '#5a5f73', letterSpacing: '1.5px', marginBottom: '5px' }}>{p.label}</div>
                          <div style={{ fontWeight: 600, fontSize: '15px' }}>{p.item?.title} {p.item?.selectedVariant && p.item.selectedVariant.title !== 'Default Title' && `(${p.item.selectedVariant.title})`}</div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#888da3', marginTop: '4px' }}>{extractSpec(p.item as ProductNode)}</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-.3px' }}>€{Number(p.item?.selectedVariant?.price?.amount || p.item?.variants.edges[0].node.price.amount).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  {/* UPSELLS */}
                  <div style={{ marginTop: '28px' }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '2px', color: '#888da3', marginBottom: '14px' }}>DODATNE KOMPONENTE</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      
                      <button onClick={() => setAddingExtra(addingExtra === 'gpu2' ? null : 'gpu2')} 
                              style={{ width: '100%', padding: '15px 18px', textAlign: 'left', borderRadius: '12px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '14px', transition: 'all .2s', background: addingExtra==='gpu2' ? 'rgba(216,31,216,.08)' : 'transparent', border: addingExtra==='gpu2' ? '1px solid rgba(216,31,216,.45)' : '1px dashed rgba(255,255,255,.16)', color: addingExtra==='gpu2' ? '#f3f4f8' : '#9499ac' }}>
                        {gpu2 ? '✓ Druga grafička dodana — promijeni/ukloni' : '+ Dodaj drugu grafičku karticu'}
                      </button>
                      {addingExtra === 'gpu2' && (
                        <div style={{ background: '#11131b', borderRadius: '12px', padding: '10px', border: '1px solid rgba(255,255,255,.05)', maxHeight: '200px', overflowY: 'auto' }}>
                          <button onClick={() => { setGpu2(null); setAddingExtra(null); }} style={{ width:'100%', padding:'10px', textAlign:'left', background:'transparent', border:'none', color:'#ff6a82', cursor:'pointer', fontWeight:600 }}>✖ Ukloni</button>
                          {products.filter(p => p.pcfType?.value === "gpu").map(p => (
                             <div key={p.id}>
                               {p.variants.edges.map(v => (
                                 <button key={v.node.id} onClick={() => { setGpu2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }} style={{ width:'100%', display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid rgba(255,255,255,.05)', background:'transparent', color:'#fff', cursor:'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
                                   <span>{p.title} {v.node.title !== "Default Title" ? `(${v.node.title})` : ""}</span> 
                                   <span style={{ color: '#d81fd8', fontWeight: 600 }}>€{Number(v.node.price.amount).toFixed(2)}</span>
                                 </button>
                               ))}
                             </div>
                          ))}
                        </div>
                      )}

                      <button onClick={() => setAddingExtra(addingExtra === 'ssd2' ? null : 'ssd2')} 
                              style={{ width: '100%', padding: '15px 18px', textAlign: 'left', borderRadius: '12px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '14px', transition: 'all .2s', background: addingExtra==='ssd2' ? 'rgba(216,31,216,.08)' : 'transparent', border: addingExtra==='ssd2' ? '1px solid rgba(216,31,216,.45)' : '1px dashed rgba(255,255,255,.16)', color: addingExtra==='ssd2' ? '#f3f4f8' : '#9499ac' }}>
                        {ssd2 ? '✓ Dodatni SSD dodan — promijeni/ukloni' : '+ Dodaj dodatni SSD'}
                      </button>
                      {addingExtra === 'ssd2' && (
                        <div style={{ background: '#11131b', borderRadius: '12px', padding: '10px', border: '1px solid rgba(255,255,255,.05)', maxHeight: '200px', overflowY: 'auto' }}>
                          <button onClick={() => { setSsd2(null); setAddingExtra(null); }} style={{ width:'100%', padding:'10px', textAlign:'left', background:'transparent', border:'none', color:'#ff6a82', cursor:'pointer', fontWeight:600 }}>✖ Ukloni</button>
                          {products.filter(p => p.pcfType?.value === "ssd").map(p => (
                             <div key={p.id}>
                               {p.variants.edges.map(v => (
                                 <button key={v.node.id} onClick={() => { setSsd2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }} style={{ width:'100%', display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid rgba(255,255,255,.05)', background:'transparent', color:'#fff', cursor:'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
                                   <span>{p.title} {v.node.title !== "Default Title" ? `(${v.node.title})` : ""}</span> 
                                   <span style={{ color: '#d81fd8', fontWeight: 600 }}>€{Number(v.node.price.amount).toFixed(2)}</span>
                                 </button>
                               ))}
                             </div>
                          ))}
                        </div>
                      )}

                      <button onClick={() => setAddingExtra(addingExtra === 'hdd2' ? null : 'hdd2')} 
                              style={{ width: '100%', padding: '15px 18px', textAlign: 'left', borderRadius: '12px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '14px', transition: 'all .2s', background: addingExtra==='hdd2' ? 'rgba(216,31,216,.08)' : 'transparent', border: addingExtra==='hdd2' ? '1px solid rgba(216,31,216,.45)' : '1px dashed rgba(255,255,255,.16)', color: addingExtra==='hdd2' ? '#f3f4f8' : '#9499ac' }}>
                        {hdd2 ? '✓ Dodatni HDD dodan — promijeni/ukloni' : '+ Dodaj dodatni HDD'}
                      </button>
                      {addingExtra === 'hdd2' && (
                        <div style={{ background: '#11131b', borderRadius: '12px', padding: '10px', border: '1px solid rgba(255,255,255,.05)', maxHeight: '200px', overflowY: 'auto' }}>
                          <button onClick={() => { setHdd2(null); setAddingExtra(null); }} style={{ width:'100%', padding:'10px', textAlign:'left', background:'transparent', border:'none', color:'#ff6a82', cursor:'pointer', fontWeight:600 }}>✖ Ukloni</button>
                          {products.filter(p => p.pcfType?.value === "hdd").map(p => (
                             <div key={p.id}>
                               {p.variants.edges.map(v => (
                                 <button key={v.node.id} onClick={() => { setHdd2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }} style={{ width:'100%', display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid rgba(255,255,255,.05)', background:'transparent', color:'#fff', cursor:'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
                                   <span>{p.title} {v.node.title !== "Default Title" ? `(${v.node.title})` : ""}</span> 
                                   <span style={{ color: '#d81fd8', fontWeight: 600 }}>€{Number(v.node.price.amount).toFixed(2)}</span>
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

            {/* RIGHT SIDEBAR */}
            <div style={{ flex: '1 1 320px', maxWidth: '362px', minWidth: '288px', position: 'sticky', top: '18px' }}>
              <div style={{ background: '#11131b', border: '1px solid rgba(255,255,255,.07)', borderRadius: '18px', padding: '26px' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#888da3', letterSpacing: '2px' }}>UKUPNA CIJENA</div>
                <div style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-1.5px', marginTop: '6px' }}>€{currentTotal().toFixed(2)}</div>
                {isReviewStep && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#5a5f73', marginTop: '3px' }}>uklj. sklapanje i testiranje +€{ASSEMBLY_FEE}</div>}
                <div style={{ height: '1px', background: 'rgba(255,255,255,.07)', margin: '22px 0' }}></div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {selectedPartsList.map(p => (
                    <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                      <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '8px', background: '#07080c', border: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {p.item?.featuredImage ? <img src={p.item.featuredImage.url} style={{ width:'80%', height:'80%', objectFit:'contain' }}/> : <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#5a5f73' }}>{extractGlyph(p.item?.title||'', p.item?.pcfType?.value||'')}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#5a5f73', letterSpacing: '.5px' }}>{p.label}</div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{p.item?.title}</div>
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#888da3' }}>€{Number(p.item?.selectedVariant?.price?.amount || p.item?.variants.edges[0].node.price.amount).toFixed(0)}</div>
                    </div>
                  ))}
                </div>

                {bottleneckWarning && (
                  <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#ffd24a', borderRadius: '8px', fontSize: '12px', lineHeight: 1.4 }}>
                    {bottleneckWarning}
                  </div>
                )}

                <div style={{ marginTop: '24px', paddingTop: '22px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#888da3', letterSpacing: '1px', marginBottom: '10px' }}>
                    <span>POTROŠNJA</span><span style={{ color: isOverPower ? '#ff4d6d' : '#f3f4f8' }}>{estimatedDraw}W / {psuCapacity || '---'}W</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: '#07080c', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${powerPercentage}%`, height: '100%', borderRadius: '4px', background: isOverPower ? 'linear-gradient(90deg,#ff6a3d,#ff4d6d)' : 'linear-gradient(90deg,#a020f0,#d81fd8)', transition: 'width .45s ease' }}></div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#5a5f73', marginTop: '9px' }}>
                    {isOverPower ? 'Napajanje nedostatno — preporučujemo jači model' : psuCapacity > 0 ? `Dovoljno snage · ${(psuCapacity - estimatedDraw).toFixed(0)}W rezerve` : 'Sustav za procjenu snage'}
                  </div>
                </div>

                {isReviewStep && (
                  <>
                    <button className="hover-glow" disabled={isProcessing} onClick={handleCheckout} 
                            style={{ width: '100%', padding: '17px', marginTop: '22px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', color: '#fff', background: 'linear-gradient(135deg,#d81fd8,#a020f0)', boxShadow: '0 14px 34px -12px rgba(216,31,216,.75)', transition: 'filter .2s' }}>
                      {isProcessing ? 'Obrađujem narudžbu...' : 'Dodaj u košaricu'}
                    </button>
                    <button className="hover-border" onClick={() => { navigator.clipboard.writeText(window.location.href); setShareCopied(true); setTimeout(() => setShareCopied(false), 1800); }} 
                            style={{ width: '100%', padding: '13px', marginTop: '10px', borderRadius: '12px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '13.5px', color: '#f3f4f8', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', transition: 'border-color .2s' }}>
                      {shareCopied ? '✓ Link kopiran' : 'Podijeli konfiguraciju'}
                    </button>
                  </>
                )}
                {isPicker && (
                  <button className="hover-glow" onClick={() => { setStepIndex(11); try { window.scrollTo({ top:0 }); } catch(e){} }} 
                          style={{ width: '100%', padding: '17px', marginTop: '22px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', color: '#fff', background: 'linear-gradient(135deg,#d81fd8,#a020f0)', boxShadow: '0 14px 34px -12px rgba(216,31,216,.75)', transition: 'filter .2s' }}>
                    Pregled konfiguracije →
                  </button>
                )}

                <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '12px', color: '#5a5f73', lineHeight: 1.6, padding: '15px', background: 'rgba(255,255,255,.02)', borderRadius: '11px' }}>
                  Želite još prilagođenije računalo?<br />
                  <a href="https://racunalo.hr/pages/contact" target="_blank" rel="noopener noreferrer" style={{ color: '#d81fd8', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                    Kontaktirajte nas →
                  </a>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Builder() { 
  return (
    <Suspense fallback={<div style={{color: "white", padding: "100px", textAlign: "center", background: "#07080c", minHeight: "100vh", fontFamily: "'Space Grotesk', sans-serif"}}>Učitavanje aplikacije...</div>}>
      <BuilderContent />
    </Suspense>
  ); 
}