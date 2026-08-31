"use client";

// Small reusable "print / save as PDF" trigger — window.print() with the
// browser's own "Save as PDF" destination covers the spec's PDF-download
// requirement without adding a PDF-generation dependency. The page itself
// stays plain, selectable, indexable HTML either way (spec section 4).
export default function PrintButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {children}
    </button>
  );
}
