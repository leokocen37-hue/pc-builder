"use client";

import { useEffect } from "react";

/**
 * Keeps the 404 tab title.
 *
 * The served HTML carries the right <title> — a crawler sees it — but after
 * hydration the App Router restores the root segment's metadata, so the tab
 * reverts to the homepage title. That is what a person reading their tab bar,
 * or a screen reader announcing the page, actually gets.
 */
export default function NotFoundTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
}
