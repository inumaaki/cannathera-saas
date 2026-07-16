"use client";

import { useState } from "react";

/* Button that explains a planned integration (M8/M9) instead of dead-clicking. */
export function PlannedNotice({
  label,
  notice,
  icon,
  primary = false,
}: Readonly<{ label: string; notice: string; icon?: string; primary?: boolean; module?: string }>) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          primary
            ? "flex h-11 items-center gap-1.5 rounded-lg bg-brand px-5 text-sm font-bold text-white hover:bg-pine"
            : "text-sm font-bold text-pine-600 hover:underline"
        }
      >
        {icon ? (
          <span aria-hidden className="msym text-[18px]">
            {icon}
          </span>
        ) : null}
        {label}
      </button>
      {open ? (
        <span
          role="status"
          className="absolute end-0 top-13 z-40 block w-72 rounded-xl border border-hairline bg-white p-4 text-sm leading-relaxed text-ink-strong shadow-lg"
        >
          {notice}
        </span>
      ) : null}
    </span>
  );
}
