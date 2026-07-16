"use client";

import { useId, useState } from "react";

/* Form primitives matching Figma auth screens (3.1–3.3):
   uppercase 12px/600 labels, 56px inputs, 8px radius, #d9d9d9 borders. */

type BaseProps = {
  label: string;
  placeholder?: string;
  required?: boolean;
  name?: string;
  autoComplete?: string;
  /** Optional element rendered at the end of the label row (e.g. forgot-password link) */
  labelEnd?: React.ReactNode;
};

export function FieldLabel({
  htmlFor,
  children,
  end,
}: Readonly<{ htmlFor: string; children: React.ReactNode; end?: React.ReactNode }>) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-strong"
      >
        {children}
      </label>
      {end}
    </div>
  );
}

const inputClass =
  "w-full h-12 rounded-lg border border-hairline bg-white px-4 text-base text-ink-strong " +
  "placeholder:text-muted/70 outline-none transition-colors " +
  "focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20";

export function TextField({
  label,
  placeholder,
  required,
  name,
  autoComplete,
  labelEnd,
  type = "text",
  icon,
}: Readonly<BaseProps & { type?: string; icon?: string }>) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id} end={labelEnd}>
        {label}
      </FieldLabel>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${inputClass} ${icon ? "pe-12" : ""}`}
        />
        {icon ? (
          <span
            aria-hidden
            className="msym absolute end-4 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none"
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function PasswordField({
  label,
  placeholder,
  required,
  name,
  autoComplete = "current-password",
  labelEnd,
}: Readonly<BaseProps>) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <FieldLabel htmlFor={id} end={labelEnd}>
        {label}
      </FieldLabel>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${inputClass} pe-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute end-4 top-1/2 -translate-y-1/2 text-muted/80 hover:text-ink-strong"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <span aria-hidden className="msym">
            {visible ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </div>
  );
}

export function CheckboxField({
  children,
  name,
  required,
}: Readonly<{ children: React.ReactNode; name?: string; required?: boolean }>) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
      <input
        id={id}
        name={name}
        type="checkbox"
        required={required}
        className="mt-0.5 size-5 shrink-0 rounded border-hairline text-pine-600 accent-(--color-pine-600)"
      />
      <span className="text-base text-ink-strong">{children}</span>
    </label>
  );
}

export function PrimaryButton({
  children,
  type = "submit",
  arrow = false,
  disabled = false,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  type?: "submit" | "button";
  arrow?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}>) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-12 rounded-lg bg-pine-600 text-white text-base font-bold
                 flex items-center justify-center gap-2 transition-colors
                 hover:bg-pine focus-visible:ring-2 focus-visible:ring-pine-600/40
                 disabled:opacity-60 disabled:pointer-events-none"
    >
      {children}
      {arrow ? (
        <span aria-hidden className="msym rtl:-scale-x-100">
          arrow_forward
        </span>
      ) : null}
    </button>
  );
}
