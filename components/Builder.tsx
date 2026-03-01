"use client";

import { CSSProperties, useEffect, useState, useCallback, Suspense } from "react";
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

// CLEAN 12-STEP FLOW (Extra parts moved to Review page)
type Step = "brand" | "cpu" | "motherboard" | "ram" | "gpu" | "ssd" | "hdd" | "case" | "psu" | "cooler" | "os" | "review";

const STEPS: Step[] = [
  "brand", "cpu", "motherboard", "ram", 
  "gpu", "ssd", "hdd", 
  "case", "psu", "cooler", "os", "review"
];

const STEP_LABELS: Record<Step, string> = {
  brand: "Platformu",
  cpu: "Procesor",
  motherboard: "Matičnu ploču",
  ram: "Radnu memoriju",
  gpu: "Grafičku karticu",
  ssd: "Glavni SSD",
  hdd: "Tvrdi disk - HDD (Opcionalno)",
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

  // States for Upsells on Review Page
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
    // Base 100W is ALWAYS added so the bar is always active
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

        const uBrand = searchParams.get("brand");
        if (uBrand) setBrand(uBrand);
        
        const loadParam = (param: string, setter: any) => {
          const found = allProducts.find((p: any) => p.id === searchParams.get(param));
          if (found) setter({ ...found, selectedVariant: found.variants.edges[0].node });
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

  const getBadgeStyle = (badgeText: string) => {
    const t = badgeText.toLowerCase();
    if (t.includes("ultimativni") || t.includes("kompromisa") || t.includes("apsolutni") || t.includes("profesionalce") || t.includes("trezor")) return { bg: "#6f42c1", color: "#fff" }; 
    if (t.includes("best buy") || t.includes("kralj")) return { bg: "#fd7e14", color: "#fff" }; 
    if (t.includes("zlatna") || t.includes("standard") || t.includes("radna stanica")) return { bg: "#ffc107", color: "#000" }; 
    if (t.includes("budžet") || t.includes("osnovni") || t.includes("start")) return { bg: "#20c997", color: "#fff" }; 
    if (t.includes("premium") || t.includes("masivna") || t.includes("maksimalna") || t.includes("zvijer")) return { bg: "#343a40", color: "#fff" }; 
    return { bg: "#007bff", color: "#fff" }; 
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
            <h1 style={{ textTransform: "capitalize", marginBottom: "10px" }}>Odaberi: {STEP_LABELS[STEPS[stepIndex]]}</h1>
            
            {["hdd", "os"].includes(STEPS[stepIndex]) && (
              <button 
                style={{ ...btnStyle, marginBottom: "20px", width: "100%", background: "#f8f9fa", border: "2px dashed #ccc", color: "#444", fontWeight: "bold" }} 
                onClick={handleSkip}
              >
                ⏭️ Preskoči ovaj korak (Nije obavezno)
              </button>
            )}

            {products.filter(p => {
              const type = p.pcfType?.value;
              const currentStep = STEPS[stepIndex];
              
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
            })
            .sort((a, b) => {
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
            })
            .map((p) => (
              <VariantProductCard 
                key={p.id} 
                p={p} 
                getBadgeStyle={getBadgeStyle} 
                onSelect={(selectedP: ProductNode) => handleSelection(STEPS[stepIndex], selectedP)} 
              />
            ))}
          </div>
        )}

        {STEPS[stepIndex] === "review" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ padding: "40px", background: "#f8f9fa", borderRadius: "15px", border: "1px solid #ddd" }}>
              <h1>🎉 Build je spreman!</h1>
              <p style={{ fontSize: "28px", margin: "20px 0", fontWeight: "bold", color: "#28a745" }}>
                Ukupna cijena: {currentTotal().toFixed(2)} €
              </p>
              <p style={{ color: "#666", fontSize: "14px" }}>(Uključen PDV i usluga slaganja od {ASSEMBLY_FEE} €)</p>
              <button disabled={isProcessing} onClick={handleCheckout} style={checkoutBtnStyle}>
                {isProcessing ? "Obrađujem..." : `Naruči i Plati`}
              </button>
              <button onClick={shareBuild} style={{ width: "100%", marginTop: "15px", padding: "15px", borderRadius: "8px", border: "2px solid #007bff", color: "#007bff", background: "#fff", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>
                🔗 Kopiraj link za dijeljenje
              </button>
            </div>

            {/* UPSELL SECTION (GPU, SSD, HDD) */}
            <div style={{ textAlign: "left", marginTop: "30px", padding: "25px", background: "#fff", borderRadius: "15px", border: "1px solid #ddd" }}>
              <h3 style={{ marginTop: 0, borderBottom: "2px solid #f0f0f0", paddingBottom: "10px", color: "#333" }}>Opcionalne Nadogradnje</h3>
              
              {/* 2. GPU UPSELL */}
              <div style={{ marginTop: "15px" }}>
                {!gpu2 ? (
                  <button onClick={() => setAddingExtra(addingExtra === "gpu2" ? null : "gpu2")} style={upsellBtnStyle}>
                    {addingExtra === "gpu2" ? "Odustani" : "➕ Dodaj 2. Grafičku (Za 3D i AI)"}
                  </button>
                ) : (
                  <div style={addedUpsellStyle}>
                    <span><strong>2. GPU:</strong> {gpu2.title} {gpu2.selectedVariant && gpu2.selectedVariant.title !== "Default Title" ? `(${gpu2.selectedVariant.title})` : ""}</span>
                    <button onClick={() => setGpu2(null)} style={removeBtnStyle}>✖ Ukloni</button>
                  </div>
                )}
                
                {addingExtra === "gpu2" && !gpu2 && (
                  <div style={dropdownListStyle}>
                    {getSortedExtras("gpu").flatMap(p => 
                      p.variants.edges.map(v => (
                        <button key={v.node.id} style={dropdownItemStyle} onClick={() => { setGpu2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}>
                          {p.title} {v.node.title !== "Default Title" ? `- ${v.node.title}` : ""} <span style={{color: "#28a745", fontWeight: "bold"}}>{Number(v.node.price.amount).toFixed(2)} €</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 2. SSD UPSELL */}
              <div style={{ marginTop: "15px" }}>
                {!ssd2 ? (
                  <button onClick={() => setAddingExtra(addingExtra === "ssd2" ? null : "ssd2")} style={upsellBtnStyle}>
                    {addingExtra === "ssd2" ? "Odustani" : "➕ Dodaj 2. SSD (Dodatna brza pohrana)"}
                  </button>
                ) : (
                  <div style={addedUpsellStyle}>
                    <span><strong>2. SSD:</strong> {ssd2.title} {ssd2.selectedVariant && ssd2.selectedVariant.title !== "Default Title" ? `(${ssd2.selectedVariant.title})` : ""}</span>
                    <button onClick={() => setSsd2(null)} style={removeBtnStyle}>✖ Ukloni</button>
                  </div>
                )}
                
                {addingExtra === "ssd2" && !ssd2 && (
                  <div style={dropdownListStyle}>
                    {getSortedExtras("ssd").flatMap(p => 
                      p.variants.edges.map(v => (
                        <button key={v.node.id} style={dropdownItemStyle} onClick={() => { setSsd2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}>
                          {p.title} {v.node.title !== "Default Title" ? `- ${v.node.title}` : ""} <span style={{color: "#28a745", fontWeight: "bold"}}>{Number(v.node.price.amount).toFixed(2)} €</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 2. HDD UPSELL */}
              <div style={{ marginTop: "15px" }}>
                {!hdd2 ? (
                  <button onClick={() => setAddingExtra(addingExtra === "hdd2" ? null : "hdd2")} style={upsellBtnStyle}>
                    {addingExtra === "hdd2" ? "Odustani" : "➕ Dodaj 2. HDD (Masivna pohrana)"}
                  </button>
                ) : (
                  <div style={addedUpsellStyle}>
                    <span><strong>2. HDD:</strong> {hdd2.title} {hdd2.selectedVariant && hdd2.selectedVariant.title !== "Default Title" ? `(${hdd2.selectedVariant.title})` : ""}</span>
                    <button onClick={() => setHdd2(null)} style={removeBtnStyle}>✖ Ukloni</button>
                  </div>
                )}
                
                {addingExtra === "hdd2" && !hdd2 && (
                  <div style={dropdownListStyle}>
                    {getSortedExtras("hdd").flatMap(p => 
                      p.variants.edges.map(v => (
                        <button key={v.node.id} style={dropdownItemStyle} onClick={() => { setHdd2({ ...p, selectedVariant: v.node }); setAddingExtra(null); }}>
                          {p.title} {v.node.title !== "Default Title" ? `- ${v.node.title}` : ""} <span style={{color: "#28a745", fontWeight: "bold"}}>{Number(v.node.price.amount).toFixed(2)} €</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>
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

      {/* RIGHT SIDEBAR */}
      <div style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: "16px", padding: "25px", background: "#fff", height: "fit-content", position: "sticky", top: "40px" }}>
        <h3 style={{ marginTop: 0, borderBottom: "2px solid #f0f0f0", paddingBottom: "15px" }}>Vaša Konfiguracija</h3>
        
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
        
        <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #eee" }} />
        
        {bottleneckWarning && (
          <div style={{ marginBottom: "20px", padding: "12px", background: "#fff3cd", borderRadius: "8px", border: "1px solid #ffeeba", color: "#856404", fontSize: "13px", lineHeight: "1.4" }}>
            {bottleneckWarning}
          </div>
        )}

        {/* ALWAY VISIBLE WATTAGE BAR */}
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
              ? "*Uključeno ~100W za matičnu i periferiju." 
              : (estimatedDraw >= psuCapacity ? "Upozorenje: Napajanje je preslabo!" : "Napajanje je optimalno.")}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "20px", color: "#000" }}>
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

// CLICK ANYWHERE ON CARD TO SELECT
function VariantProductCard({ p, onSelect, getBadgeStyle }: any) {
  const variants = p.variants.edges;
  const hasVariants = variants.length > 1;
  const [selectedVarId, setSelectedVarId] = useState(variants[0].node.id);
  
  const activeVariant = variants.find((v: any) => v.node.id === selectedVarId)?.node || variants[0].node;
  const price = Number(activeVariant.price.amount || 0);
  const badgeStyle = p.pcfBadge?.value ? getBadgeStyle(p.pcfBadge.value) : null;

  return (
    <div 
      onClick={() => onSelect({ ...p, selectedVariant: activeVariant })}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "20px", marginBottom: "12px", cursor: "pointer", border: "1px solid #e0e0e0", background: "#fff", borderRadius: "10px", transition: "all 0.2s ease-in-out" }}
    >
      <div style={{ textAlign: "left", flex: 1, paddingRight: "15px" }}>
        <span style={{ fontWeight: "600", color: "#000", fontSize: "18px" }}>{p.title}</span>
        {p.pcfBadge?.value && badgeStyle && (
          <div style={{ marginTop: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", backgroundColor: badgeStyle.bg, color: badgeStyle.color, padding: "5px 12px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px", display: "inline-block" }}>
              {p.pcfBadge.value}
            </span>
          </div>
        )}
      </div>
      
      <div style={{ textAlign: "right", minWidth: "150px" }}>
        {hasVariants && (
          <select 
            value={selectedVarId} 
            onChange={(e) => {
              e.stopPropagation(); // Prevents click from advancing the page
              setSelectedVarId(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()} // Prevents click from advancing the page
            style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "8px", fontSize: "14px", outline: "none", cursor: "pointer", background: "#f8f9fa", fontWeight: "500" }}
          >
            {variants.map((v: any) => (
              <option key={v.node.id} value={v.node.id}>
                {v.node.title !== "Default Title" ? v.node.title : "Standard"}
              </option>
            ))}
          </select>
        )}
        <div style={{ fontWeight: "bold", color: "#28a745", fontSize: "20px" }}>
          {price > 0 ? `${price.toFixed(2)} €` : "—"}
        </div>
      </div>
    </div>
  );
}

function SidebarRow({ label, item }: { label: string; item?: ProductNode | null }) {
  if (!item) return null; 
  const variantName = item.selectedVariant && item.selectedVariant.title !== "Default Title" ? ` (${item.selectedVariant.title})` : "";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "12px", borderBottom: "1px dashed #eee", paddingBottom: "4px" }}>
      <span style={{ color: "#666", minWidth: "80px" }}>{label}:</span>
      <span style={{ textAlign: "right", marginLeft: "10px", fontWeight: "600", color: "#000" }}>{item.title}{variantName}</span>
    </div>
  );
}

/* STYLES */
const btnStyle: CSSProperties = { flex: 1, padding: "20px", cursor: "pointer", border: "1px solid #ddd", background: "#fff", borderRadius: "8px", fontSize: "18px", fontWeight: "bold", transition: "0.2s" };
const checkoutBtnStyle: CSSProperties = { width: "100%", padding: "20px", background: "#000", color: "#fff", fontWeight: "bold", cursor: "pointer", borderRadius: "8px", fontSize: "18px", border: "none", marginTop: "10px" };
const upsellBtnStyle: CSSProperties = { width: "100%", padding: "12px", border: "1px dashed #007bff", background: "#f8faff", color: "#007bff", fontWeight: "bold", borderRadius: "8px", cursor: "pointer", textAlign: "left" as const };
const addedUpsellStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#e9ecef", borderRadius: "8px", fontSize: "14px" };
const removeBtnStyle: CSSProperties = { color: "#dc3545", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" };
const dropdownListStyle: CSSProperties = { marginTop: "10px", maxHeight: "250px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "8px", background: "#fff" };
const dropdownItemStyle: CSSProperties = { width: "100%", display: "flex", justifyContent: "space-between", padding: "12px 15px", border: "none", borderBottom: "1px solid #eee", background: "#fff", cursor: "pointer", fontSize: "14px", textAlign: "left" as const };