"use client";

import { useLocale } from "next-intl";
import { LOCALES, LOCALE_LABELS } from "@cannathera/shared";
import { useState, useRef, useEffect } from "react";

interface LocaleSwitcherProps {
  direction?: "up" | "down";
  align?: "left" | "right";
}

/* Premium custom locale selector. Full navigation (not client transition) so every
   server component re-renders in the new locale; query string is preserved. */
export function LocaleSwitcher({ direction = "down", align = "right" }: LocaleSwitcherProps) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function switchTo(next: string) {
    if (next === locale) {
      setIsOpen(false);
      return;
    }
    const url = new URL(window.location.href);
    const segments = url.pathname.split("/");
    if (LOCALES.includes(segments[1] as (typeof LOCALES)[number])) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    url.pathname = segments.join("/");
    window.location.assign(url.toString());
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const activeLabel = LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS] || locale;

  // Position classes based on direction and alignment
  const positionClasses = [
    direction === "up" ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top",
    align === "right" ? "right-0" : "left-0",
  ].join(" ");

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 bg-transparent text-sm font-semibold text-muted hover:text-ink-strong transition-colors uppercase outline-none focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{activeLabel}</span>
        <span
          aria-hidden
          className={`msym text-[16px] text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          keyboard_arrow_down
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-36 overflow-hidden rounded-xl border border-hairline bg-white py-1 shadow-lg
                     animate-in fade-in zoom-in-95 duration-100 ${positionClasses}`}
          role="menu"
        >
          {LOCALES.map((l) => {
            const isSelected = l === locale;
            const label = LOCALE_LABELS[l];
            return (
              <button
                key={l}
                type="button"
                onClick={() => switchTo(l)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer
                  ${
                    isSelected
                      ? "bg-pine-600 text-white"
                      : "text-ink-strong hover:bg-surface hover:text-pine-600"
                  }`}
                role="menuitem"
              >
                <span>{label}</span>
                {isSelected && (
                  <span aria-hidden className="msym text-[14px]">
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

