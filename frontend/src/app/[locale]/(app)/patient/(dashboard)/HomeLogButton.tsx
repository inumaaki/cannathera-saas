"use client";

import { useState } from "react";
import { QuickLogSheet } from "@/components/patient/QuickLogSheet";

/* Orange "Log today's dose" CTA (Figma 6-385) — opens the Quick Log sheet. */
export function HomeLogButton({ label }: Readonly<{ label: string }>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl
                   bg-accent text-base font-bold text-white hover:bg-accent-print"
      >
        {label}
        <span aria-hidden className="msym rtl:-scale-x-100">
          arrow_forward
        </span>
      </button>
      <QuickLogSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
