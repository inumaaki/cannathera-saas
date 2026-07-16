"use client";

import { useRouter } from "@/i18n/navigation";

export function BackButton({ label }: Readonly<{ label: string }>) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink-strong"
    >
      <span aria-hidden className="msym text-[18px] rtl:-scale-x-100">
        arrow_back
      </span>
      {label}
    </button>
  );
}

/* Browser print dialog = paper or "Save as PDF" (server-rendered PDFs land with M7). */
export function PrintButton({ label }: Readonly<{ label: string }>) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-pine"
    >
      <span aria-hidden className="msym text-[18px]">
        print
      </span>
      {label}
    </button>
  );
}
