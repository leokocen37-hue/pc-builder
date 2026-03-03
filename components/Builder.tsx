"use client";

import { CSSProperties, useEffect, useState, Suspense } from "react";
import { shopifyFetch } from "@/lib/shopify";
import { useSearchParams, useRouter } from "next/navigation";

type ProductNode = {
  id: string;
  title: string;
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

const STEPS: Step[] = [
  "brand", "cpu", "motherboard", "ram", 
  "gpu", "ssd", "hdd", 
  "case", "psu", "cooler", "os", "review"
];

const STEP_LABELS: Record<Step, string> = {
  brand: "Platformu",
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
  review: "Pregled"
};

function BuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [products, setProducts] = useState<ProductNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedVarId, setSelectedVarId] = useState("");

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

  const ASSEMBLY_FEE = 200;
  const isReviewStep = STEPS[stepIndex] === "review";

  const calculateSystemTDP = () => {
    const parts = [cpu, mb, ram, gpu, gpu2, pcCase, cooler];
    const componentsDraw = parts.reduce((sum, part) => {
      return sum + Number(part?.pcfTdp?.value || 0);
    }, 0);
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

  const checkBottleneck = () => {
    if (!cpu || !gpu) return null;
    const cpuScore = getQualityScore(cpu.pcfQuality?.value);
    const gpuScore = getQualityScore(gpu.pcfQuality?.value);
    if (gpuScore >= 3 && cpuScore <= 2 && (gpuScore - cpuScore >= 2)) return "⚠️ Upozorenje (Bottleneck): Vaš procesor je znatno slabiji od odabrane grafičke kartice.";
    if (cpuScore >= 4 && gpuScore <= 2) return "ℹ️ Napomena: Odabrali ste vrhunski procesor i budžet grafičku karticu.";
    return null;
  };

  const bottleneckWarning = checkBottleneck();

  useEffect(() => {
    if (isReviewStep) {
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
                  variants(first: 50) { edges { node { id title price { amount } } } }
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
        
        const loadParam = (param: string, setter: any) => {
          const found = allProducts.find((p: any) => p.id === searchParams.get(param));
          if (found) setter({ ...found, selectedVariant: found.variants.edges[0].node });
        };

        const uBrand = searchParams.get("brand");
        if (uBrand) setBrand(uBrand);

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

  // Reset carousel index when step changes
  useEffect(() => {
    setActiveIndex(0);
  }, [stepIndex]);

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
    alert("Link za vašu konfiguraciju je kopiran!");
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
      if (data.draftOrder?.invoiceUrl) window.location.href = data.draftOrder.invoiceUrl;
      else { alert("Greška"); setIsProcessing(false); }
    } catch (error) {
      alert("Serverska greška");
      setIsProcessing(false);
    }
  };

  const getSortedExtras = (type: string) => {
    return products
      .filter(p => p.pcfType?.value === type)
      .sort((a, b) => {
         const priceA = Number(a.variants.edges[0]?.node.price.amount || 0);
         const priceB = Number(b.variants.edges[0]?.node.price.amount || 0);
         return priceB - priceA;
      });
  };

  // Generate Current Products list
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
      // Set the default selected variant ID whenever active product changes
      setSelectedVarId(activeProduct.variants.edges[0].node.id);
    }
  }, [activeProduct]);

  if (loading) return <div style={{ padding: "100px", textAlign: "center", color: "white" }}>Učitavanje...</div>;

  // DYNAMIC BACKGROUND COLOR
  const bgStyle = {
    background: brand === 'amd' ? 'linear-gradient(135deg, #222 45%, #e05e00 45%)' :
                brand === 'intel' ? 'linear-gradient(135deg, #222 45%, #0066cc 45%)' :
                'linear-gradient(135deg, #222 45%, #333 45%)',
    minHeight: '100vh',
    width: '100%',
    color: '#fff',
    padding: '40px 20px',
    transition: 'background 0.5s ease-in-out'
  };

  return (
    <div style={bgStyle}>
      <div style={{ display: "flex", maxWidth: "1400px", margin: "0 auto", gap: "40px" }}>
        
        {/* LEFT MAIN AREA */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", minHeight: "80vh", position: "relative" }}>
          
          {/* TOP BAR / STEP TITLE */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", background: "rgba(0,0,0,0.4)", padding: "15px 30px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h1 style={{ margin: 0, fontSize: "24px", textTransform: "uppercase", letterSpacing: "2px" }}>
              {STEP_LABELS[STEPS[stepIndex]]}
            </h1>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
              €{currentTotal().toFixed(2)}
            </div>
          </div>

          {/* STEP 0: BRAND SELECTION */}
          {STEPS[stepIndex] === "brand" && (
            <div style={{ display: "flex", gap: "30px", justifyContent: "center", alignItems: "center", flex: 1 }}>
              <button 
                onClick={() => { setBrand("intel"); setStepIndex(1); }}
                style={{ ...brandBtnStyle, background: "linear-gradient(135deg, #004488, #0066cc)" }}
              >
                INTEL
              </button>
              <button 
                onClick={() => { setBrand("amd"); setStepIndex(1); }}
                style={{ ...brandBtnStyle, background: "linear-gradient(135deg, #cc4400, #ff6600)" }}
              >
                AMD
              </button>
            </div>
          )}

          {/* CAROUSEL STEPS */}
          {stepIndex > 0 && stepIndex < STEPS.length - 1 && currentProducts.length > 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" }}>
              
              {/* Carousel Container */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", width: "100%", height: "350px", position: "relative" }}>
                
                {/* Left Arrow */}
                <button onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))} style={navArrowStyle}>&lt;</button>

                {/* Items */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "30px", width: "70%", overflow: "hidden" }}>
                  {currentProducts.map((p, idx) => {
                    const isActive = idx === activeIndex;
                    const isAdjacent = Math.abs(idx - activeIndex) === 1;
                    if (!isActive && !isAdjacent) return <div key={p.id} style={{ display: "none" }} />;

                    return (
                      <div 
                        key={p.id} 
                        onClick={() => setActiveIndex(idx)}
                        style={{
                          width: isActive ? "240px" : "180px",
                          height: isActive ? "280px" : "210px",
                          background: "linear-gradient(145deg, #333, #222)",
                          border: isActive ? `2px solid ${brand === 'amd' ? '#ff6600' : '#0066cc'}` : "1px solid #444",
                          borderRadius: "15px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          textAlign: "center",
                          padding: "20px",
                          cursor: isActive ? "default" : "pointer",
                          transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
                          opacity: isActive ? 1 : 0.6,
                          transform: isActive ? "scale(1.05)" : "scale(1)",
                          boxShadow: isActive ? `0 15px 35px rgba(0,0,0,0.5)` : "none"
                        }}
                      >
                         <h3 style={{ fontSize: isActive ? "18px" : "14px", margin: 0 }}>{p.title}</h3>
                      </div>
                    );
                  })}
                </div>

                {/* Right Arrow */}
                <button onClick={() => setActiveIndex(Math.min(currentProducts.length - 1, activeIndex + 1))} style={navArrowStyle}>&gt;</button>
              </div>

              {/* ACTIVE ITEM DETAILS & VARIANTS (Shows below carousel) */}
              <div style={{ marginTop: "30px", width: "60%", background: "rgba(0,0,0,0.5)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                 <h2 style={{ margin: "0 0 10px 0" }}>{activeProduct?.title}</h2>
                 
                 {activeProduct?.variants.edges.length > 1 && (
                    <select 
                      value={selectedVarId} 
                      onChange={(e) => setSelectedVarId(e.target.value)}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #555", background: "#222", color: "#fff", marginBottom: "15px", fontSize: "16px", outline: "none", cursor: "pointer" }}
                    >
                      {activeProduct.variants.edges.map((v: any) => (
                        <option key={v.node.id} value={v.node.id}>
                          {v.node.title !== "Default Title" ? v.node.title : "Standard"}
                        </option>
                      ))}
                    </select>
                 )}

                 <div style={{ fontSize: "24px", fontWeight: "bold", color: brand === 'amd' ? '#ffcc00' : '#66b3ff' }}>
                    {Number(activeProduct?.variants.edges.find((v:any) => v.node.id === selectedVarId)?.node.price.amount || activeProduct?.variants.edges[0].node.price.amount || 0).toFixed(2)} €
                 </div>
              </div>

            </div>
          )}

          {/* BOTTOM NAVIGATION BAR */}
          {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: "20px" }}>
              <button onClick={() => setStepIndex(stepIndex - 1)} style={bottomNavBtnStyle}>
                NAZAD
              </button>
              
              {["hdd", "os"].includes(STEPS[stepIndex]) && (
                <button onClick={handleSkip} style={{ ...bottomNavBtnStyle, background: "rgba(255,255,255,0.1)", color: "#aaa" }}>
                  PRESKOČI
                </button>
              )}

              <button 
                onClick={() => {
                  const variantNode = activeProduct.variants.edges.find((v:any) => v.node.id === selectedVarId)?.node || activeProduct.variants.edges[0].node;
                  handleSelection(STEPS[stepIndex], { ...activeProduct, selectedVariant: variantNode });
                }} 
                style={{ ...bottomNavBtnStyle, background: "#fff", color: "#000" }}
              >
                DALJE
              </button>
            </div>
          )}

          {/* REVIEW STEP - Restored and Adjusted for Dark Theme */}
          {STEPS[stepIndex] === "review" && (
            <div style={{ textAlign: "center", color: "#fff", width: "100%", paddingBottom: "40px", paddingTop: "20px" }}>
              <div style={{ padding: "40px", background: "rgba(0,0,0,0.5)", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                <h1>🎉 Build je spreman!</h1>
                <p style={{ fontSize: "28px", margin: "20px 0", fontWeight: "bold", color: brand === 'amd' ? '#ffcc00' : '#66b3ff' }}>
                  Ukupna cijena: {currentTotal().toFixed(2)} €
                </p>
                <p style={{ color: "#aaa", fontSize: "14px" }}>(Uključen PDV i usluga slaganja od {ASSEMBLY_FEE} €)</p>
                
                <button disabled={isProcessing} onClick={handleCheckout} style={{ ...checkoutBtnStyle, background: brand === 'amd' ? '#ff6600' : '#0066cc', color: "#fff", border: "none", marginTop: "20px" }}>
                  {isProcessing ? "Obrađujem..." : `Naruči i Plati`}
                </button>
                
                <button onClick={shareBuild} style={{ width: "100%", marginTop: "15px", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", background: "transparent", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>
                  🔗 Kopiraj link za dijeljenje
                </button>
              </div>

              {/* UPSELL SECTION (GPU, SSD, HDD) */}
              <div style={{ textAlign: "left", marginTop: "30px", padding: "25px", background: "rgba(0,0,0,0.5)", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                <h3 style={{ marginTop: 0, borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "10px", color: "#fff" }}>Opcionalne Nadogradnje</h3>
                
                {/* 2. GPU UPSELL */}
                <div style={{ marginTop: "15px" }}>
                  {!gpu2 ? (
                    <button onClick={() => setAddingExtra(addingExtra === "gpu2" ? null : "gpu2")} style={{...upsellBtnStyle, background: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.2)"}}>
                      {addingExtra === "gpu2" ? "Odustani" : "➕ Dodaj 2. Grafičku (Za 3D i AI)"}
                    </button>
                  ) : (
                    <div style={{...addedUpsellStyle, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)"}}>
                      <span><strong>2. GPU:</strong> {gpu2.title} {gpu2.selectedVariant && gpu2.selectedVariant.title !== "Default Title" ? `(${gpu2.selectedVariant.title})` : ""}</span>
                      <button onClick={() => setGpu2(null)} style={removeBtnStyle}>✖ Ukloni</button>
                    </div>
                  )}
                  
                  {addingExtra === "gpu2" && !gpu2 && (
                    <div style={{...dropdownListStyle, background: "#222", borderColor: "#444"}}>
                      {getSortedExtras("gpu").flatMap(p => 
                        p.variants.edges.map(v => (
                          <button key={v.node.id} style={{...dropdownItemStyle, background: "#222", color: "#fff", borderBottomColor: "#333"}} onClick={() => { setGpu2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}>
                            {p.title} {v.node.title !== "Default Title" ? `- ${v.node.title}` : ""} <span style={{color: brand === 'amd' ? '#ffcc00' : '#66b3ff', fontWeight: "bold"}}>{Number(v.node.price.amount).toFixed(2)} €</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 2. SSD UPSELL */}
                <div style={{ marginTop: "15px" }}>
                  {!ssd2 ? (
                    <button onClick={() => setAddingExtra(addingExtra === "ssd2" ? null : "ssd2")} style={{...upsellBtnStyle, background: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.2)"}}>
                      {addingExtra === "ssd2" ? "Odustani" : "➕ Dodaj 2. SSD (Dodatna brza pohrana)"}
                    </button>
                  ) : (
                    <div style={{...addedUpsellStyle, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)"}}>
                      <span><strong>2. SSD:</strong> {ssd2.title} {ssd2.selectedVariant && ssd2.selectedVariant.title !== "Default Title" ? `(${ssd2.selectedVariant.title})` : ""}</span>
                      <button onClick={() => setSsd2(null)} style={removeBtnStyle}>✖ Ukloni</button>
                    </div>
                  )}
                  
                  {addingExtra === "ssd2" && !ssd2 && (
                    <div style={{...dropdownListStyle, background: "#222", borderColor: "#444"}}>
                      {getSortedExtras("ssd").flatMap(p => 
                        p.variants.edges.map(v => (
                          <button key={v.node.id} style={{...dropdownItemStyle, background: "#222", color: "#fff", borderBottomColor: "#333"}} onClick={() => { setSsd2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}>
                            {p.title} {v.node.title !== "Default Title" ? `- ${v.node.title}` : ""} <span style={{color: brand === 'amd' ? '#ffcc00' : '#66b3ff', fontWeight: "bold"}}>{Number(v.node.price.amount).toFixed(2)} €</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 2. HDD UPSELL */}
                <div style={{ marginTop: "15px" }}>
                  {!hdd2 ? (
                    <button onClick={() => setAddingExtra(addingExtra === "hdd2" ? null : "hdd2")} style={{...upsellBtnStyle, background: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.2)"}}>
                      {addingExtra === "hdd2" ? "Odustani" : "➕ Dodaj 2. HDD (Masivna pohrana)"}
                    </button>
                  ) : (
                    <div style={{...addedUpsellStyle, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)"}}>
                      <span><strong>2. HDD:</strong> {hdd2.title} {hdd2.selectedVariant && hdd2.selectedVariant.title !== "Default Title" ? `(${hdd2.selectedVariant.title})` : ""}</span>
                      <button onClick={() => setHdd2(null)} style={removeBtnStyle}>✖ Ukloni</button>
                    </div>
                  )}
                  
                  {addingExtra === "hdd2" && !hdd2 && (
                    <div style={{...dropdownListStyle, background: "#222", borderColor: "#444"}}>
                      {getSortedExtras("hdd").flatMap(p => 
                        p.variants.edges.map(v => (
                          <button key={v.node.id} style={{...dropdownItemStyle, background: "#222", color: "#fff", borderBottomColor: "#333"}} onClick={() => { setHdd2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}>
                            {p.title} {v.node.title !== "Default Title" ? `- ${v.node.title}` : ""} <span style={{color: brand === 'amd' ? '#ffcc00' : '#66b3ff', fontWeight: "bold"}}>{Number(v.node.price.amount).toFixed(2)} €</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

              </div>
              <button onClick={resetBuild} style={{ ...bottomNavBtnStyle, marginTop: "30px", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
                🔄 Počni ispočetka
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR - GLASSMORPHISM THEME */}
        <div style={{ flex: 1, background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "25px", height: "fit-content", position: "sticky", top: "40px" }}>
          <h3 style={{ marginTop: 0, borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "15px", color: "#fff" }}>Vaša Konfiguracija</h3>
          
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

          {/* ALWAY VISIBLE WATTAGE BAR */}
          <div style={{ marginBottom: "20px", padding: "15px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", fontWeight: "bold", color: "#ddd" }}>
              <span>Potrošnja sustava:</span>
              <span>{estimatedDraw}W {psuCapacity > 0 ? `/ ${psuCapacity}W` : ""}</span>
            </div>
            
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ 
                height: "100%", 
                width: `${powerPercentage}%`, 
                background: psuCapacity > 0 && estimatedDraw >= psuCapacity ? "#dc3545" : (psuCapacity > 0 ? "#28a745" : (brand === 'amd' ? '#ff6600' : '#0066cc')),
                transition: "width 0.4s ease, background 0.4s ease" 
              }} />
            </div>
            
            <p style={{ fontSize: "11px", color: "#888", marginTop: "8px", textAlign: "right" }}>
              {psuCapacity === 0 
                ? "*Uključeno ~100W za matičnu i periferiju." 
                : (estimatedDraw >= psuCapacity ? "Upozorenje: Napajanje je preslabo!" : "Napajanje je optimalno.")}
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "20px", color: "#fff" }}>
            <span>Ukupno:</span>
            <span>{currentTotal().toFixed(2)} €</span>
          </div>
          
          {isReviewStep ? (
            <p style={{ fontSize: "12px", color: "#999", marginTop: "5px", textAlign: "right", fontWeight: "bold" }}>
              Uključuje uslugu slaganja ({ASSEMBLY_FEE} €)
            </p>
          ) : (
            <p style={{ fontSize: "12px", color: "#999", marginTop: "5px", textAlign: "right" }}>
              * Usluga slaganja ({ASSEMBLY_FEE} €) bit će dodana na kraju.
            </p>
          )}

        </div>
      </div>
    </div>
  );
}

export default function Builder() {
  return (
    <Suspense fallback={<div style={{color: "white"}}>Učitavanje...</div>}>
      <BuilderContent />
    </Suspense>
  );
}

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

/* STYLES */
const brandBtnStyle: CSSProperties = { width: "250px", height: "150px", fontSize: "32px", fontWeight: "bold", color: "#fff", border: "none", borderRadius: "16px", cursor: "pointer", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", transition: "transform 0.2s" };
const navArrowStyle: CSSProperties = { background: "rgba(255,255,255,0.1)", border: "none", color: "white", fontSize: "30px", width: "50px", height: "50px", borderRadius: "50%", cursor: "pointer", backdropFilter: "blur(5px)" };
const bottomNavBtnStyle: CSSProperties = { padding: "15px 40px", borderRadius: "30px", fontSize: "16px", fontWeight: "bold", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.8)", color: "#000", transition: "0.2s" };
const checkoutBtnStyle: CSSProperties = { width: "100%", padding: "20px", fontWeight: "bold", cursor: "pointer", borderRadius: "8px", fontSize: "18px" };
const upsellBtnStyle: CSSProperties = { width: "100%", padding: "12px", border: "1px dashed", fontWeight: "bold", borderRadius: "8px", cursor: "pointer", textAlign: "left" as const };
const addedUpsellStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "8px", fontSize: "14px" };
const removeBtnStyle: CSSProperties = { color: "#ff4d4d", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" };
const dropdownListStyle: CSSProperties = { marginTop: "10px", maxHeight: "250px", overflowY: "auto", border: "1px solid", borderRadius: "8px" };
const dropdownItemStyle: CSSProperties = { width: "100%", display: "flex", justifyContent: "space-between", padding: "12px 15px", border: "none", borderBottom: "1px solid", cursor: "pointer", fontSize: "14px", textAlign: "left" as const };