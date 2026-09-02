"use client";

import { useState, useRef, useEffect } from "react";

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-full w-full items-center justify-between outline-none"
      >
        <span className={`truncate text-left ${selected ? "text-ink-strong" : "text-muted"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span aria-hidden className="msym text-muted shrink-0 ms-2">
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[99] mt-1 w-full rounded-lg border border-hairline bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto rounded-lg">
            <button
              type="button"
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#f6f8fc] ${
                value === "" ? "bg-mint/10 text-pine-600 font-semibold" : "text-ink-strong"
              }`}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {placeholder}
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#f6f8fc] ${
                  value === opt.value
                    ? "bg-mint/10 text-pine-600 font-semibold"
                    : "text-ink-strong"
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
