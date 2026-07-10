// → put this at: components/LegalTodo.tsx
// Visually distinct callout marking legal copy that still needs lawyer sign-off
// before this page can go live. Never renders binding text of its own.
import { ReactNode } from "react";

export default function LegalTodo({ children }: { children: ReactNode }) {
  return (
    <div className="legal-todo">
      <b>⚠ {"{LAWYER: "}</b>
      {children}
      <b>{"}"}</b>
    </div>
  );
}
