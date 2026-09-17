"use client";

import { useId } from "react";
import { useCart } from "@/lib/cart";

/**
 * The single point in the whole storefront where the buyer is shown, and
 * accepts, the legal terms. Product pages and the configurator say nothing
 * about the right of withdrawal — it is all folded into this one line, right
 * above the button that leads to checkout.
 *
 * Rendered in two places (the cart drawer and /kosarica) but backed by one
 * piece of cart state, so a tick in the drawer carries over to the cart page
 * and the buyer is never asked twice for the same order.
 *
 * The wording is kept here, in one copy, so the two renders can never drift
 * apart — what is recorded on the order as _uvjeti_verzija has to correspond
 * to a single known text.
 */
export default function TermsAcceptance({ showHint = false }: { showHint?: boolean }) {
  const { termsAccepted, setTermsAccepted } = useCart();
  const id = useId();
  const hintId = `${id}-hint`;

  // Opened in a new tab so nobody loses a filled cart to reading the terms.
  const link = { target: "_blank", rel: "noopener" } as const;

  return (
    <div className="kos-terms-wrap">
      <div className="kos-terms">
        <input
          id={id}
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          aria-describedby={showHint ? hintId : undefined}
          aria-invalid={showHint || undefined}
        />
        <label htmlFor={id}>
          Pročitao/la sam i prihvaćam <a href="/uvjeti" {...link}>Uvjete poslovanja</a>,{" "}
          <a href="/privatnost" {...link}>Politiku privatnosti</a> i{" "}
          <a href="/raskid" {...link}>Pravo na jednostrani raskid</a> te{" "}
          <a href="/raskid#iznimke" {...link}>njegove iznimke</a>.
        </label>
      </div>
      {showHint && (
        <p className="kos-terms-hint" id={hintId} role="alert">
          Za nastavak potvrdite da prihvaćate uvjete.
        </p>
      )}
    </div>
  );
}
