"use client";
import { CSSProperties, useEffect, useState, useMemo, Suspense, useRef } from "react";
import { useCart } from "@/lib/cart";
import { ASSEMBLY_FEE } from "@/lib/pricing";
import { SITE } from "@/lib/site-config";
import { BUILD_PART_KEYS, BUILD_PART_LABEL, encodeBuild, decodeBuild, type BuildPartKey, type EncodedBuild } from "@/lib/build-share";
import { useSearchParams, useRouter } from "next/navigation";

// --- TYPES ---
export type ProductNode = {
  id: string;
  handle: string;
  title: string;
  description?: string;
  tags: string[];
  availableForSale?: boolean;
  featuredImage?: { url: string; altText?: string };
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        availableForSale?: boolean;
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
  pcfRecommended?: { value: string };
  pcfPick?: { value: string };
  pcfSpecs?: { value: string };
};

type Step =
  | "brand"
  | "cpu"
  | "motherboard"
  | "ram"
  | "gpu"
  | "pohrana"
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
  "pohrana",
  "case",
  "psu",
  "cooler",
  "os",
  "review",
];

// Steps whose primary choice can be skipped outright (not just "has an
// optional secondary slot", like Pohrana does) — marked lighter in the rail
// with an "opcionalno" tag. Hladnjak stays required: nothing in the data
// says whether a CPU ships with a stock cooler, so there's no safe way to
// tell when skipping it would actually leave the build without one.
const OPTIONAL_STEPS: Step[] = ["os"];

const STEP_LABELS: Record<Step, string> = {
  brand: "Platforma",
  cpu: "Procesor",
  motherboard: "Matična ploča",
  ram: "Radna memorija",
  gpu: "Grafička kartica",
  pohrana: "Pohrana",
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
  pohrana: "Pohrana",
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
  pohrana: "SSD je glavni disk — tu se instaliraju Windows, igre i programi, i on čini računalo brzim pri pokretanju. Birate kapacitet: što je veći broj (TB), to više stane. Svi su brzi (NVMe), razlika je uglavnom u prostoru. Tvrdi disk (HDD) je jeftin dodatni prostor za pohranu — filmovi, slike, sigurnosne kopije — sporiji je od SSD-a pa služi za arhivu, ne za igre. Potpuno je opcionalan." + REC_LINE,
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

function BuilderContent({ products }: { products: ProductNode[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialized = useRef(false);
  const railRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);
  const capturedRef = useRef(false);
  const downIdxRef = useRef<number | null>(null);
  const dragStartTimeRef = useRef(0);
  const wheelLockRef = useRef(false);
  // steps whose initial carousel focus has already been seeded — see the
  // render-time block below currentProducts
  const seededStepsRef = useRef<Set<Step>>(new Set());
  const isProgrammaticScrollRef = useRef(false);

  // --- STATE ---
  const [stepIndex, setStepIndex] = useState(0);
  const { addCustomBuild } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedVarId, setSelectedVarId] = useState("");
  const [startX, setStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"coverflow" | "grid">("coverflow");
  const [shareCopied, setShareCopied] = useState(false);
  const [shareNotice, setShareNotice] = useState<string[]>([]);
  const [hoverBrand, setHoverBrand] = useState<string | null>(null);
  const [hoverCard, setHoverCard] = useState<number | null>(null);
  const [hoverReviewRow, setHoverReviewRow] = useState<string | null>(null);
  // detail drawer: detailsProduct drives the open/closed state, lastDetailsProduct
  // keeps the content populated while it slides shut so it doesn't flash empty
  const [detailsProduct, setDetailsProduct] = useState<ProductNode | null>(null);
  const [lastDetailsProduct, setLastDetailsProduct] = useState<ProductNode | null>(null);
  const detailsTriggerRef = useRef<HTMLElement | null>(null);
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
  // F1: Pohrana step's optional secondary (HDD) slot — separate from the
  // review screen's "add a 2nd drive" upsells above (addingExtra)
  const [pohranaPickerOpen, setPohranaPickerOpen] = useState(false);
  // G: compare — up to 3 product ids for the current step; comparePanelClosed
  // hides the panel without clearing the checkboxes (checking/unchecking
  // anything re-opens it), separate from clearCompare which resets both
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparePanelClosed, setComparePanelClosed] = useState(false);
  const [compareLimitHint, setCompareLimitHint] = useState(false);

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

  // keep the active step pill in view on the horizontally-scrolling rail.
  // Guarded with isProgrammaticScrollRef even though nothing currently reads
  // the rail's scroll position back into state (verified: neither the rail
  // nor the card carousel has an onScroll handler today — the carousel is
  // pointer-drag-driven, not native scroll) — this is the one real
  // scrollIntoView call in the file, so it's where that kind of feedback
  // would first appear if a future change ever wires scroll position back
  // into state here.
  useEffect(() => {
    const el = railRef.current?.querySelector<HTMLElement>(`[data-step-idx="${stepIndex}"]`);
    if (!el) return;
    const railEl = railRef.current;
    isProgrammaticScrollRef.current = true;
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    const clear = () => {
      isProgrammaticScrollRef.current = false;
    };
    railEl?.addEventListener("scrollend", clear, { once: true });
    const fallback = setTimeout(clear, 700); // scrollend isn't supported everywhere yet
    return () => {
      railEl?.removeEventListener("scrollend", clear);
      clearTimeout(fallback);
    };
  }, [stepIndex]);

  // E6: grid/carousel preference persists across steps (already true, same
  // state the whole session) and across visits, via localStorage
  useEffect(() => {
    const saved = localStorage.getItem("rs_view_mode");
    if (saved === "coverflow" || saved === "grid") setViewMode(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("rs_view_mode", viewMode);
  }, [viewMode]);

  // detail drawer: keep content populated during the close animation, and
  // return focus to whichever "Detalji" button opened it once it's shut
  useEffect(() => {
    if (detailsProduct) setLastDetailsProduct(detailsProduct);
    else detailsTriggerRef.current?.focus();
  }, [detailsProduct]);

  const openDetails = (p: ProductNode, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    detailsTriggerRef.current = e.currentTarget;
    setDetailsProduct(p);
  };
  const closeDetails = () => setDetailsProduct(null);

  // G: compare — cap at 3, checking/unchecking always re-opens a dismissed panel
  const toggleCompare = (id: string) => {
    setComparePanelClosed(false);
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        setCompareLimitHint(true);
        return prev;
      }
      return [...prev, id];
    });
  };
  const clearCompare = () => {
    setCompareIds([]);
    setComparePanelClosed(false);
  };
  // auto-dismiss the "max 3" hint
  useEffect(() => {
    if (!compareLimitHint) return;
    const t = setTimeout(() => setCompareLimitHint(false), 2600);
    return () => clearTimeout(t);
  }, [compareLimitHint]);

  // map of current selections, keyed the same way as BUILD_PART_KEYS — shared
  // by the URL auto-sync effect below and by shareBuild()
  const currentParts = (): Record<BuildPartKey, ProductNode | null> => ({
    cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, case: pcCase, psu, cooler, os,
  });

  const buildEncodedBuild = (): EncodedBuild => {
    const partsMap = currentParts();
    const parts: EncodedBuild["parts"] = {};
    for (const key of BUILD_PART_KEYS) {
      const item = partsMap[key];
      if (!item) continue;
      const vTitle = item.selectedVariant?.title;
      parts[key] = vTitle && vTitle !== "Default Title" ? [item.handle, vTitle] : [item.handle];
    }
    return brand ? { brand, parts } : { parts };
  };

  useEffect(() => {
    if (isReviewStep) {
      const b = encodeBuild(buildEncodedBuild());
      router.replace(`?b=${b}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, brand, cpu, mb, ram, gpu, gpu2, ssd, ssd2, hdd, hdd2, pcCase, psu, cooler, os, router, isReviewStep]);

  // products now arrive pre-fetched as a prop (server-rendered) — this effect
  // only restores a shared build (?b=<encoded>) from the URL. Parts are matched
  // by Shopify handle (not id), so a link keeps working after a catalog refresh;
  // anything missing or out of stock is skipped and named in shareNotice.
  useEffect(() => {
    if (initialized.current) return;

    const encoded = searchParams.get("b");
    const decoded = encoded ? decodeBuild(encoded) : null;

    if (decoded) {
      if (decoded.brand) setBrand(decoded.brand);

      const SETTERS: Record<BuildPartKey, (p: ProductNode) => void> = {
        cpu: setCpu, mb: setMb, ram: setRam, gpu: setGpu, gpu2: setGpu2,
        ssd: setSsd, ssd2: setSsd2, hdd: setHdd, hdd2: setHdd2,
        case: setPcCase, psu: setPsu, cooler: setCooler, os: setOs,
      };

      const changed: string[] = [];
      for (const key of BUILD_PART_KEYS) {
        const enc = decoded.parts[key];
        if (!enc) continue;
        const [handle, variantTitle] = enc;
        const found = products.find((p) => p.handle === handle);
        if (!found || found.availableForSale === false) {
          changed.push(BUILD_PART_LABEL[key]);
          continue;
        }
        const varNode = (variantTitle && found.variants.edges.find((v) => v.node.title === variantTitle)?.node)
          || found.variants.edges.find((v) => v.node.availableForSale !== false)?.node
          || found.variants.edges[0]?.node;
        if (!varNode || varNode.availableForSale === false) {
          changed.push(BUILD_PART_LABEL[key]);
          continue;
        }
        SETTERS[key]({ ...found, selectedVariant: varNode });
      }
      if (changed.length > 0) setShareNotice(changed);
      if (decoded.parts.cpu && decoded.parts.case) setStepIndex(STEPS.indexOf("review"));
      initialized.current = true;
      return;
    }

    // legacy per-param links (brand/cpu/mb/...), matched by variant id — kept
    // only so older shared links (pre-dating the ?b= scheme) still restore.
    const loadParam = (param: string, setter: any) => {
      const val = searchParams.get(param);
      if (!val) return;

      const found = products.find(
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
    initialized.current = true;
  }, [searchParams, products]);

  useEffect(() => {
    setDragOffset(0);
    setHelpOpen(false);
    // comparing across different component types doesn't make sense
    setCompareIds([]);
    setComparePanelClosed(false);
    setCompareLimitHint(false);
  }, [stepIndex]);

  // --- FILTERING (unchanged business logic) ---
  // Memoized on its actual inputs — not recomputed into a fresh array
  // reference on every render. This matters beyond performance: the
  // step-entry seeding effect below depends on this array, and an
  // unstable reference there is exactly the kind of thing that caused the
  // last freeze (an effect re-running on every render instead of only when
  // something real changed).
  const currentProducts = useMemo(() => products
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
      if (currentStep === "pohrana") {
        // the step's main carousel is the required "Glavni disk (SSD)" slot;
        // the optional secondary (HDD) slot has its own small picker below it
        return type === "ssd";
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
      // ascending by the full 5-level pcf.quality scale, so moving right in the
      // carousel always means moving up — no-quality (score 0) sorts last, not
      // first, so it's treated as beyond "flagship" rather than before "average"
      const wA = getQualityScore(a.pcfQuality?.value) || 999;
      const wB = getQualityScore(b.pcfQuality?.value) || 999;
      if (wA !== wB) return wA - wB;

      const priceA = Number(a.variants.edges[0]?.node.price.amount || 0);
      const priceB = Number(b.variants.edges[0]?.node.price.amount || 0);
      return priceA - priceB;
    }), [products, currentStep, brand, cpu, mb, ram, gpu, gpu2, pcCase, cooler]);

  // which state variable a given step's carousel selection writes to — used
  // below to detect "the user (or a restored permalink) already decided
  // this step" so seeding never overrides an existing choice
  const selectedItemForStep = (step: Step): ProductNode | null => {
    switch (step) {
      case "cpu": return cpu;
      case "motherboard": return mb;
      case "ram": return ram;
      case "gpu": return gpu;
      case "pohrana": return ssd;
      case "case": return pcCase;
      case "psu": return psu;
      case "cooler": return cooler;
      case "os": return os;
      default: return null; // brand, review — no carousel
    }
  };

  // Seed each step's initial carousel focus on the recommended item (falling
  // back to pick, then the sorted list's middle) instead of always index 0 —
  // but never override a choice the user already made, or one restored from
  // a build permalink.
  //
  // This runs during render (React's sanctioned "adjust state" pattern —
  // same one SiteHeader.tsx already uses), not in a useEffect, specifically
  // so activeIndex is already correct on the FIRST committed render for a
  // step. Doing it in an effect means one render commits with the previous
  // step's stale activeIndex against the new step's product list first, then
  // a second render corrects it — two distinct activeProduct values, each
  // one firing the pre-existing `}, [activeProduct])` effect below. That
  // double transition is what actually froze the browser last time; this
  // sidesteps it entirely rather than trying to out-guard it.
  //
  // Guard 1 (run once per step, ever): seededStepsRef is a ref, not state,
  // so checking/recording it never itself triggers a render, and it's
  // immune to re-renders that don't change currentStep.
  // Guard 4 (no-op when unchanged): setActiveIndex is only called if the
  // computed target actually differs from the current value.
  if (!seededStepsRef.current.has(currentStep)) {
    seededStepsRef.current.add(currentStep);
    const existing = selectedItemForStep(currentStep);
    const existingIdx = existing ? currentProducts.findIndex((p) => p.id === existing.id) : -1;
    let seedTarget = existingIdx;
    if (seedTarget < 0 && currentProducts.length > 0) {
      const recIdx = currentProducts.findIndex((p) => (p.pcfRecommended?.value || "").toLowerCase() === "true");
      const pickIdx = recIdx === -1 ? currentProducts.findIndex((p) => (p.pcfPick?.value || "").toLowerCase() === "true") : -1;
      seedTarget = recIdx >= 0 ? recIdx : pickIdx >= 0 ? pickIdx : Math.floor((currentProducts.length - 1) / 2);
    }
    if (seedTarget >= 0 && seedTarget !== activeIndex) {
      setActiveIndex(seedTarget);
    }
  }

  // The data already guarantees at most one pcf.recommended / pcf.pick per
  // component type, but cap it in code too and warn instead of silently
  // showing badges on more than one card if that ever slips.
  const capOneFlag = (flagKey: "pcfRecommended" | "pcfPick", label: string): string | null => {
    const flagged = currentProducts.filter((p) => (p[flagKey]?.value || "").toLowerCase() === "true");
    if (flagged.length > 1 && process.env.NODE_ENV !== "production") {
      console.warn(`[Builder] more than one product flagged "${label}" for step "${currentStep}":`, flagged.map((p) => p.title));
    }
    return flagged[0]?.id ?? null;
  };
  const recommendedId = capOneFlag("pcfRecommended", "pcf.recommended");
  const pickId = capOneFlag("pcfPick", "pcf.pick");

  // pcf.quality (5 raw values) -> 3 display tiers. Unmapped/empty renders nothing.
  const QUALITY_TIER_LABEL: Record<string, string> = {
    average: "ULAZNI",
    good: "ULAZNI",
    "very good": "SREDNJI",
    excellent: "VRHUNSKI",
    flagship: "VRHUNSKI",
  };
  const tierLabel = (quality?: string): string | null => QUALITY_TIER_LABEL[(quality || "").toLowerCase()] || null;

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

  // first three pcf.specs lines, values only, "·"-joined — the card's compact
  // spec row. Fewer than three lines shows what exists; no lines shows nothing.
  const cardSpecLine = (specs?: string): string => {
    if (!specs) return "";
    return specs
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((line) => {
        const ix = line.indexOf(":");
        return ix === -1 ? line : line.slice(ix + 1).trim();
      })
      .join(" · ");
  };

  // --- COVERFLOW GEOMETRY ---
  // Reverted to the original 3-prominent-cards-plus-ghosts design (the Phase E
  // "5 flat cards" redesign traded away visual quality for an illegibility
  // problem that didn't actually exist — ±1 cards were always readable, and
  // the ±2 ghosts down to .06 opacity are deliberate depth, not a bug).
  const SLIDE = isMobile ? 150 : 300;

  // Non-circular: offset is a plain difference, no wraparound — kept from the
  // later fix, independent of the geometry revert. At the ends, cards past
  // the boundary simply aren't there — nothing loops from the other side of
  // the (quality-sorted) list.
  const getOffset = (index: number) => index - activeIndex;

  // 3D coverflow card transform (original design)
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

  const atFirst = activeIndex <= 0;
  const atLast = activeIndex >= currentProducts.length - 1;
  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(currentProducts.length - 1, i + 1));

  // arrow keys navigate whenever the carousel itself (or something inside it,
  // e.g. an arrow button) has focus
  const handleCarouselKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  };

  // trackpad horizontal swipe — throttled, since a single gesture fires many
  // wheel events and would otherwise blow through several cards at once
  const handleCarouselWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 24) return;
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    if (e.deltaX > 0) goNext();
    else goPrev();
    setTimeout(() => {
      wheelLockRef.current = false;
    }, 350);
  };

  // --- INTERACTION & DRAG PHYSICS (robust on touch + mouse) ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // let the arrow buttons and the "Usporedi" checkbox work normally
    if ((e.target as HTMLElement).closest("button, input, label")) return;
    // remember which card the press started on (for tap-to-select / tap-to-center)
    const cardEl = (e.target as HTMLElement).closest("[data-cardidx]") as HTMLElement | null;
    downIdxRef.current = cardEl ? Number(cardEl.dataset.cardidx) : null;
    movedRef.current = false;
    dragStartTimeRef.current = performance.now();
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
    if (Math.abs(diff) > 6) {
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
      // dragged: snap to whichever card you released on (can cross several).
      // a quick flick (short distance but high velocity) should still advance
      // one slide — otherwise fast mobile swipes that don't cover the full
      // SLIDE distance just snap back and look like the carousel is stuck.
      const elapsedMs = Math.max(1, performance.now() - dragStartTimeRef.current);
      const velocity = Math.abs(dragOffset) / elapsedMs; // px/ms
      let steps = Math.round(dragOffset / SLIDE);
      if (steps === 0 && Math.abs(dragOffset) > 12 && velocity > 0.35) {
        steps = dragOffset > 0 ? 1 : -1;
      }
      if (N > 0 && steps !== 0) setActiveIndex((prev) => Math.max(0, Math.min(N - 1, prev - steps)));
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
    else if (type === "pohrana") setSsd(productWithVariant);
    else if (type === "case") setPcCase(productWithVariant);
    else if (type === "psu") setPsu(productWithVariant);
    else if (type === "cooler") setCooler(productWithVariant);
    else if (type === "os") setOs(productWithVariant);

    setStepIndex((prev) => prev + 1);
    setActiveIndex(0);
  };

  const handleSkip = () => {
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
    const b = encodeBuild(buildEncodedBuild());
    const query = `?b=${b}`;
    const url = `${window.location.origin}/konfigurator${query}`;
    navigator.clipboard.writeText(url);
    // keep the address bar in sync too
    window.history.replaceState(null, "", `/konfigurator${query}`);
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

  // rough dispatch window from today, for the mobile sticky bar — matches the
  // lead time promised on the homepage and product pages (lib/site-config.ts)
  const estimatedDispatch = () => {
    const fmt = (d: Date) => d.toLocaleDateString("hr-HR", { day: "numeric", month: "short" });
    const from = new Date();
    from.setDate(from.getDate() + SITE.buildDaysMin);
    const to = new Date();
    to.setDate(to.getDate() + SITE.buildDaysMax);
    return `${fmt(from)} – ${fmt(to)}`;
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
    { step: "pohrana", item: ssd },
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

  // review-row actions: parts chosen through a normal build step jump back to
  // that step to swap them; the three upsell slots (no dedicated step) get an
  // inline remove instead, since re-adding is how you'd "change" those anyway.
  const KEY_TO_STEP: Partial<Record<string, Step>> = {
    cpu: "cpu", gpu: "gpu", mb: "motherboard", ram: "ram", ssd: "pohrana", hdd: "pohrana",
    case: "case", psu: "psu", cooler: "cooler", os: "os",
  };
  const KEY_TO_REMOVE: Partial<Record<string, () => void>> = {
    gpu2: () => setGpu2(null),
    ssd2: () => setSsd2(null),
    hdd2: () => setHdd2(null),
  };

  const containerStyle: CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    color: COLORS.textMain,
    padding: isMobile ? "22px 14px 92px" : "26px 22px 64px",
    overflowX: "hidden",
    fontFamily: FONT,
    background:
      "radial-gradient(1100px 560px at 72% -14%,rgba(216,31,216,.11),transparent 62%)," + COLORS.bgMain,
  };

  // --- STEP RAIL ---
  const renderRail = () => (
    <div className="rs-rail-wrap">
      <div
        ref={railRef}
        className="rs-rail"
        style={{
          display: "flex",
          gap: "7px",
          overflowX: "auto",
          paddingBottom: "10px",
          marginBottom: "22px",
          scrollSnapType: "x proximity",
        }}
      >
        {STEPS.map((s, i) => {
          const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
          const clickable = i <= stepIndex;
          const optional = OPTIONAL_STEPS.includes(s);
          return (
            <div
              key={s}
              data-step-idx={i}
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
                scrollSnapAlign: "center",
                opacity: optional && state !== "active" ? 0.7 : 1,
                background: state === "active" ? "rgba(216,31,216,.13)" : "transparent",
                border: state === "active" ? "1px solid rgba(216,31,216,.5)" : optional ? `1px dashed ${COLORS.border}` : `1px solid ${COLORS.border}`,
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
              <span>
                {RAIL_LABELS[s]}
                {optional && (
                  <span style={{ display: "block", fontSize: "9px", fontWeight: 500, letterSpacing: ".5px", color: COLORS.textFaint, marginTop: "1px" }}>
                    opcionalno
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
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
      {/* visually hidden — the visual step heading below (h2Style) carries the UI,
          but the page still needs one real h1 for SEO/accessibility */}
      <h1 style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
        Konfigurator računala — sastavi PC po mjeri
      </h1>
      <div style={{ maxWidth: "1340px", margin: "0 auto" }}>
        {/* a shared build link can point at parts that were deleted or went
            out of stock since it was created — say so instead of silently
            dropping them */}
        {shareNotice.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
              padding: "12px 15px",
              marginBottom: "18px",
              background: "rgba(255,184,77,.08)",
              border: "1px solid rgba(255,184,77,.25)",
              borderRadius: "10px",
              fontSize: "12.5px",
              color: "#ffb84d",
              lineHeight: 1.5,
            }}
          >
            <span>
              Neke stavke iz podijeljene konfiguracije više nisu dostupne pa nisu uključene:{" "}
              <b>{shareNotice.join(", ")}</b>.
            </span>
            <button
              onClick={() => setShareNotice([])}
              aria-label="Zatvori"
              style={{ background: "none", border: "none", color: "#ffb84d", cursor: "pointer", fontSize: "15px", lineHeight: 1, flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        )}

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
                {currentStep === "os" && (
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
                      className="rs-cf-container"
                      tabIndex={0}
                      role="region"
                      aria-label="Karusel komponenti — lijeva/desna strelica za navigaciju"
                      onKeyDown={handleCarouselKeyDown}
                      onWheel={handleCarouselWheel}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
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
                        className="rs-cf-arrow"
                        onClick={goPrev}
                        disabled={atFirst}
                        aria-label="Prethodna komponenta"
                        style={{ ...arrowStyle, left: "2px", opacity: atFirst ? 0.3 : 1, cursor: atFirst ? "default" : "pointer" }}
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

                        const dv = displayVariant(p, idx === activeIndex);
                        const specText = cardSpecLine(p.pcfSpecs?.value);
                        const cardW = isMobile ? 196 : 284;
                        const cardH = isMobile ? 256 : 360;

                        return (
                          <div
                            key={p.id}
                            className="rs-cf-card"
                            data-cardidx={idx}
                            data-testid={isActive ? "active-card" : undefined}
                            tabIndex={0}
                            role="button"
                            aria-label={`${p.title}${isActive ? " — u fokusu, pritisnite Enter za odabir" : ""}`}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              e.preventDefault();
                              if (isActive) handleSelection(currentStep, p);
                              else setActiveIndex(idx);
                            }}
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
                            {p.id === recommendedId && (
                              <span style={{ ...cardBadgeBase, top: "10px", background: COLORS.accent, color: "#fff" }}>PREPORUČUJEMO</span>
                            )}
                            {p.id === pickId && (
                              <span style={{ ...cardBadgeBase, top: p.id === recommendedId ? "34px" : "10px", background: "transparent", border: `1px solid ${COLORS.accent}`, color: COLORS.accent }}>NAJBOLJI OMJER</span>
                            )}
                            {isActive && (
                              <button onClick={(e) => openDetails(p, e)} style={cardDetailsBtnStyle}>
                                <span aria-hidden="true">ⓘ</span> DETALJI
                              </button>
                            )}
                            <div style={{ width: "100%", height: "54%" }}>
                              <ImageBlock src={dv.img} h="100%" />
                            </div>
                            {isActive && (
                              <label style={compareLabelStyle} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={compareIds.includes(p.id)}
                                  disabled={!compareIds.includes(p.id) && compareIds.length >= 3}
                                  onChange={() => toggleCompare(p.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={compareCheckboxStyle}
                                />
                                Usporedi
                              </label>
                            )}
                            <div style={{ marginTop: "auto", paddingTop: "13px", pointerEvents: "none" }}>
                              {tierLabel(p.pcfQuality?.value) && (
                                <div style={{ fontFamily: MONO, fontSize: "9.5px", fontWeight: 600, letterSpacing: "1px", color: COLORS.textMain, opacity: 0.6, marginBottom: "3px" }}>
                                  {tierLabel(p.pcfQuality?.value)}
                                </div>
                              )}
                              <div style={{ fontWeight: 600, fontSize: "16px", lineHeight: 1.25 }}>{p.title}</div>
                              {specText && (
                                <div style={{ fontFamily: MONO, fontSize: "11px", color: COLORS.textMuted, marginTop: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {specText}
                                </div>
                              )}
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
                        className="rs-cf-arrow"
                        onClick={goNext}
                        disabled={atLast}
                        aria-label="Sljedeća komponenta"
                        style={{ ...arrowStyle, right: "2px", opacity: atLast ? 0.3 : 1, cursor: atLast ? "default" : "pointer" }}
                      >
                        ›
                      </button>
                    </div>
                  )}

                  {viewMode === "coverflow" && currentProducts.length > 0 && (
                    <div style={{ textAlign: "center", fontFamily: MONO, fontSize: "12px", color: COLORS.textMuted, letterSpacing: "1px", marginBottom: "18px" }}>
                      {activeIndex + 1} / {currentProducts.length}
                    </div>
                  )}

                  {/* E2: tier axis — hidden entirely unless at least one product
                      in this step has a quality value; the marker itself only
                      shows when the focused product specifically has one */}
                  {viewMode === "coverflow" && currentProducts.some((p) => getQualityScore(p.pcfQuality?.value) > 0) && (
                    <div style={{ maxWidth: "360px", margin: "0 auto 28px", padding: "0 12px" }}>
                      <div style={{ position: "relative", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,.1)" }}>
                        {getQualityScore(activeProduct?.pcfQuality?.value) > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: `${((getQualityScore(activeProduct?.pcfQuality?.value) - 1) / 4) * 100}%`,
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background: COLORS.accent,
                              boxShadow: `0 0 10px ${COLORS.accent}`,
                              transform: "translate(-50%,-50%)",
                              transition: "left .3s ease",
                            }}
                          />
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "9px", fontFamily: MONO, fontSize: "9.5px", letterSpacing: "1px", color: COLORS.textFaint }}>
                        <span>ULAZNI</span>
                        <span>VRHUNSKI</span>
                      </div>
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
                        const dv = displayVariant(p, selected);
                        const specText = cardSpecLine(p.pcfSpecs?.value);
                        return (
                          <div
                            key={p.id}
                            data-testid={selected ? "active-card" : undefined}
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
                            {p.id === recommendedId && (
                              <span style={{ ...cardBadgeBase, top: "10px", background: COLORS.accent, color: "#fff" }}>PREPORUČUJEMO</span>
                            )}
                            {p.id === pickId && (
                              <span style={{ ...cardBadgeBase, top: p.id === recommendedId ? "34px" : "10px", background: "transparent", border: `1px solid ${COLORS.accent}`, color: COLORS.accent }}>NAJBOLJI OMJER</span>
                            )}
                            <button onClick={(e) => openDetails(p, e)} style={cardDetailsBtnStyle}>
                              <span aria-hidden="true">ⓘ</span> DETALJI
                            </button>
                            <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", marginBottom: "14px" }}>
                              <ImageBlock src={dv.img} h="100%" />
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
                            <label style={compareLabelStyle} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={compareIds.includes(p.id)}
                                disabled={!compareIds.includes(p.id) && compareIds.length >= 3}
                                onChange={() => toggleCompare(p.id)}
                                onClick={(e) => e.stopPropagation()}
                                style={compareCheckboxStyle}
                              />
                              Usporedi
                            </label>
                            {tierLabel(p.pcfQuality?.value) && (
                              <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 600, letterSpacing: "1px", color: COLORS.textMain, opacity: 0.6, marginBottom: "3px" }}>
                                {tierLabel(p.pcfQuality?.value)}
                              </div>
                            )}
                            <div style={{ fontWeight: 600, fontSize: "14px", lineHeight: 1.25 }}>{p.title}</div>
                            {specText && (
                              <div style={{ fontFamily: MONO, fontSize: "10.5px", color: COLORS.textMuted, marginTop: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {specText}
                              </div>
                            )}
                            <div style={{ fontWeight: 700, fontSize: "18px", marginTop: "10px", letterSpacing: "-.3px" }}>
                              €{dv.price.toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* F1: Pohrana's optional secondary (HDD) slot — shown inline
                      next to the required SSD carousel above, not hidden behind
                      a separate step. Defaults to an explicit "no drive" choice
                      rather than an ambiguous unselected state. */}
                  {currentStep === "pohrana" && (
                    <div style={{ marginTop: "26px", paddingTop: "22px", borderTop: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>Dodatni disk</div>
                      <div style={{ color: COLORS.textMuted, fontSize: "12.5px", marginTop: "2px", marginBottom: "14px" }}>
                        Opcionalno — dodatni prostor za pohranu (HDD)
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                        <button
                          onClick={() => {
                            setHdd(null);
                            setPohranaPickerOpen(false);
                          }}
                          style={{
                            padding: "9px 14px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: FONT,
                            background: !hdd ? "rgba(216,31,216,.13)" : "transparent",
                            border: !hdd ? "1px solid rgba(216,31,216,.5)" : `1px solid ${COLORS.border}`,
                            color: !hdd ? "#fff" : COLORS.textMuted,
                          }}
                        >
                          ✕ Bez dodatnog diska
                        </button>
                        {hdd && (
                          <span
                            style={{
                              padding: "9px 14px",
                              borderRadius: "10px",
                              fontSize: "13px",
                              fontWeight: 600,
                              fontFamily: FONT,
                              background: "rgba(216,31,216,.13)",
                              border: "1px solid rgba(216,31,216,.5)",
                              color: "#fff",
                            }}
                          >
                            {hdd.title} · €{(hdd.selectedVariant?.price?.amount ?? hdd.variants.edges[0]?.node.price.amount)}
                          </span>
                        )}
                        <button
                          onClick={() => setPohranaPickerOpen((o) => !o)}
                          style={{ ...navBtnStyle, padding: "9px 14px", fontSize: "13px" }}
                        >
                          {pohranaPickerOpen ? "Odustani" : hdd ? "Promijeni disk" : "+ Dodaj disk"}
                        </button>
                      </div>
                      {pohranaPickerOpen && (
                        <div style={{ ...dropdownStyle, marginTop: "10px" }}>
                          {products
                            .filter((p) => p.pcfType?.value === "hdd")
                            .map((p) => (
                              <div key={p.id}>
                                {p.variants.edges.map((v) => (
                                  <button
                                    key={v.node.id}
                                    style={dropdownItemStyle}
                                    onClick={() => {
                                      setHdd({ ...p, selectedVariant: v.node });
                                      setPohranaPickerOpen(false);
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
                            <button
                              onClick={(e) => openDetails(activeProduct, e)}
                              aria-label="Specifikacije"
                              title="Specifikacije"
                              style={{ width: "18px", height: "18px", borderRadius: "50%", border: `1px solid ${COLORS.accent}`, background: "none", color: COLORS.accent, fontSize: "11px", fontFamily: MONO, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }}
                            >
                              i
                            </button>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "9px", flexWrap: "wrap" }}>
                          {/* same ULAZNI/SREDNJI/VRHUNSKI vocabulary as the card's
                              tier label — this used to be a separate 5-level
                              "Razina: Vrlo dobra" meter with its own wording */}
                          {currentStep !== "case" && currentStep !== "os" && tierLabel(activeProduct?.pcfQuality?.value) && (
                            <span style={{ fontFamily: MONO, fontSize: "11px", color: COLORS.textMuted, letterSpacing: ".5px" }}>
                              Razina: {tierLabel(activeProduct?.pcfQuality?.value)}
                            </span>
                          )}
                          {currentStep === "case" && (
                            <span style={{ fontFamily: MONO, fontSize: "11px", color: COLORS.textMuted, letterSpacing: ".5px" }}>Stvar osobnog ukusa — sva su kvalitetna</span>
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
                    {currentStep === "os" && (
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
                  {selectedPartsList.map((part) => {
                    const targetStep = KEY_TO_STEP[part.key];
                    const removeAction = KEY_TO_REMOVE[part.key];
                    return (
                      <div
                        key={part.key}
                        onClick={targetStep ? () => setStepIndex(STEPS.indexOf(targetStep)) : undefined}
                        onMouseEnter={() => setHoverReviewRow(part.key)}
                        onMouseLeave={() => setHoverReviewRow((c) => (c === part.key ? null : c))}
                        role={targetStep ? "button" : undefined}
                        tabIndex={targetStep ? 0 : undefined}
                        onKeyDown={targetStep ? (e) => { if (e.key === "Enter") setStepIndex(STEPS.indexOf(targetStep)); } : undefined}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "18px",
                          background: COLORS.bgCard,
                          border: `1px solid ${hoverReviewRow === part.key ? COLORS.accent : COLORS.border}`,
                          borderRadius: "14px",
                          padding: "16px 20px",
                          cursor: targetStep ? "pointer" : "default",
                          transition: "border-color .15s",
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
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                transform: hoverReviewRow === part.key ? "scale(1.18)" : "scale(1)",
                                transition: "transform .25s cubic-bezier(.16,1,.3,1)",
                              }}
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
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                          <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-.3px" }}>
                            €
                            {Number(
                              part.item?.selectedVariant?.price?.amount ||
                                part.item?.variants.edges[0].node.price.amount
                            ).toFixed(2)}
                          </div>
                          {targetStep && (
                            <span style={{ fontFamily: MONO, fontSize: "10.5px", color: COLORS.accent, letterSpacing: ".3px", whiteSpace: "nowrap" }}>
                              Promijeni ›
                            </span>
                          )}
                          {removeAction && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeAction(); }}
                              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: MONO, fontSize: "10.5px", color: "#ff6a82", letterSpacing: ".3px", whiteSpace: "nowrap" }}
                            >
                              ✖ Ukloni
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                    {shareCopied ? "✓ Link kopiran" : "🔗 Kopiraj link"}
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

      {/* mobile sticky total bar — desktop already has an always-visible sticky
          sidebar (RIGHT SIDEBAR above), so this only needs to exist on mobile,
          where that sidebar scrolls out of view below the step content */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            background: COLORS.bgCard,
            borderTop: `1px solid ${COLORS.border}`,
            padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontSize: "10px", color: COLORS.textMuted, letterSpacing: "1px" }}>
              {selectedPartsList.length === 0 ? "ODABERI KOMPONENTE" : `ISPORUKA ${estimatedDispatch()}`}
            </div>
            <div style={{ fontSize: "19px", fontWeight: 700 }}>€{currentTotal().toFixed(2)}</div>
          </div>
        </div>
      )}

      <SpecsDrawer product={lastDetailsProduct} open={!!detailsProduct} onClose={closeDetails} isMobile={isMobile} />

      {compareIds.length >= 2 && !comparePanelClosed && (
        <ComparePanel
          products={currentProducts.filter((p) => compareIds.includes(p.id))}
          onRemove={toggleCompare}
          onClear={clearCompare}
          onClose={() => setComparePanelClosed(true)}
          bottomOffset={isMobile ? 68 : 0}
          limitHint={compareLimitHint}
        />
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

// Slide-in detail panel (right on desktop, full-height bottom sheet on
// mobile) — full pcf.specs table, description, image. Always mounted so the
// close animation can play; `product` is the last-opened one and keeps
// showing while `open` flips to false and the panel slides/drops out.
function SpecsDrawer({
  product,
  open,
  onClose,
  isMobile,
}: {
  product: ProductNode | null;
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const getFocusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []);

    // move focus into the drawer once it's open
    getFocusable()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const specRows = (product?.pcfSpecs?.value || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const ix = line.indexOf(":");
      return { label: ix === -1 ? "" : line.slice(0, ix).trim(), value: ix === -1 ? line : line.slice(ix + 1).trim() };
    });

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "rgba(2,3,6,.6)",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .25s",
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label={product ? `Detalji — ${product.title}` : "Detalji"}
        style={
          isMobile
            ? {
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                top: "10vh",
                zIndex: 301,
                background: COLORS.bgCard,
                borderTop: `1px solid ${COLORS.border}`,
                borderRadius: "18px 18px 0 0",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                transform: open ? "translateY(0)" : "translateY(100%)",
                transition: "transform .3s cubic-bezier(.16,1,.3,1)",
              }
            : {
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: "440px",
                maxWidth: "92vw",
                zIndex: 301,
                background: COLORS.bgCard,
                borderLeft: `1px solid ${COLORS.border}`,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                transform: open ? "translateX(0)" : "translateX(100%)",
                transition: "transform .3s cubic-bezier(.16,1,.3,1)",
              }
        }
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "16px 20px",
            background: COLORS.bgCard,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "16px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product?.title}
          </div>
          <button
            onClick={onClose}
            aria-label="Zatvori"
            style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: "20px", lineHeight: 1, cursor: "pointer", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {product?.featuredImage?.url && (
            <div style={{ marginBottom: "20px", borderRadius: "13px", overflow: "hidden", background: "linear-gradient(160deg,#1b2030,#0b0d14)" }}>
              <img src={product.featuredImage.url} alt="" style={{ width: "100%", height: "220px", objectFit: "contain" }} />
            </div>
          )}

          {product?.description && (
            <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: COLORS.textMuted, marginBottom: "24px" }}>{product.description}</p>
          )}

          {specRows.length > 0 && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "1.5px", color: COLORS.accent, marginBottom: "10px" }}>
                SPECIFIKACIJE
              </div>
              {specRows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    fontSize: "13px",
                    padding: "9px 0",
                    borderBottom: i < specRows.length - 1 ? `1px solid ${COLORS.border}` : "none",
                  }}
                >
                  {r.label && <span style={{ color: COLORS.textMuted }}>{r.label}</span>}
                  <span style={{ color: COLORS.textMain, fontWeight: 500, textAlign: "right" }}>{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Phase G: comparison table sliding up from the bottom. Rows are the union of
// every compared product's pcf.specs labels; a row whose values aren't all
// identical (a product missing the spec counts as different) is highlighted.
function ComparePanel({
  products,
  onRemove,
  onClear,
  onClose,
  bottomOffset,
  limitHint,
}: {
  products: ProductNode[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
  // keeps the panel clear of Builder's mobile sticky total bar, which is
  // also fixed to the bottom of the screen
  bottomOffset: number;
  // briefly shown when a 4th checkbox is clicked — the cap itself was
  // already silent (disabled, no visual change), so without this there was
  // no feedback at all that anything happened
  limitHint: boolean;
}) {
  const rows = (() => {
    const labels: string[] = [];
    const perProduct = new Map<string, Map<string, string>>();
    products.forEach((p) => {
      const map = new Map<string, string>();
      (p.pcfSpecs?.value || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach((line) => {
          const ix = line.indexOf(":");
          if (ix === -1) return;
          const label = line.slice(0, ix).trim();
          const value = line.slice(ix + 1).trim();
          if (!label) return;
          map.set(label, value);
          if (!labels.includes(label)) labels.push(label);
        });
      perProduct.set(p.id, map);
    });
    return labels.map((label) => {
      const values = products.map((p) => perProduct.get(p.id)?.get(label) ?? null);
      const differs = new Set(values.map((v) => v ?? " ")).size > 1;
      return { label, values, differs };
    });
  })();

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: `${bottomOffset}px`,
        zIndex: 200,
        maxHeight: "60vh",
        overflowY: "auto",
        background: COLORS.bgCard,
        borderTop: `1px solid ${COLORS.border}`,
        boxShadow: "0 -20px 50px -20px rgba(0,0,0,.7)",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "14px 20px",
          background: COLORS.bgCard,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "1.5px", color: COLORS.accent }}>
          USPOREDBA ({products.length})
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClear} style={{ ...navBtnStyle, padding: "7px 12px", fontSize: "12px" }}>
            Ukloni sve
          </button>
          <button
            onClick={onClose}
            aria-label="Zatvori usporedbu"
            style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: "18px", lineHeight: 1, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      </div>
      {limitHint && (
        <div
          style={{
            padding: "9px 20px",
            fontSize: "12.5px",
            color: "#ffb84d",
            background: "rgba(255,184,77,.08)",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          Možete usporediti najviše 3 proizvoda.
        </div>
      )}
      <div style={{ overflowX: "auto", padding: "0 20px 20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${products.length * 160}px` }}>
          <thead>
            <tr>
              <th style={{ borderBottom: `1px solid ${COLORS.border}` }} />
              {products.map((p) => (
                <th key={p.id} style={{ textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${COLORS.border}`, minWidth: "150px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontWeight: 600, fontSize: "13px", lineHeight: 1.3 }}>{p.title}</span>
                    <button
                      onClick={() => onRemove(p.id)}
                      aria-label={`Ukloni ${p.title} iz usporedbe`}
                      style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer", fontSize: "13px", flexShrink: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={products.length + 1} style={{ padding: "18px 12px", color: COLORS.textMuted, fontSize: "13px" }}>
                  Nema podataka o specifikacijama za usporedbu.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.label} style={{ background: row.differs ? "rgba(216,31,216,.06)" : "transparent" }}>
                  <td style={{ padding: "9px 12px", fontSize: "12.5px", color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap" }}>
                    {row.label}
                  </td>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      style={{
                        padding: "9px 12px",
                        fontSize: "12.5px",
                        borderBottom: `1px solid ${COLORS.border}`,
                        color: row.differs ? COLORS.accent : COLORS.textMain,
                        fontWeight: row.differs ? 600 : 400,
                      }}
                    >
                      {v ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- STYLES ---
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

// D1: shared shape for the two card badges — fill/border set per-badge at
// the call site (solid magenta for "recommended", outline for "pick")
const cardBadgeBase: CSSProperties = {
  position: "absolute",
  left: "10px",
  zIndex: 6,
  padding: "4px 9px",
  borderRadius: "7px",
  fontFamily: MONO,
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: ".5px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

// "Detalji" trigger, top-right of a card — a brighter border + stronger
// backing than the old version, which used the barely-visible COLORS.border
// (7% white) and read as a label rather than a clickable control over a
// dark product photo.
const cardDetailsBtnStyle: CSSProperties = {
  position: "absolute",
  top: "10px",
  right: "10px",
  zIndex: 5,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "5px 10px",
  borderRadius: "7px",
  border: "1px solid rgba(255,255,255,.4)",
  background: "rgba(7,8,12,.82)",
  backdropFilter: "blur(6px)",
  color: "#fff",
  fontFamily: MONO,
  fontSize: "9.5px",
  fontWeight: 600,
  letterSpacing: ".5px",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,.4)",
};

// G: "Usporedi" checkbox, sits in normal flow right under the image (not an
// absolutely-positioned corner chip — that real estate is already spoken for
// by the badges and Detalji)
const compareLabelStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  marginTop: "10px",
  cursor: "pointer",
  fontFamily: MONO,
  fontSize: "11px",
  color: COLORS.textMuted,
  userSelect: "none",
};
const compareCheckboxStyle: CSSProperties = {
  width: "13px",
  height: "13px",
  accentColor: COLORS.accent,
  cursor: "pointer",
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

export default function Builder({ products }: { products: ProductNode[] }) {
  // Suspense here is only to satisfy Next's requirement for useSearchParams()
  // inside BuilderContent — products are already resolved (passed in as a
  // prop, fetched server-side), so this fallback never meaningfully shows to
  // a real user. null avoids leaving loading-text artifacts in the streamed
  // SSR HTML that could misread as "still loading" to a raw curl/view-source check.
  return (
    <Suspense fallback={null}>
      <BuilderContent products={products} />
    </Suspense>
  );
}