import type { Metadata } from "next";

// standalone HTML tool embedded via iframe — no crawlable content of its own
export const metadata: Metadata = {
  title: "Kalkulator",
  robots: { index: false, follow: false },
};

export default function KalkulatorPage() {
  return (
    <iframe
      src="/kalkulator2.html"
      style={{ width: "100%", height: "100vh", border: "none" }}
    />
  );
}
