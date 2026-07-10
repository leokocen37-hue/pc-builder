"use client";
import { CSSProperties, useEffect, useState, Suspense, useRef } from "react";
import { shopifyFetch } from "@/lib/shopify";
import { useCart } from "@/lib/cart";
import { ASSEMBLY_FEE } from "@/lib/pricing";
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
        price: { amount: string };
        image?: { url: string; altText?: string };
      };
    }[];
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
  pcfRadiatorSize?: { value: string };
  pcfSupportedRadiators?: { value: string };
  pcfWattage?: { value: string };
  pcfCoolerHeight?: { value: string };
  pcfMaxTdp?: { value: string };
  pcfQuality?: { value: string };
  pcfBadge?: { value: string };
  pcfBadgeColor?: { value: string };
  pcfRecommended?: { value: string };
  pcfSpecs?: { value: string };
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
  "review",
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
  review: "Pregled Konfiguracije",
};

// Short labels for the horizontal step rail
const RAIL_LABELS: Record<Step, string> = {
  brand: "Platforma",
  cpu: "Procesor",
  motherboard: "Matična",
  ram: "Memorija",
  gpu: "Grafička",
  ssd: "SSD",
  hdd: "HDD",
  case: "Kućište",
  psu: "Napajanje",
  cooler: "Hladnjak",
  os: "Sustav",
  review: "Pregled",
};

// Short glyph for the image placeholder / review rows
const STEP_GLYPH: Record<string, string> = {
  cpu: "CPU",
  motherboard: "MB",
  ram: "RAM",
  gpu: "GPU",
  gpu2: "GPU",
  ssd: "SSD",
  ssd2: "SSD",
  hdd: "HDD",
  hdd2: "HDD",
  case: "CASE",
  psu: "PSU",
  cooler: "COOL",
  os: "OS",
};

// Plain-language guidance so non-technical buyers can choose a variant with confidence.
const REC_LINE = " Opciju koju preporučujemo označili smo zvjezdicom ★.";
const STEP_HELP: Record<string, string> = {
  cpu: "Procesor je 'mozak' računala. Varijante se uglavnom razlikuju po broju jezgri i brzini — više znači brže u zahtjevnim zadacima i igrama. Sve su kompatibilne s odabranom platformom." + REC_LINE,
  motherboard: "Matična ploča povezuje sve komponente. Sve ponuđene odgovaraju vašem procesoru. Skuplje ploče nude više priključaka (USB, M.2), bolje napajanje za overclock i jače WiFi — za većinu korisnika i povoljnija ploča radi jednako pouzdano." + REC_LINE,
  ram: "RAM je radna memorija — kratkoročni prostor u kojem računalo drži ono na čemu trenutno radi. Najvažnije je koliko GB ima: 16 GB je dovoljno za većinu, 32 GB za igre i posao, a 64 GB+ za profesionalni rad poput montaže ili 3D-a. Brojevi uz to govore o brzini: MHz (npr. 6000) — veći broj je brži; i CL (npr. CL30) — kod njega je manji broj bolji. Sve opcije su provjereno kompatibilne s vašom pločom." + REC_LINE,
  gpu: "Grafička kartica crta sliku i najviše utječe na igre. Varijante dijele isti čip, a razlikuju se po proizvođaču i hlađenju." + REC_LINE,
  ssd: "SSD je glavni disk — tu se instaliraju Windows, igre i programi, i on čini računalo brzim pri pokretanju. Birate kapacitet: što je veći broj (TB), to više stane. Svi su brzi (NVMe), razlika je uglavnom u prostoru." + REC_LINE,
  hdd: "Tvrdi disk (HDD) je jeftin dodatni prostor za pohranu — filmovi, slike, sigurnosne kopije. Veći broj TB = više prostora. Sporiji je od SSD-a pa služi za arhivu, ne za igre." + REC_LINE,
  psu: "Napajanje opskrbljuje cijelo računalo strujom. Veći broj W (vati) znači više snage u rezervi; konfigurator već pazi da bude dovoljno za vaše komponente. Kvalitetnije napajanje (80+ Gold i više) radi tiše i pouzdanije." + REC_LINE,
  cooler: "Hladnjak drži procesor na sigurnoj temperaturi da radi mirno i tiho. Sve ponuđene opcije pristaju na vaš procesor i kućište. Zračni hladnjaci su jednostavni i pouzdani, a vodeni (AIO) tiši uz jače procesore." + REC_LINE,
  case: "Kućište je najviše stvar osobnog ukusa — sva su kvalitetna i vaše odabrane komponente stanu u svako od njih. Razlikuju se po izgledu, protoku zraka i staklenim stranicama. Odaberite ono koje vam se najviše sviđa." + REC_LINE,
  os: "Svako računalo isporučujemo sa instaliranim i temeljito testiranim sustavom Windows. Windows 11 Home/Pro dolaze s aktivnom licencom. Ako odaberete „Bez operativnog sustava\u201d, i dalje instaliramo Windows kako bismo računalo provjerili i testirali, ali bez aktivirane licence — aktivirate ga vlastitim ključem. Računalo nikada ne šaljemo neispravno ili neprovjereno.",
};

// --- FONTS ---
const FONT = "'Space Grotesk', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

// --- COLOR PALETTE (from the new design) ---
const COLORS = {
  bgMain: "#07080c",
  bgCard: "#11131b",
  bgDark: "#07080c",
  border: "rgba(255,255,255,.07)",
  borderSolid: "rgba(255,255,255,.12)",
  textMain: "#f3f4f8",
  textMuted: "#888da3",
  textFaint: "#5a5f73",
  accent: "#d81fd8",
};

function BuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialized = useRef(false);
  const movedRef = useRef(false);
  const capturedRef = useRef(false);
  const downIdxRef = useRef<number | null>(null);

  // --- STATE ---
  const [stepIndex, setStepIndex] = useState(0);
  const [products, setProducts] = useState<ProductNode[]>([]);
  const [loading, setLoading] = useState(true);
  const { addCustomBuild } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedVarId, setSelectedVarId] = useState("");
  const [startX, setStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"coverflow" | "grid">("coverflow");
  const [shareCopied, setShareCopied] = useState(false);
  const [hoverBrand, setHoverBrand] = useState<string | null>(null);
  const [hoverCard, setHoverCard] = useState<number | null>(null);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", budget: "", message: "" });
  const [contactState, setContactState] = useState<"idle" | "sending" | "sent" | "invalid" | "error">("idle");
  const [contactError, setContactError] = useState("");

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

  const currentStep = STEPS[stepIndex];
  const isReviewStep = currentStep === "review";
  const isBrandStep = currentStep === "brand";

  // --- HARDWARE LOGIC ---
  const calculateSystemTDP = () => {
    const parts = [cpu, mb, ram, gpu, gpu2, pcCase, cooler];
    const componentsDraw = parts.reduce((sum, part) => {
      return sum + Number(part?.pcfTdp?.value || 0);
    }, 0);
    return componentsDraw + 150;
  };
  const estimatedDraw = calculateSystemTDP();
  const psuCapacity = Number(psu?.pcfWattage?.value || 0);

  let powerPercentage = 50;
  if (psuCapacity > 0) {
    powerPercentage = Math.min((estimatedDraw / psuCapacity) * 100, 100);
  } else {
    powerPercentage = Math.min((estimatedDraw / 1000) * 100, 100);
  }
  const psuOver = psuCapacity > 0 && estimatedDraw >= psuCapacity;
  const powerNote =
    psuCapacity > 0
      ? psuOver
        ? "Napajanje je preslabo za odabrane komponente"
        : `Dovoljno snage · ${psuCapacity - estimatedDraw}W rezerve`
      : "Odaberite napajanje za izračun rezerve";

  const getQualityScore = (quality?: string) => {
    const q = (quality || "").toLowerCase();
    if (q === "flagship") return 5;
    if (q === "excellent") return 4;
    if (q === "very good") return 3;
    if (q === "good") return 2;
    if (q === "average") return 1;
    return 0;
  };

  // Badge colors are chosen per-product via the pcf.badge_color metafield (a number).
  // Map a number -> gradient. Add more entries here if you add more colors.
  const BADGE_COLORS: Record<string, { bg: string; color: string; glow: string }> = {
    "1": { bg: "linear-gradient(135deg,#d81fd8,#7b2ff7)", color: "#fff", glow: "rgba(216,31,216,.5)" }, // purple/magenta
    "2": { bg: "linear-gradient(135deg,#ff9a3d,#ff5e00)", color: "#1a0d00", glow: "rgba(255,110,0,.4)" }, // orange
    "3": { bg: "linear-gradient(135deg,#ffd24a,#e0a400)", color: "#1a1400", glow: "rgba(224,164,0,.35)" }, // gold
    "4": { bg: "linear-gradient(135deg,#9aa3b5,#5b6678)", color: "#fff", glow: "rgba(120,130,150,.35)" }, // silver/grey
    "5": { bg: "linear-gradient(135deg,#3da5ff,#1f6fe0)", color: "#fff", glow: "rgba(31,111,224,.4)" }, // blue
    "6": { bg: "linear-gradient(135deg,#27c08a,#0e8f63)", color: "#fff", glow: "rgba(39,192,138,.4)" }, // green
    "7": { bg: "linear-gradient(135deg,#ff5e7a,#d61f45)", color: "#fff", glow: "rgba(255,94,122,.4)" }, // red/pink
    "8": { bg: "linear-gradient(135deg,#22d3ee,#0891b2)", color: "#06222a", glow: "rgba(34,211,238,.4)" }, // teal/cyan
  };
  const DEFAULT_BADGE = BADGE_COLORS["5"]; // blue

  // Keyword fallback, used only when a product has no badge_color number set.
  const badgeStyleFromText = (badgeText: string) => {
    const t = (badgeText || "").toLowerCase();
    if (t.includes("ultimativni") || t.includes("apsolutni") || t.includes("vrh")) return BADGE_COLORS["1"];
    if (t.includes("best buy") || t.includes("kralj")) return BADGE_COLORS["2"];
    if (t.includes("standard") || t.includes("zlatna")) return BADGE_COLORS["3"];
    if (t.includes("premium") || t.includes("zvijer")) return BADGE_COLORS["4"];
    return DEFAULT_BADGE;
  };

  const getBadgeStyle = (badgeText: string, colorNum?: string) => {
    const key = (colorNum || "").trim();
    if (key && BADGE_COLORS[key]) return BADGE_COLORS[key];
    return badgeStyleFromText(badgeText);
  };

  const checkBottleneck = () => {
    if (!cpu || !gpu) return null;
    const cpuScore = getQualityScore(cpu.pcfQuality?.value);
    const gpuScore = getQualityScore(gpu.pcfQuality?.value);

    if (gpuScore >= 3 && cpuScore <= 2 && gpuScore - cpuScore >= 2) {
      return "⚠️ Upozorenje (Bottleneck): Vaš procesor je preslab za odabranu grafičku karticu.";
    }
    return null;
  };
  const bottleneckWarning = checkBottleneck();

  // --- FONT INJECTION ---
  useEffect(() => {
    const id = "pcf-fonts";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap";
    document.head.appendChild(l);
  }, []);

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
                  tags
                  featuredImage { url altText }
                  variants(first: 50) {
                    edges {
                      node {
                        id
                        title
                        price { amount }
                        image { url altText }
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
                  pcfGpuLength: metafield(namespace: "pcf", key: "gpu_length") { value }
                  pcfMaxGpuLength: metafield(namespace: "pcf", key: "max_gpu_length") { value }
                  pcfCoolerHeight: metafield(namespace: "pcf", key: "cooler_height") { value }
                  pcfMaxCoolerHeight: metafield(namespace: "pcf", key: "max_cooler_height") { value }
                  pcfRadiatorSize: metafield(namespace: "pcf", key: "radiator_size") { value }
                  pcfSupportedRadiators: metafield(namespace: "pcf", key: "supported_radiators") { value }
                  pcfWattage: metafield(namespace: "pcf", key: "wattage") { value }
                  pcfQuality: metafield(namespace: "pcf", key: "quality") { value }
                  pcfBadge: metafield(namespace: "pcf", key: "badge") { value }
                  pcfBadgeColor: metafield(namespace: "pcf", key: "badge_color") { value }
                  pcfRecommended: metafield(namespace: "pcf", key: "recommended") { value }
                  pcfSpecs: metafield(namespace: "pcf", key: "specs") { value }
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

          const found = allProducts.find(
            (p: any) => p.id === val || p.variants.edges.some((v: any) => v.node.id === val)
          );

          if (found) {
            const varNode =
              found.variants.edges.find((v: any) => v.node.id === val)?.node || found.variants.edges[0].node;
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
    setHelpOpen(false);
  }, [stepIndex]);

  // --- FILTERING (unchanged business logic) ---
  const currentProducts = products
    .filter((p) => {
      const type = p.pcfType?.value;

      if (currentStep === "cpu") {
        return type === "cpu" && p.pcfBrand?.value === brand;
      }
      if (currentStep === "motherboard") {
        return type === "motherboard" && p.pcfSocket?.value === cpu?.pcfSocket?.value;
      }
      if (currentStep === "ram") {
        if (type !== "ram") return false;
        const socket = (mb?.pcfSocket?.value || cpu?.pcfSocket?.value || "").toLowerCase();
        let requiredRamType = "ddr5";
        if (socket === "am4") {
          requiredRamType = "ddr4";
        }
        const productRamType = (p.pcfRamType?.value || "").toLowerCase();
        if (productRamType && productRamType !== requiredRamType) {
          return false;
        }
        const pTags = p.tags || [];
        const lowerTags = pTags.map((t: string) => t.toLowerCase().trim());
        const titleLower = p.title.toLowerCase();

        const isXMP = lowerTags.includes("intel-xmp") || titleLower.includes("xmp");
        const isEXPO = lowerTags.includes("amd-expo") || titleLower.includes("expo");
        if (brand === "intel" && isEXPO && !isXMP) return false;
        if (brand === "amd" && isXMP && !isEXPO) return false;
        return true;
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
        const mbFormFactor = (mb?.pcfFormFactor?.value || "atx").toLowerCase();
        const supported = p.pcfSupportedFormFactors?.value?.split(",").map((s) => s.trim().toLowerCase()) || [];

        const mbFits = supported.length === 0 || supported.includes(mbFormFactor) || supported.includes("atx");

        const gpuLength1 = Number(gpu?.pcfGpuLength?.value || 0);
        const gpuLength2 = Number(gpu2?.pcfGpuLength?.value || 0);
        const maxGpuLength = Math.max(gpuLength1, gpuLength2);

        const caseMaxGpuLength = Number(p.pcfMaxGpuLength?.value || 9999);
        const caseAllowsGpu = maxGpuLength <= caseMaxGpuLength;

        return mbFits && caseAllowsGpu;
      }
      if (currentStep === "psu") {
        // Use the SAME figure shown on screen (estimatedDraw already includes +150 overhead),
        // so the filter never contradicts the "dovoljno snage" readout.
        const requiredWattage = calculateSystemTDP();
        return type === "psu" && Number(p.pcfWattage?.value || 9999) >= requiredWattage;
      }
      if (currentStep === "cooler") {
        if (type !== "cooler") return false;
        const sockets = p.pcfSocket?.value?.split(",").map((s) => s.trim().toLowerCase()) || [];
        if (!sockets.includes((cpu?.pcfSocket?.value || "").toLowerCase())) return false;

        // must physically fit inside the chosen case (skip if either value is missing)
        const coolerHeight = Number(p.pcfCoolerHeight?.value || 0);
        const caseMaxCoolerHeight = Number(pcCase?.pcfMaxCoolerHeight?.value || 0);
        if (coolerHeight > 0 && caseMaxCoolerHeight > 0 && coolerHeight > caseMaxCoolerHeight) {
          return false;
        }

        // AIO radiator must be one the case can mount (skip if either value is missing)
        const radSize = (p.pcfRadiatorSize?.value || "").trim();
        const caseRads = (pcCase?.pcfSupportedRadiators?.value || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (radSize && caseRads.length > 0 && !caseRads.includes(radSize)) {
          return false;
        }
        return true;
      }
      if (currentStep === "os") {
        return type === "os";
      }

      return false;
    })
    .sort((a, b) => {
      // recommended picks float to the front (shown first)
      const recA = (a.pcfRecommended?.value || "").toLowerCase() === "true" ? 1 : 0;
      const recB = (b.pcfRecommended?.value || "").toLowerCase() === "true" ? 1 : 0;
      if (recB !== recA) return recB - recA;

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

  const activePrice = Number(
    activeProduct?.variants.edges.find((v: any) => v.node.id === selectedVarId)?.node.price.amount ||
      activeProduct?.variants.edges[0]?.node.price.amount ||
      0
  );

  // which variant a given product card should reflect:
  // the actively-selected one for the centered product, otherwise its first variant
  const displayVariant = (p: ProductNode, isActiveProduct: boolean) => {
    const node =
      (isActiveProduct && p.variants.edges.find((v: any) => v.node.id === selectedVarId)?.node) ||
      p.variants.edges[0].node;
    return {
      price: Number(node.price.amount),
      img: node.image?.url || p.featuredImage?.url,
    };
  };

  // --- COVERFLOW GEOMETRY ---
  const SLIDE = isMobile ? 150 : 300;

  const getOffset = (index: number) => {
    const N = currentProducts.length;
    if (N === 0) return 0;
    let offset = (((index - activeIndex) % N) + N) % N;
    if (offset > Math.floor(N / 2)) offset -= N;
    return offset;
  };

  // 3D coverflow card transform (from the new design)
  const getCardStyle = (o: number, mobile: boolean) => {
    const a = Math.abs(o);
    const sign = o === 0 ? 0 : o < 0 ? -1 : 1;
    const bx = mobile ? 150 : 300;
    let tx: number, sc: number, rot: number, op: number, z: number;
    if (a <= 1) {
      tx = o * bx;
      sc = 1 - 0.16 * a;
      rot = -o * 28;
      op = 1 - 0.52 * a;
      z = 30 - Math.round(a * 8);
    } else if (a <= 2) {
      const f = a - 1;
      tx = sign * (bx + f * (mobile ? 80 : 175));
      sc = 0.84 - 0.14 * f;
      rot = -sign * (28 + 12 * f);
      op = 0.48 - 0.42 * f;
      z = Math.round(20 - 10 * f);
    } else {
      tx = sign * (bx + (mobile ? 80 : 175) + (a - 2) * 120);
      sc = 0.6;
      rot = -sign * 42;
      op = 0;
      z = 0;
    }
    return {
      transform: `translateX(${tx}px) scale(${sc}) rotateY(${rot}deg)`,
      opacity: Math.max(0, op),
      zIndex: Math.max(0, z),
      transition: isDragging
        ? "none"
        : "transform .55s cubic-bezier(.22,.61,.36,1), opacity .45s ease, box-shadow .3s ease",
    };
  };

  // --- INTERACTION & DRAG PHYSICS (robust on touch + mouse) ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // let the arrow buttons work normally
    if ((e.target as HTMLElement).closest("button")) return;
    // remember which card the press started on (for tap-to-select / tap-to-center)
    const cardEl = (e.target as HTMLElement).closest("[data-cardidx]") as HTMLElement | null;
    downIdxRef.current = cardEl ? Number(cardEl.dataset.cardidx) : null;
    movedRef.current = false;
    // capture immediately so the browser can never steal the gesture for scrolling (fixes mobile)
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
      capturedRef.current = true;
    } catch {}
    setStartX(e.clientX);
    setDragOffset(0);
    setIsDragging(false);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX === null) return;
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 4) {
      movedRef.current = true;
      setIsDragging(true);
      setDragOffset(diff);
    }
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (capturedRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      capturedRef.current = false;
    }
    if (startX === null) return;
    const N = currentProducts.length;
    if (movedRef.current) {
      // dragged: snap to whichever card you released on (can cross several)
      const steps = Math.round(dragOffset / SLIDE);
      if (N > 0) setActiveIndex((prev) => (((prev - steps) % N) + N) % N);
    } else {
      // tapped (no real movement): center card selects, side card comes to center
      const i = downIdxRef.current;
      if (i != null && currentProducts[i]) {
        if (i === activeIndex) handleSelection(currentStep, currentProducts[i]);
        else setActiveIndex(i);
      }
    }
    setDragOffset(0);
    setStartX(null);
    setIsDragging(false);
  };

  const handleSelection = (type: string, p: ProductNode) => {
    if (isDragging) return;

    const variantNode = p.variants.edges.find((v: any) => v.node.id === selectedVarId)?.node || p.variants.edges[0].node;
    const productWithVariant = { ...p, selectedVariant: variantNode };
    if (type === "cpu") {
      // If the new CPU uses a different socket than the currently selected board,
      // the platform changed (e.g. Intel↔AMD, or LGA1700↔LGA1851) — clear the parts
      // that depend on socket/platform so an incompatible combo can't survive.
      const newSocket = (p.pcfSocket?.value || "").toLowerCase();
      const curMbSocket = (mb?.pcfSocket?.value || "").toLowerCase();
      if (mb && curMbSocket && newSocket && curMbSocket !== newSocket) {
        setMb(null);
        setCooler(null);
        setRam(null);
      }
      setCpu(productWithVariant);
    } else if (type === "motherboard") setMb(productWithVariant);
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

    window.history.replaceState(null, "", window.location.pathname);
  };

  const shareBuild = () => {
    // Build the URL from the current configuration directly, so it always contains
    // the full build even if the address bar was cleaned (e.g. after clicking the
    // header "Konfigurator" link, which strips the query params).
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

    const url = `${window.location.origin}/konfigurator?${params.toString()}`;
    navigator.clipboard.writeText(url);
    // keep the address bar in sync too
    window.history.replaceState(null, "", `/konfigurator?${params.toString()}`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1800);
  };

  const currentTotal = () => {
    const parts = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os];
    const compPrice = parts.reduce((sum, p) => {
      return sum + Number(p?.selectedVariant?.price?.amount || p?.variants?.edges[0]?.node.price.amount || 0);
    }, 0);

    return isReviewStep ? compPrice + ASSEMBLY_FEE : compPrice;
  };

  const handleContactSubmit = async () => {
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setContactState("invalid");
      return;
    }
    setContactState("sending");
    setContactError("");

    // include the current build so the email has context about what they were looking at
    const parts = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os];
    const buildSummary = parts
      .filter(Boolean)
      .map((p) => p?.title)
      .join(", ");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contactForm,
          currentBuild: buildSummary || "(nije započeta konfiguracija)",
          buildTotal: currentTotal().toFixed(2),
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      if (res.ok) {
        setContactState("sent");
        setContactForm({ name: "", email: "", phone: "", budget: "", message: "" });
      } else {
        // surface the real reason (status + any message the route returned)
        let detail = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) detail += ` — ${body.error}`;
        } catch {
          /* response wasn't JSON (e.g. 404 HTML page = route not found) */
        }
        setContactError(detail);
        setContactState("error");
      }
    } catch (err: any) {
      setContactError(err?.message || "Network error (poslužitelj nedostupan)");
      setContactState("error");
    }
  };

  const handleCheckout = async () => {
    if (!buildComplete) return;

    // one clean custom line at the configurator's exact price (assembly already included).
    // variantIds is the source of truth the server uses to re-price this build —
    // the `price` we show here is only for the cart UI, never trusted by checkout.
    const chosenParts = [cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os].filter(
      (p): p is ProductNode => !!p
    );
    const summary = chosenParts
      .map((p) => {
        const varTitle =
          p.selectedVariant && p.selectedVariant.title !== "Default Title" ? ` (${p.selectedVariant.title})` : "";
        return `${p.title}${varTitle}`;
      })
      .join(", ");
    const variantIds = chosenParts.map((p) => p.selectedVariant?.id || p.variants.edges[0].node.id);

    addCustomBuild({ title: "Custom PC Konfiguracija", price: currentTotal(), summary, variantIds });
  };

  // A PC is only orderable when every required part is chosen.
  // HDD and OS are optional; gpu2/ssd2/hdd2 are upsells — none gate checkout.
  const requiredParts = [
    { label: "Procesor", item: cpu },
    { label: "Matična ploča", item: mb },
    { label: "Radna memorija", item: ram },
    { label: "Grafička kartica", item: gpu },
    { label: "Glavni SSD", item: ssd },
    { label: "Kućište", item: pcCase },
    { label: "Napajanje", item: psu },
    { label: "Hladnjak", item: cooler },
  ];
  const missingParts = requiredParts.filter((r) => !r.item).map((r) => r.label);
  // Safety net: CPU and motherboard sockets must match (belt-and-suspenders vs any
  // navigation path that could leave a stale, incompatible board selected).
  const socketMismatch = !!(
    cpu && mb &&
    (cpu.pcfSocket?.value || "").toLowerCase() !== (mb.pcfSocket?.value || "").toLowerCase()
  );
  const buildComplete = missingParts.length === 0 && !socketMismatch;

  // Step for each required part, in build order, with its current selection.
  const stepSelections: { step: Step; item: ProductNode | null }[] = [
    { step: "cpu", item: cpu },
    { step: "motherboard", item: mb },
    { step: "ram", item: ram },
    { step: "gpu", item: gpu },
    { step: "ssd", item: ssd },
    { step: "case", item: pcCase },
    { step: "psu", item: psu },
    { step: "cooler", item: cooler },
  ];
  // When leaving the review screen, drop the user on the first part they haven't picked yet
  // (not the last step). If everything is chosen, go back one step from review.
  const goEditConfig = () => {
    const firstMissing = stepSelections.find((s) => !s.item);
    if (firstMissing) setStepIndex(STEPS.indexOf(firstMissing.step));
    else setStepIndex(stepIndex - 1);
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
    { key: "os", label: "OPERATIVNI SUSTAV", item: os },
  ].filter((p) => p.item);

  // --- LOADING / ERROR STATES ---
  if (loading) {
    return (
      <div style={{ ...fullScreenMsg }}>
        <span style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "2px", color: COLORS.accent }}>
          UČITAVANJE KOMPONENTI…
        </span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={{ ...fullScreenMsg, flexDirection: "column", gap: "10px" }}>
        <h2 style={{ color: "#ff6a82", margin: 0, fontFamily: FONT }}>Problem sa spajanjem</h2>
        <p style={{ margin: 0, color: COLORS.textMuted, fontFamily: FONT }}>
          Aplikacija se trenutno ne može povezati sa serverom.
        </p>
        <p style={{ fontSize: "12px", color: COLORS.textFaint, fontFamily: MONO }}>({errorMessage})</p>
      </div>
    );
  }

  const containerStyle: CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    color: COLORS.textMain,
    padding: isMobile ? "22px 14px 56px" : "26px 22px 64px",
    overflowX: "hidden",
    fontFamily: FONT,
    background:
      "radial-gradient(1100px 560px at 72% -14%,rgba(216,31,216,.11),transparent 62%)," + COLORS.bgMain,
  };

  // --- STEP RAIL ---
  const renderRail = () => (
    <div
      style={{
        display: "flex",
        gap: "7px",
        overflowX: "auto",
        paddingBottom: "10px",
        marginBottom: "22px",
      }}
    >
      {STEPS.map((s, i) => {
        const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
        const clickable = i <= stepIndex;
        return (
          <div
            key={s}
            onClick={() => {
              if (clickable) setStepIndex(i);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
              padding: "8px 14px 8px 8px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              cursor: clickable ? "pointer" : "default",
              transition: "all .2s",
              background: state === "active" ? "rgba(216,31,216,.13)" : "transparent",
              border: state === "active" ? "1px solid rgba(216,31,216,.5)" : `1px solid ${COLORS.border}`,
              color: state === "active" ? "#fff" : state === "done" ? "#9499ac" : "#4a4f63",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                fontFamily: MONO,
                fontSize: "10px",
                fontWeight: 600,
                background: state === "active" ? COLORS.accent : "rgba(255,255,255,.06)",
                color: state === "active" ? "#fff" : state === "done" ? "#9499ac" : "#4a4f63",
              }}
            >
              {state === "done" ? "✓" : String(i + 1).padStart(2, "0")}
            </span>
            <span>{RAIL_LABELS[s]}</span>
          </div>
        );
      })}
    </div>
  );

  // image placeholder block — pass an explicit src (variant image or product image)
  const ImageBlock = ({ src, h }: { src?: string; h: string }) =>
    src ? (
      <img
        draggable="false"
        src={src}
        alt=""
        style={{ width: "100%", height: h, objectFit: "contain", pointerEvents: "none" }}
      />
    ) : (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: h,
          borderRadius: "13px",
          overflow: "hidden",
          background: "linear-gradient(160deg,#1b2030,#0b0d14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 1px,transparent 1px 13px)",
          }}
        />
        <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: "22px", color: "#cfd3e0", position: "relative" }}>
          {STEP_GLYPH[currentStep] || "PC"}
        </span>
      </div>
    );

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: "1340px", margin: "0 auto" }}>
        {/* === STEP RAIL === */}
        {renderRail()}

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "24px" : "24px",
            alignItems: "flex-start",
          }}
        >
          {/* === LEFT MAIN AREA === */}
          <div style={{ flex: "1 1 580px", minWidth: 0, width: "100%" }}>
            {/* Nav row */}
            {stepIndex > 0 && !isReviewStep && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setStepIndex(stepIndex - 1)} style={navBtnStyle}>
                    ← Nazad
                  </button>
                  <button onClick={resetBuild} style={navBtnDangerStyle}>
                    Ispočetka
                  </button>
                </div>
                {["hdd", "os"].includes(currentStep) && (
                  <button onClick={handleSkip} style={{ ...navBtnStyle, color: COLORS.textMuted }}>
                    Preskoči ⏭
                  </button>
                )}
              </div>
            )}

            {/* --- STEP 0: BRAND --- */}
            {isBrandStep && (
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <div style={kickerStyle}>KORAK 01 — PLATFORMA</div>
                  <h2 style={h2Style}>Odaberi platformu</h2>
                  <div style={{ color: COLORS.textMuted, fontSize: "14px", marginTop: "7px" }}>
                    Procesorska arhitektura određuje kompatibilne komponente
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: "16px",
                  }}
                >
                  <button
                    onClick={() => { setBrand("intel"); setStepIndex(1); }}
                    onMouseEnter={() => setHoverBrand("intel")}
                    onMouseLeave={() => setHoverBrand(null)}
                    style={{
                      ...brandBtnStyle, position: "relative", overflow: "hidden", padding: "0", minHeight: "230px", gap: "0",
                      alignItems: "center", justifyContent: "center",
                      border: hoverBrand === "intel" ? "1px solid #0099ff" : `1px solid ${COLORS.border}`,
                      borderTop: "3px solid #0099ff",
                      transform: hoverBrand === "intel" ? "translateY(-6px)" : "none",
                      boxShadow: hoverBrand === "intel" ? "0 26px 60px -26px rgba(0,153,255,.6)" : "none",
                    }}
                  >
                    <div style={{ position: "absolute", top: "-70px", left: "50%", transform: "translateX(-50%)", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,153,255,.24), transparent 68%)", pointerEvents: "none", transition: "opacity .2s", opacity: hoverBrand === "intel" ? 1 : 0.7 }} />
                    <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", width: "100%", height: "100%", padding: "32px 24px" }}>
                      <img
                        src="/intel.svg"
                        alt="Intel"
                        style={{ maxHeight: "64px", maxWidth: "170px", objectFit: "contain" }}
                        onError={(e) => { const t = e.currentTarget; t.style.display = "none"; const f = t.nextElementSibling as HTMLElement; if (f) f.style.display = "inline"; }}
                      />
                      <span style={{ display: "none", fontSize: "40px", fontWeight: 700, letterSpacing: "-.5px", color: "#3da5ff" }}>intel</span>
                      <span style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "1.5px", color: COLORS.textMuted }}>CORE &amp; CORE ULTRA</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { setBrand("amd"); setStepIndex(1); }}
                    onMouseEnter={() => setHoverBrand("amd")}
                    onMouseLeave={() => setHoverBrand(null)}
                    style={{
                      ...brandBtnStyle, position: "relative", overflow: "hidden", padding: "0", minHeight: "230px", gap: "0",
                      alignItems: "center", justifyContent: "center",
                      border: hoverBrand === "amd" ? "1px solid #ff5e00" : `1px solid ${COLORS.border}`,
                      borderTop: "3px solid #ff5e00",
                      transform: hoverBrand === "amd" ? "translateY(-6px)" : "none",
                      boxShadow: hoverBrand === "amd" ? "0 26px 60px -26px rgba(255,94,0,.55)" : "none",
                    }}
                  >
                    <div style={{ position: "absolute", top: "-70px", left: "50%", transform: "translateX(-50%)", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,94,0,.22), transparent 68%)", pointerEvents: "none", transition: "opacity .2s", opacity: hoverBrand === "amd" ? 1 : 0.7 }} />
                    <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", width: "100%", height: "100%", padding: "32px 24px" }}>
                      <img
                        src="/amd.svg"
                        alt="AMD"
                        style={{ maxHeight: "56px", maxWidth: "170px", objectFit: "contain" }}
                        onError={(e) => { const t = e.currentTarget; t.style.display = "none"; const f = t.nextElementSibling as HTMLElement; if (f) f.style.display = "inline"; }}
                      />
                      <span style={{ display: "none", fontSize: "40px", fontWeight: 800, color: "#ff7a33" }}>AMD</span>
                      <span style={{ fontFamily: MONO, fontSize: "12px", letterSpacing: "1.5px", color: COLORS.textMuted }}>RYZEN</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* --- MIDDLE STEPS --- */}
            {stepIndex > 0 && !isReviewStep && (
              currentProducts.length > 0 ? (
                <div>
                  {/* Heading + view toggle */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: "16px",
                      marginBottom: "24px",
                    }}
                  >
                    <div>
                      <div style={kickerStyle}>
                        KORAK {String(stepIndex + 1).padStart(2, "0")} — ODABIR
                      </div>
                      <h2 style={h2Style}>{STEP_LABELS[currentStep]}</h2>
                      <div style={{ color: COLORS.textMuted, fontSize: "14px", marginTop: "7px" }}>
                        {currentProducts.length} kompatibilnih modela za tvoju konfiguraciju
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        background: COLORS.bgCard,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "13px",
                        padding: "4px",
                      }}
                    >
                      <button
                        onClick={() => setViewMode("coverflow")}
                        title="Listanje"
                        aria-label="Listanje"
                        style={{
                          ...segBtnStyle(viewMode === "coverflow"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "9px 11px",
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="8" y="5" width="8" height="14" rx="1.5" />
                          <path d="M5 8v8M19 8v8" opacity="0.55" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setViewMode("grid")}
                        title="Sve odjednom"
                        aria-label="Sve odjednom"
                        style={{
                          ...segBtnStyle(viewMode === "grid"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "9px 11px",
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="4" width="7" height="7" rx="1.5" />
                          <rect x="13" y="4" width="7" height="7" rx="1.5" />
                          <rect x="4" y="13" width="7" height="7" rx="1.5" />
                          <rect x="13" y="13" width="7" height="7" rx="1.5" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {currentStep === "os" && (
                    <div
                      style={{
                        marginBottom: "22px",
                        padding: "14px 16px",
                        background: "rgba(216,31,216,.06)",
                        border: "1px solid rgba(216,31,216,.22)",
                        borderRadius: "12px",
                        fontSize: "13px",
                        lineHeight: 1.6,
                        color: COLORS.textMuted,
                      }}
                    >
                      <strong style={{ color: COLORS.textMain }}>Napomena:</strong> svako računalo isporučujemo s
                      instaliranim i testiranim sustavom Windows. „Bez operativnog sustava&#8221; znači da Windows
                      instaliramo radi provjere i testiranja, ali <strong style={{ color: COLORS.textMain }}>bez aktivirane
                      licence</strong> — aktivirate ga vlastitim ključem. Računalo nikada ne šaljemo neprovjereno.
                    </div>
                  )}

                  {/* COVERFLOW */}
                  {viewMode === "coverflow" && (
                    <div
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      onDragStart={(e) => e.preventDefault()}
                      style={{
                        position: "relative",
                        height: isMobile ? "320px" : "440px",
                        perspective: "1700px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        touchAction: "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        WebkitTouchCallout: "none",
                        cursor: isDragging ? "grabbing" : "grab",
                        marginBottom: "4px",
                      } as CSSProperties}
                    >
                      <button
                        onClick={() => setActiveIndex((activeIndex - 1 + currentProducts.length) % currentProducts.length)}
                        style={{ ...arrowStyle, left: "2px" }}
                      >
                        ‹
                      </button>

                      {currentProducts.map((p, idx) => {
                        const baseOffset = getOffset(idx);
                        const exactOffset = baseOffset + dragOffset / SLIDE;
                        const cs = getCardStyle(exactOffset, isMobile);
                        const isActive = Math.abs(exactOffset) < 0.5;
                        // keep cards near both the resting and the dragged-to center mounted,
                        // so the settle animation always has neighbors to ease in
                        const nearest = Math.min(Math.abs(baseOffset), Math.abs(exactOffset));
                        if (nearest > 3.2) return <div key={p.id} style={{ display: "none" }} />;

                        const badgeStyle = p.pcfBadge?.value ? getBadgeStyle(p.pcfBadge.value, p.pcfBadgeColor?.value) : null;
                        const dv = displayVariant(p, idx === activeIndex);
                        const cardW = isMobile ? 196 : 284;
                        const cardH = isMobile ? 256 : 360;

                        return (
                          <div
                            key={p.id}
                            data-cardidx={idx}
                            onMouseEnter={() => setHoverCard(idx)}
                            onMouseLeave={() => setHoverCard((c) => (c === idx ? null : c))}
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "50%",
                              width: cardW + "px",
                              height: cardH + "px",
                              borderRadius: "18px",
                              padding: isMobile ? "14px" : "18px",
                              background: "linear-gradient(165deg,#171b27,#0d0f17)",
                              border: isActive ? "1px solid rgba(216,31,216,.7)" : hoverCard === idx ? "1px solid rgba(216,31,216,.4)" : `1px solid ${COLORS.border}`,
                              boxShadow: isActive
                                ? "0 0 0 1px rgba(216,31,216,.55), 0 30px 70px -22px rgba(216,31,216,.5)"
                                : "0 22px 44px -22px rgba(0,0,0,.85)",
                              display: "flex",
                              flexDirection: "column",
                              cursor: "pointer",
                              userSelect: "none",
                              transformOrigin: "center center",
                              willChange: "transform",
                              transform: `translate(-50%,-50%) ${cs.transform}${hoverCard === idx && !isDragging ? " translateY(-7px)" : ""}`,
                              opacity: cs.opacity,
                              zIndex: cs.zIndex,
                              transition: cs.transition,
                            }}
                          >
                            {(p.pcfRecommended?.value || "").toLowerCase() === "true" && (
                              <span title="Naša preporuka" style={{ position: "absolute", top: "10px", right: "10px", zIndex: 5, width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg,#ffd36b,#ffb84d)", color: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", boxShadow: "0 4px 12px rgba(255,184,77,.5)" }}>★</span>
                            )}
                            {p.pcfBadge?.value && badgeStyle && (
                              <span
                                style={{
                                  ...badgeBase,
                                  background: badgeStyle.bg,
                                  color: badgeStyle.color,
                                  boxShadow: "0 4px 14px " + badgeStyle.glow,
                                }}
                              >
                                {p.pcfBadge.value}
                              </span>
                            )}
                            <div style={{ width: "100%", height: "54%" }}>
                              <ImageBlock src={dv.img} h="100%" />
                            </div>
                            <div style={{ marginTop: "auto", paddingTop: "13px", pointerEvents: "none" }}>
                              <div style={{ fontWeight: 600, fontSize: "16px", lineHeight: 1.25 }}>{p.title}</div>
                              <div style={{ fontWeight: 700, fontSize: "22px", color: "#fff", marginTop: "10px", letterSpacing: "-.3px" }}>
                                €{dv.price.toFixed(2)}
                              </div>
                            </div>
                            {isActive && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: "-26px",
                                  left: 0,
                                  width: "100%",
                                  textAlign: "center",
                                  fontFamily: MONO,
                                  fontSize: "11px",
                                  letterSpacing: "1px",
                                  color: COLORS.accent,
                                  pointerEvents: "none",
                                }}
                              >
                                KLIKNI ZA ODABIR
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button
                        onClick={() => setActiveIndex((activeIndex + 1) % currentProducts.length)}
                        style={{ ...arrowStyle, right: "2px" }}
                      >
                        ›
                      </button>
                    </div>
                  )}

                  {/* GRID */}
                  {viewMode === "grid" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill,minmax(198px,1fr))",
                        gap: "14px",
                        marginBottom: "4px",
                      }}
                    >
                      {currentProducts.map((p, idx) => {
                        const selected = idx === activeIndex;
                        const badgeStyle = p.pcfBadge?.value ? getBadgeStyle(p.pcfBadge.value, p.pcfBadgeColor?.value) : null;
                        const dv = displayVariant(p, selected);
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (selected) handleSelection(currentStep, p);
                              else setActiveIndex(idx);
                            }}
                            onMouseEnter={() => setHoverCard(idx)}
                            onMouseLeave={() => setHoverCard((c) => (c === idx ? null : c))}
                            style={{
                              position: "relative",
                              background: COLORS.bgCard,
                              borderRadius: "16px",
                              padding: "15px",
                              cursor: "pointer",
                              transition: "all .18s",
                              transform: hoverCard === idx && !selected ? "translateY(-5px)" : "none",
                              border: selected ? "1px solid rgba(216,31,216,.7)" : hoverCard === idx ? "1px solid rgba(216,31,216,.4)" : `1px solid ${COLORS.border}`,
                              boxShadow: selected
                                ? "0 0 0 1px rgba(216,31,216,.5), 0 20px 44px -24px rgba(216,31,216,.5)"
                                : hoverCard === idx
                                ? "0 18px 38px -22px rgba(0,0,0,.8)"
                                : "none",
                            }}
                          >
                            {(p.pcfRecommended?.value || "").toLowerCase() === "true" && (
                              <span title="Naša preporuka" style={{ position: "absolute", top: "10px", right: "10px", zIndex: 5, width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg,#ffd36b,#ffb84d)", color: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", boxShadow: "0 4px 12px rgba(255,184,77,.5)" }}>★</span>
                            )}
                            <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", marginBottom: "14px" }}>
                              <ImageBlock src={dv.img} h="100%" />
                              {p.pcfBadge?.value && badgeStyle && (
                                <span
                                  style={{
                                    ...badgeBase,
                                    background: badgeStyle.bg,
                                    color: badgeStyle.color,
                                    boxShadow: "0 4px 14px " + badgeStyle.glow,
                                  }}
                                >
                                  {p.pcfBadge.value}
                                </span>
                              )}
                              {selected && (
                                <span
                                  style={{
                                    position: "absolute",
                                    bottom: "10px",
                                    right: "10px",
                                    fontFamily: MONO,
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    letterSpacing: ".5px",
                                    color: "#fff",
                                    background: COLORS.accent,
                                    padding: "3px 7px",
                                    borderRadius: "6px",
                                  }}
                                >
                                  ✓ ODABRANO
                                </span>
                              )}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: "14px", lineHeight: 1.25 }}>{p.title}</div>
                            <div style={{ fontWeight: 700, fontSize: "18px", marginTop: "10px", letterSpacing: "-.3px" }}>
                              €{dv.price.toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CONFIRM BAR */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      marginTop: "22px",
                      padding: "18px 22px",
                      background: COLORS.bgCard,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "16px",
                    }}
                  >
                    {/* selected + tier + recommended */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: MONO, fontSize: "10px", color: COLORS.textMuted, letterSpacing: "2px" }}>
                          ODABRANO
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", position: "relative" }}>
                          <span style={{ fontWeight: 600, fontSize: "17px" }}>{activeProduct?.title}</span>
                          {activeProduct?.pcfSpecs?.value && (
                            <span
                              style={{ position: "relative", display: "inline-flex" }}
                              onMouseEnter={() => setSpecsOpen(true)}
                              onMouseLeave={() => setSpecsOpen(false)}
                            >
                              <button
                                onClick={() => setSpecsOpen((o) => !o)}
                                aria-label="Specifikacije"
                                style={{ width: "18px", height: "18px", borderRadius: "50%", border: `1px solid ${COLORS.accent}`, background: "none", color: COLORS.accent, fontSize: "11px", fontFamily: MONO, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }}
                              >
                                i
                              </button>
                              {specsOpen && (
                                <div style={{ position: "absolute", top: "26px", left: "0", zIndex: 20, width: "260px", background: COLORS.bgDark, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "13px 15px", boxShadow: "0 20px 50px -18px rgba(0,0,0,.9)" }}>
                                  <div style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "1.5px", color: COLORS.accent, marginBottom: "9px" }}>SPECIFIKACIJE</div>
                                  {activeProduct.pcfSpecs.value.split("\n").map((line) => line.trim()).filter(Boolean).map((line, i) => {
                                    const ix = line.indexOf(":");
                                    const lbl = ix === -1 ? "" : line.slice(0, ix).trim();
                                    const val = ix === -1 ? line : line.slice(ix + 1).trim();
                                    return (
                                      <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12.5px", padding: "4px 0", borderBottom: i < activeProduct.pcfSpecs!.value.split("\n").filter((l) => l.trim()).length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                                        {lbl && <span style={{ color: COLORS.textMuted }}>{lbl}</span>}
                                        <span style={{ color: COLORS.textMain, fontWeight: 500, textAlign: "right" }}>{val}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "9px", flexWrap: "wrap" }}>
                          {currentStep !== "case" && currentStep !== "os" && (() => {
                            const q = getQualityScore(activeProduct?.pcfQuality?.value);
                            const label = ["—", "Osnovna", "Dobra", "Vrlo dobra", "Vrhunska", "Elitna"][q] || "—";
                            return (
                              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                <div style={{ display: "flex", gap: "3px" }}>
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <span key={i} style={{ width: "16px", height: "5px", borderRadius: "3px", background: i <= q ? COLORS.accent : "rgba(255,255,255,.14)" }} />
                                  ))}
                                </div>
                                <span style={{ fontFamily: MONO, fontSize: "11px", color: COLORS.textMuted, letterSpacing: ".5px" }}>Razina: {label}</span>
                              </div>
                            );
                          })()}
                          {currentStep === "case" && (
                            <span style={{ fontFamily: MONO, fontSize: "11px", color: COLORS.textMuted, letterSpacing: ".5px" }}>Stvar osobnog ukusa — sva su kvalitetna</span>
                          )}
                          {(activeProduct?.pcfRecommended?.value || "").toLowerCase() === "true" && (
                            <span style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "1px", color: "#0a0a0a", background: "linear-gradient(90deg,#ffd36b,#ffb84d)", padding: "4px 9px", borderRadius: "20px" }}>
                              ★ NAŠA PREPORUKA
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "24px", letterSpacing: "-.5px" }}>
                        €{activePrice.toFixed(2)}
                      </div>
                    </div>

                    {/* variant selector (moved above the button, clearer) */}
                    {activeProduct && activeProduct.variants.edges.length > 1 && (
                      <div style={{ paddingTop: "14px", borderTop: `1px solid ${COLORS.border}` }}>
                        <div style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "1.5px", color: COLORS.accent, marginBottom: "8px" }}>
                          ODABERITE VARIJANTU ↓
                        </div>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                          {activeProduct.variants.edges.map((v: any) => {
                            const on = v.node.id === selectedVarId;
                            return (
                              <button
                                key={v.node.id}
                                onClick={() => setSelectedVarId(v.node.id)}
                                style={{
                                  padding: "9px 15px",
                                  borderRadius: "10px",
                                  cursor: "pointer",
                                  fontFamily: FONT,
                                  fontWeight: 600,
                                  fontSize: "13px",
                                  transition: "all .15s",
                                  background: on ? "rgba(216,31,216,.14)" : COLORS.bgDark,
                                  border: on ? "1px solid rgba(216,31,216,.7)" : `1px solid ${COLORS.border}`,
                                  color: on ? "#fff" : COLORS.textMuted,
                                }}
                              >
                                {v.node.title !== "Default Title" ? v.node.title : "Standard"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* help — ALWAYS visible, above the button */}
                    {STEP_HELP[currentStep] && (
                      <div style={{ width: "100%" }}>
                        <button
                          onClick={() => setHelpOpen((o) => !o)}
                          style={{ background: "none", border: "none", padding: "4px 0", cursor: "pointer", fontFamily: FONT, fontSize: "13px", fontWeight: 600, color: COLORS.accent, display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "16px", height: "16px", borderRadius: "50%", border: `1px solid ${COLORS.accent}`, fontSize: "10px", fontFamily: MONO }}>?</span>
                          {helpOpen ? "Sakrij pomoć" : "Niste sigurni što odabrati?"}
                        </button>
                        {helpOpen && (
                          <div style={{ marginTop: "8px", padding: "13px 15px", background: COLORS.bgDark, border: `1px solid ${COLORS.border}`, borderRadius: "11px", fontSize: "13px", lineHeight: 1.6, color: COLORS.textMuted }}>
                            {STEP_HELP[currentStep]}
                          </div>
                        )}
                      </div>
                    )}

                    {/* select button — full width, at the bottom */}
                    <button
                      onClick={() => activeProduct && handleSelection(currentStep, activeProduct)}
                      style={{ ...primaryBtnStyle, width: "100%", justifyContent: "center", fontSize: "16px", padding: "15px" }}
                    >
                      Odaberi i nastavi →
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "60px 24px",
                    textAlign: "center",
                    background: COLORS.bgCard,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "16px",
                  }}
                >
                  <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
                    Nema kompatibilnih komponenti
                  </div>
                  <div style={{ color: COLORS.textMuted, fontSize: "14px", marginBottom: "20px" }}>
                    Za ovaj korak nema dijelova koji odgovaraju prethodnom odabiru.
                  </div>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                    <button onClick={() => setStepIndex(stepIndex - 1)} style={navBtnStyle}>
                      ← Nazad
                    </button>
                    {["hdd", "os"].includes(currentStep) && (
                      <button onClick={handleSkip} style={navBtnStyle}>
                        Preskoči ⏭
                      </button>
                    )}
                  </div>
                </div>
              )
            )}

            {/* --- REVIEW STEP --- */}
            {isReviewStep && (
              <div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
                  <button onClick={goEditConfig} style={navBtnStyle}>
                    ← Uredi konfiguraciju
                  </button>
                  <button onClick={resetBuild} style={navBtnDangerStyle}>
                    Kreni ispočetka
                  </button>
                </div>

                <div style={{ marginBottom: "26px" }}>
                  <div style={kickerStyle}>FINALNI PREGLED</div>
                  <h2 style={h2Style}>Pregled konfiguracije</h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                  {selectedPartsList.map((part) => (
                    <div
                      key={part.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "18px",
                        background: COLORS.bgCard,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "14px",
                        padding: "16px 20px",
                      }}
                    >
                      <div
                        style={{
                          width: "54px",
                          height: "54px",
                          flexShrink: 0,
                          borderRadius: "10px",
                          background: COLORS.bgDark,
                          border: `1px solid ${COLORS.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "5px",
                          overflow: "hidden",
                        }}
                      >
                        {part.item?.featuredImage?.url ? (
                          <img
                            src={part.item.featuredImage.url}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        ) : (
                          <span style={{ fontFamily: MONO, fontSize: "11px", color: COLORS.textFaint }}>
                            {STEP_GLYPH[part.key] || "PC"}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: MONO, fontSize: "9.5px", color: COLORS.textFaint, letterSpacing: "1.5px", marginBottom: "5px" }}>
                          {part.label}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: "15px" }}>
                          {part.item?.title}{" "}
                          {part.item?.selectedVariant && part.item?.selectedVariant.title !== "Default Title"
                            ? `(${part.item?.selectedVariant.title})`
                            : ""}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-.3px" }}>
                        €
                        {Number(
                          part.item?.selectedVariant?.price?.amount ||
                            part.item?.variants.edges[0].node.price.amount
                        ).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upsells */}
                <div style={{ marginTop: "28px" }}>
                  <div style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "2px", color: COLORS.textMuted, marginBottom: "14px" }}>
                    DODATNE KOMPONENTE
                  </div>
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
                        {products
                          .filter((p) => p.pcfType?.value === "gpu")
                          .map((p) => (
                            <div key={p.id}>
                              {p.variants.edges.map((v) => (
                                <button
                                  key={v.node.id}
                                  style={dropdownItemStyle}
                                  onClick={() => {
                                    setGpu2({ ...p, selectedVariant: v.node });
                                    setAddingExtra(null);
                                  }}
                                >
                                  <span>
                                    {p.title} {v.node.title !== "Default Title" ? `(${v.node.title})` : ""}
                                  </span>
                                  <span style={{ color: COLORS.accent, fontWeight: "bold" }}>€{v.node.price.amount}</span>
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
                        {products
                          .filter((p) => p.pcfType?.value === "ssd")
                          .map((p) => (
                            <div key={p.id}>
                              {p.variants.edges.map((v) => (
                                <button
                                  key={v.node.id}
                                  style={dropdownItemStyle}
                                  onClick={() => {
                                    setSsd2({ ...p, selectedVariant: v.node });
                                    setAddingExtra(null);
                                  }}
                                >
                                  <span>
                                    {p.title} {v.node.title !== "Default Title" ? `(${v.node.title})` : ""}
                                  </span>
                                  <span style={{ color: COLORS.accent, fontWeight: "bold" }}>€{v.node.price.amount}</span>
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
                        {products
                          .filter((p) => p.pcfType?.value === "hdd")
                          .map((p) => (
                            <div key={p.id}>
                              {p.variants.edges.map((v) => (
                                <button
                                  key={v.node.id}
                                  style={dropdownItemStyle}
                                  onClick={() => {
                                    setHdd2({ ...p, selectedVariant: v.node });
                                    setAddingExtra(null);
                                  }}
                                >
                                  <span>
                                    {p.title} {v.node.title !== "Default Title" ? `(${v.node.title})` : ""}
                                  </span>
                                  <span style={{ color: COLORS.accent, fontWeight: "bold" }}>€{v.node.price.amount}</span>
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
          <div
            style={{
              flex: "1 1 320px",
              maxWidth: isMobile ? "100%" : "362px",
              width: "100%",
              minWidth: 0,
              position: isMobile ? "relative" : "sticky",
              top: "18px",
            }}
          >
            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "18px", padding: "26px" }}>
              <div style={{ fontFamily: MONO, fontSize: "11px", color: COLORS.textMuted, letterSpacing: "2px" }}>
                UKUPNA CIJENA
              </div>
              <div style={{ fontSize: "42px", fontWeight: 700, letterSpacing: "-1.5px", marginTop: "6px" }}>
                €{currentTotal().toFixed(2)}
              </div>

              <div style={{ height: "1px", background: COLORS.border, margin: "22px 0" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {selectedPartsList.map((part) => (
                  <MiniSidebarRow key={part.key} label={part.label} keyName={part.key} item={part.item} />
                ))}
                {selectedPartsList.length === 0 && (
                  <div style={{ fontSize: "13px", color: COLORS.textFaint }}>
                    Još nema odabranih komponenti.
                  </div>
                )}
              </div>

              {bottleneckWarning && <div style={warningStyle}>{bottleneckWarning}</div>}

              {/* Power */}
              <div style={{ marginTop: "24px", paddingTop: "22px", borderTop: `1px solid ${COLORS.border}` }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontFamily: MONO,
                    fontSize: "11px",
                    color: COLORS.textMuted,
                    letterSpacing: "1px",
                    marginBottom: "10px",
                  }}
                >
                  <span>POTROŠNJA</span>
                  <span style={{ color: psuOver ? "#ff4d6d" : COLORS.textMain }}>
                    {estimatedDraw}W / {psuCapacity || "---"}W
                  </span>
                </div>
                <div style={{ width: "100%", height: "7px", background: COLORS.bgDark, borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${powerPercentage}%`,
                      height: "100%",
                      borderRadius: "4px",
                      background: psuOver
                        ? "linear-gradient(90deg,#ff6a3d,#ff4d6d)"
                        : "linear-gradient(90deg,#a020f0,#d81fd8)",
                      transition: "width .45s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "11px", color: COLORS.textFaint, marginTop: "9px" }}>{powerNote}</div>
              </div>

              {isReviewStep ? (
                <>
                  <button
                    disabled={!buildComplete}
                    onClick={handleCheckout}
                    style={{
                      ...checkoutBtnStyle,
                      ...(buildComplete
                        ? {}
                        : {
                            background: "rgba(255,255,255,.06)",
                            color: COLORS.textFaint,
                            boxShadow: "none",
                            cursor: "not-allowed",
                          }),
                    }}
                  >
                    🛒 Dodaj u košaricu
                  </button>
                  {!buildComplete && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "11px 13px",
                        background: "rgba(255,184,77,.08)",
                        border: "1px solid rgba(255,184,77,.25)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        color: "#ffb84d",
                        lineHeight: 1.5,
                      }}
                    >
                      {socketMismatch ? (
                        <>Procesor i matična ploča nisu kompatibilni (različit socket). Vratite se na korak <b>Matična ploča</b> i odaberite kompatibilnu.</>
                      ) : (
                        <>Da biste naručili, konfiguracija mora biti potpuna. Nedostaje:{" "}
                        <b>{missingParts.join(", ")}</b>.</>
                      )}
                    </div>
                  )}
                  <button onClick={shareBuild} style={ghostBtnStyle}>
                    {shareCopied ? "✓ Link kopiran" : "🔗 Podijeli konfiguraciju"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setStepIndex(STEPS.indexOf("review"))}
                  style={checkoutBtnStyle}
                >
                  Pregled konfiguracije →
                </button>
              )}

              <div
                style={{
                  marginTop: "22px",
                  textAlign: "center",
                  fontSize: "12.5px",
                  color: COLORS.textMuted,
                  lineHeight: 1.6,
                  padding: "16px",
                  background: "rgba(255,255,255,.02)",
                  borderRadius: "11px",
                }}
              >
                <div style={{ fontWeight: 700, color: COLORS.textMain, fontSize: "14px", marginBottom: "4px" }}>
                  Trebate nešto izvan ovih komponenti?
                </div>
                Custom vodeno hlađenje, radne stanice, server, tihi build, poseban dizajn ili savjet pri odabiru —
                recite nam svoju ideju i sastavit ćemo je baš po vašoj mjeri.
                <br />
                <button
                  onClick={() => {
                    setContactState("idle");
                    setContactOpen(true);
                  }}
                  style={{
                    color: COLORS.accent,
                    fontWeight: 700,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONT,
                    fontSize: "13px",
                    marginTop: "8px",
                    padding: 0,
                  }}
                >
                  Kontaktirajte nas →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === CONTACT FORM MODAL === */}
      {contactOpen && (
        <div
          onClick={() => setContactOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(2,3,6,.72)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: isMobile ? "16px" : "48px 16px",
            overflowY: "auto",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "18px",
              padding: isMobile ? "22px" : "30px",
              boxShadow: "0 30px 80px -20px rgba(0,0,0,.8)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "6px" }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "2.5px", color: COLORS.accent, marginBottom: "8px" }}>
                  UPIT ZA PRILAGODBU
                </div>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700, letterSpacing: "-.5px" }}>Recite nam svoju ideju</h2>
              </div>
              <button
                onClick={() => setContactOpen(false)}
                style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: "24px", cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>

            {contactState === "sent" ? (
              <div style={{ padding: "26px 6px", textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>✓</div>
                <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>Poruka poslana!</div>
                <div style={{ color: COLORS.textMuted, fontSize: "14px", lineHeight: 1.6 }}>
                  Javit ćemo vam se na e-mail u najkraćem mogućem roku.
                </div>
                <button onClick={() => setContactOpen(false)} style={{ ...primaryBtnStyle, marginTop: "20px" }}>
                  U redu
                </button>
              </div>
            ) : (
              <>
                <p style={{ color: COLORS.textMuted, fontSize: "13.5px", lineHeight: 1.6, marginTop: "10px", marginBottom: "20px" }}>
                  Opišite što trebate — namjenu, željeni proračun, posebne želje (vodeno hlađenje, tišina, boje, radna
                  stanica…). Ako ste već nešto složili u konfiguratoru, automatski to šaljemo uz poruku.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <input
                      style={{ ...contactInput, flex: "1 1 180px" }}
                      placeholder="Ime i prezime *"
                      value={contactForm.name}
                      onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    <input
                      style={{ ...contactInput, flex: "1 1 180px" }}
                      type="email"
                      placeholder="E-mail *"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <input
                      style={{ ...contactInput, flex: "1 1 180px" }}
                      placeholder="Telefon (nije obavezno)"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                    <input
                      style={{ ...contactInput, flex: "1 1 180px" }}
                      placeholder="Okvirni proračun €"
                      value={contactForm.budget}
                      onChange={(e) => setContactForm((f) => ({ ...f, budget: e.target.value }))}
                    />
                  </div>
                  <textarea
                    style={{ ...contactInput, minHeight: "120px", resize: "vertical" }}
                    placeholder="Vaše potrebe i želje *"
                    value={contactForm.message}
                    onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                  />
                </div>

                {contactState === "invalid" && (
                  <div style={{ marginTop: "12px", color: "#ff6a82", fontSize: "13px" }}>
                    Molimo ispunite ime, e-mail i poruku.
                  </div>
                )}
                {contactState === "error" && (
                  <div style={{ marginTop: "12px", color: "#ff6a82", fontSize: "13px", lineHeight: 1.5 }}>
                    Slanje nije uspjelo — pokušajte ponovno kasnije ili nam pišite izravno na info@racunalo.hr.
                    {contactError && (
                      <span style={{ display: "block", marginTop: "4px", color: COLORS.textFaint, fontSize: "11px", fontFamily: MONO }}>
                        ({contactError})
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={handleContactSubmit}
                  disabled={contactState === "sending"}
                  style={{ ...checkoutBtnStyle, marginTop: "18px", opacity: contactState === "sending" ? 0.7 : 1 }}
                >
                  {contactState === "sending" ? "Šaljem…" : "Pošalji upit"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---
function MiniSidebarRow({ label, item, keyName }: { label: string; item: ProductNode | null; keyName: string }) {
  if (!item) return null;
  const price = item.selectedVariant?.price?.amount || item.variants?.edges?.[0]?.node?.price?.amount || "0.00";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
      <div
        style={{
          width: "38px",
          height: "38px",
          flexShrink: 0,
          borderRadius: "8px",
          background: COLORS.bgDark,
          border: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
          overflow: "hidden",
        }}
      >
        {item.featuredImage?.url ? (
          <img src={item.featuredImage.url} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontFamily: MONO, fontSize: "9px", color: COLORS.textFaint }}>
            {STEP_GLYPH[keyName] || "PC"}
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: "9px", color: COLORS.textFaint, letterSpacing: ".5px" }}>{label}</div>
        <div
          style={{
            fontSize: "12.5px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginTop: "2px",
          }}
        >
          {item.title}
        </div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: "12px", color: COLORS.textMuted }}>€{price}</div>
    </div>
  );
}

function UpsellRow({
  label,
  item,
  onAdd,
  onRemove,
  isAdding,
}: {
  label: string;
  item: ProductNode | null;
  onAdd: () => void;
  onRemove: () => void;
  isAdding: boolean;
}) {
  if (!item) {
    return (
      <button
        onClick={onAdd}
        style={{
          width: "100%",
          padding: "15px 18px",
          textAlign: "left",
          borderRadius: "12px",
          cursor: "pointer",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: "14px",
          transition: "all .2s",
          background: isAdding ? "rgba(216,31,216,.08)" : "transparent",
          border: isAdding ? "1px solid rgba(216,31,216,.45)" : `1px dashed ${COLORS.borderSolid}`,
          color: isAdding ? COLORS.textMain : "#9499ac",
        }}
      >
        {isAdding ? "Odustani" : `+ Dodaj: ${label}`}
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 18px",
        borderRadius: "12px",
        background: "rgba(216,31,216,.08)",
        border: "1px solid rgba(216,31,216,.45)",
        fontSize: "14px",
      }}
    >
      <span>
        <strong>{label}:</strong> {item.title}
      </span>
      <button
        onClick={onRemove}
        style={{ color: "#ff6a82", border: "none", background: "none", cursor: "pointer", fontWeight: "bold", fontFamily: FONT }}
      >
        ✖ Ukloni
      </button>
    </div>
  );
}

// --- STYLES ---
const fullScreenMsg: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: COLORS.bgMain,
  fontFamily: FONT,
  color: COLORS.textMain,
};

const kickerStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: "11px",
  letterSpacing: "2.5px",
  color: COLORS.accent,
  marginBottom: "9px",
};

const h2Style: CSSProperties = {
  margin: 0,
  fontSize: "clamp(24px,3vw,34px)",
  fontWeight: 700,
  letterSpacing: "-.6px",
};

const navBtnStyle: CSSProperties = {
  padding: "11px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontFamily: FONT,
  fontWeight: 600,
  fontSize: "13px",
  background: COLORS.bgCard,
  border: `1px solid ${COLORS.border}`,
  color: COLORS.textMain,
  transition: "border-color .2s",
};

const navBtnDangerStyle: CSSProperties = {
  ...navBtnStyle,
  color: "#ff6a82",
};

const brandBtnStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "30px",
  minHeight: "170px",
  padding: "24px",
  background: COLORS.bgCard,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "18px",
  cursor: "pointer",
  color: COLORS.textMain,
  transition: "all .2s",
  fontFamily: FONT,
  textAlign: "left",
};

const segBtnStyle = (active: boolean): CSSProperties => ({
  padding: "9px 18px",
  borderRadius: "9px",
  border: "none",
  cursor: "pointer",
  fontFamily: FONT,
  fontWeight: 600,
  fontSize: "13px",
  background: active ? COLORS.accent : "transparent",
  color: active ? "#fff" : COLORS.textMuted,
  boxShadow: active ? "0 6px 18px -6px rgba(216,31,216,.85)" : "none",
  transition: "all .2s",
});

const primaryBtnStyle: CSSProperties = {
  padding: "13px 24px",
  borderRadius: "11px",
  border: "none",
  cursor: "pointer",
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: "14px",
  color: "#fff",
  background: "linear-gradient(135deg,#d81fd8,#a020f0)",
  boxShadow: "0 12px 30px -10px rgba(216,31,216,.7)",
  transition: "filter .2s",
};

const arrowStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: "46px",
  height: "46px",
  borderRadius: "50%",
  border: `1px solid ${COLORS.borderSolid}`,
  background: "rgba(17,19,27,.72)",
  backdropFilter: "blur(8px)",
  color: COLORS.textMain,
  fontSize: "24px",
  lineHeight: 1,
  cursor: "pointer",
  zIndex: 60,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingBottom: "2px",
};

const badgeBase: CSSProperties = {
  position: "absolute",
  top: "12px",
  left: "12px",
  zIndex: 6,
  padding: "4px 9px",
  borderRadius: "7px",
  fontFamily: MONO,
  fontSize: "9px",
  fontWeight: 600,
  letterSpacing: ".6px",
  textTransform: "uppercase",
};

const warningStyle: CSSProperties = {
  marginTop: "20px",
  padding: "12px",
  background: "rgba(245,158,11,.1)",
  border: "1px solid rgba(245,158,11,.3)",
  color: "#f0a020",
  borderRadius: "10px",
  fontSize: "12px",
  lineHeight: 1.4,
};

const contactInput: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "#0b0d14",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: "10px",
  color: "#f3f4f8",
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const checkoutBtnStyle: CSSProperties = {  width: "100%",
  padding: "17px",
  marginTop: "22px",
  borderRadius: "12px",
  border: "none",
  cursor: "pointer",
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: "16px",
  color: "#fff",
  background: "linear-gradient(135deg,#d81fd8,#a020f0)",
  boxShadow: "0 14px 34px -12px rgba(216,31,216,.75)",
  transition: "filter .2s",
};

const ghostBtnStyle: CSSProperties = {
  width: "100%",
  padding: "13px",
  marginTop: "10px",
  borderRadius: "12px",
  cursor: "pointer",
  fontFamily: FONT,
  fontWeight: 600,
  fontSize: "13.5px",
  color: COLORS.textMain,
  background: "transparent",
  border: `1px solid ${COLORS.borderSolid}`,
  transition: "border-color .2s",
};

const dropdownStyle: CSSProperties = {
  maxHeight: "250px",
  overflowY: "auto",
  border: `1px solid ${COLORS.border}`,
  background: COLORS.bgDark,
  borderRadius: "12px",
};

const dropdownItemStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  padding: "12px 15px",
  border: "none",
  borderBottom: `1px solid ${COLORS.border}`,
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: FONT,
};

export default function Builder() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            color: COLORS.textMain,
            padding: "100px",
            textAlign: "center",
            background: COLORS.bgMain,
            minHeight: "100vh",
            fontFamily: FONT,
          }}
        >
          Učitavanje aplikacije…
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}