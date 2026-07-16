"use client";

import { useRef } from "react";

/* 6-digit code input, grouped 3–3 with a dash (Figma 3.2). */
export function OtpInput({ name = "code" }: Readonly<{ name?: string }>) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function handleInput(index: number, value: string) {
    if (value && index < 5) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    digits.split("").forEach((d, i) => {
      const el = refs.current[i];
      if (el) el.value = d;
    });
    refs.current[Math.min(digits.length, 5)]?.focus();
  }

  const box = (index: number) => (
    <input
      key={index}
      ref={(el) => {
        refs.current[index] = el;
      }}
      name={`${name}-${index}`}
      inputMode="numeric"
      maxLength={1}
      autoComplete={index === 0 ? "one-time-code" : "off"}
      onInput={(e) => handleInput(index, e.currentTarget.value)}
      onKeyDown={(e) => handleKeyDown(index, e)}
      onPaste={handlePaste}
      className="h-11 w-full min-w-0 max-w-12 rounded-lg border border-hairline bg-white
                 text-center text-xl font-semibold text-ink-strong outline-none
                 focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20 sm:h-12"
    />
  );

  return (
    <div dir="ltr" className="flex w-full items-center justify-center gap-1.5 sm:gap-2.5">
      {[0, 1, 2].map(box)}
      <span aria-hidden className="shrink-0 px-0.5 text-muted">
        –
      </span>
      {[3, 4, 5].map(box)}
    </div>
  );
}
