"use client";

import { useEffect, useMemo, useState } from "react";
import { shopifyFetch } from "@/lib/shopify";

type ProductNode = {
  id: string;
  title: string;
  variants: { edges: { node: { id: string; price: { amount: string } } }[] };

  pcfType?: { value: string } | null;
  pcfBrand?: { value: string } | null;
  pcfSocket?: { value: string } | null;
  pcfTdp?: { value: string } | null;
  pcfRamType?: { value: string } | null;
  pcfFormFactor?: { value: string } | null;
  pcfGpuLength?: { value: string } | null;
  pcfSupportedFormFactors?: { value: string } | null;
  pcfMaxGpuLength?: { value: string } | null;
  pcfMaxCoolerHeight?: { value: string } | null;
  pcfWattage?: { value: string } | null;
  pcfCoolerHeight?: { value: string } | null;
  pcfMaxTdp?: { value: string } | null;
};

type Step =
  | "brand"
  | "cpu"
  | "motherboard"
  | "ram"
  | "gpu"
  | "case"
  | "psu"
  | "cooler"
  | "review";

export default function Builder() {
  const [step, setStep] = useState<Step>("brand");
  const [products, setProducts] = useState<ProductNode[]>([]);

  const [brand, setBrand] = useState<string | null>(null);
  const [cpu, setCpu] = useState<ProductNode | null>(null);
  const [mb, setMb] = useState<ProductNode | null>(null);
  const [ram, setRam] = useState<ProductNode | null>(null);
  const [gpu, setGpu] = useState<ProductNode | null>(null);
  const [pcCase, setPcCase] = useState<ProductNode | null>(null);
  const [psu, setPsu] = useState<ProductNode | null>(null);
  const [cooler, setCooler] = useState<ProductNode | null>(null);

  useEffect(() => {
    (async () => {
      const data = await shopifyFetch<any>(`
        query {
          products(first: 250) {
            edges {
              node {
                id
                title
                variants(first: 1) {
                  edges { node { id price { amount } } }
                }
                pcfType: metafield(namespace: "pcf", key: "type") { value }
                pcfBrand: metafield(namespace: "pcf", key: "brand") { value }
                pcfSocket: metafield(namespace: "pcf", key: "socket") { value }
                pcfTdp: metafield(namespace: "pcf", key: "tdp") { value }
                pcfRamType: metafield(namespace: "pcf", key: "ram_type") { value }
                pcfFormFactor: metafield(namespace: "pcf", key: "form_factor") { value }
                pcfGpuLength: metafield(namespace: "pcf", key: "gpu_length") { value }
                pcfSupportedFormFactors: metafield(namespace: "pcf", key: "supported_form_factors") { value }
                pcfMaxGpuLength: metafield(namespace: "pcf", key: "max_gpu_length") { value }
                pcfMaxCoolerHeight: metafield(namespace: "pcf", key: "max_cooler_height") { value }
                pcfWattage: metafield(namespace: "pcf", key: "wattage") { value }
                pcfCoolerHeight: metafield(namespace: "pcf", key: "cooler_height") { value }
                pcfMaxTdp: metafield(namespace: "pcf", key: "max_tdp") { value }
              }
            }
          }
        }
      `);

      setProducts(data.products.edges.map((e: any) => e.node));
    })();
  }, []);

  // ================= FILTERS =================

  const cpus = products.filter(
    (p) => p.pcfType?.value === "cpu" && p.pcfBrand?.value === brand
  );

  const motherboards = products.filter(
    (p) =>
      p.pcfType?.value === "motherboard" &&
      p.pcfSocket?.value === cpu?.pcfSocket?.value
  );

  const rams = products.filter(
    (p) =>
      p.pcfType?.value === "ram" &&
      p.pcfRamType?.value === mb?.pcfRamType?.value
  );

  const gpus = products.filter((p) => p.pcfType?.value === "gpu");

  const cases = products.filter((p) => {
    if (p.pcfType?.value !== "case" || !mb) return false;
    const supported =
      p.pcfSupportedFormFactors?.value
        ?.split(",")
        .map((s) => s.trim().toLowerCase()) || [];
    return supported.includes((mb.pcfFormFactor?.value || "").toLowerCase());
  });

  const psus = products.filter((p) => {
    if (p.pcfType?.value !== "psu" || !cpu || !gpu) return false;
    const required =
      Number(cpu.pcfTdp?.value || 0) +
      Number(gpu.pcfTdp?.value || 0) +
      150;
    return Number(p.pcfWattage?.value || 0) >= required;
  });

  const coolers = products.filter((p) => {
    if (p.pcfType?.value !== "cooler" || !cpu || !pcCase) return false;

    const sockets =
      p.pcfSocket?.value
        ?.split(",")
        .map((s) => s.trim().toLowerCase()) || [];

    const fitsSocket = sockets.includes(
      (cpu.pcfSocket?.value || "").toLowerCase()
    );

    const fitsHeight =
      Number(p.pcfCoolerHeight?.value || 0) <=
      Number(pcCase.pcfMaxCoolerHeight?.value || 0);

    const fitsTdp =
      Number(p.pcfMaxTdp?.value || 0) >=
      Number(cpu.pcfTdp?.value || 0);

    return fitsSocket && fitsHeight && fitsTdp;
  });

  // ================= UTIL =================

  function totalPrice() {
    const all = [cpu, mb, ram, gpu, pcCase, psu, cooler];
    return all.reduce(
      (sum, p) =>
        sum +
        Number(p?.variants.edges[0]?.node.price.amount || 0),
      0
    );
  }

  function renderList(
    list: ProductNode[],
    setter: (p: ProductNode) => void,
    next: Step,
    backStep?: Step
  ) {
    if (!list.length) {
      return (
        <div>
          <h3>No compatible options found.</h3>
          <p>Please go back and change previous selections.</p>
          {backStep && (
            <button onClick={() => setStep(backStep)}>Go Back</button>
          )}
        </div>
      );
    }

    return (
      <div>
        {list.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setter(p);
              setStep(next);
            }}
            style={{
              display: "block",
              marginBottom: 10,
              padding: 10,
              width: "100%",
            }}
          >
            {p.title} — €
            {p.variants.edges[0].node.price.amount}
          </button>
        ))}
      </div>
    );
  }

  // ================= UI =================

  return (
    <div style={{ padding: 20 }}>
      {step === "brand" && (
        <>
          <h2>Select CPU Brand</h2>
          <button onClick={() => { setBrand("intel"); setStep("cpu"); }}>
            Intel
          </button>
          <button onClick={() => { setBrand("amd"); setStep("cpu"); }}>
            AMD
          </button>
        </>
      )}

      {step === "cpu" &&
        renderList(cpus, setCpu, "motherboard", "brand")}

      {step === "motherboard" &&
        renderList(motherboards, setMb, "ram", "cpu")}

      {step === "ram" &&
        renderList(rams, setRam, "gpu", "motherboard")}

      {step === "gpu" &&
        renderList(gpus, setGpu, "case", "ram")}

      {step === "case" &&
        renderList(cases, setPcCase, "psu", "gpu")}

      {step === "psu" &&
        renderList(psus, setPsu, "cooler", "case")}

      {step === "cooler" &&
        renderList(coolers, setCooler, "review", "psu")}

      {step === "review" && (
        <>
          <h2>Review</h2>
          <p>Total: €{totalPrice()}</p>
        </>
      )}
    </div>
  );
}