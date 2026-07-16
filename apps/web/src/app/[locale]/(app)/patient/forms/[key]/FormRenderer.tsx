"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { evaluateCondition, type Condition } from "@cannathera/shared";
import { Link } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";

export type Question = {
  key: string;
  type:
    | "TEXT"
    | "TEXTAREA"
    | "NUMBER"
    | "BOOLEAN"
    | "SINGLE_CHOICE"
    | "MULTI_CHOICE"
    | "SCALE"
    | "DATE"
    | "DOSAGE";
  label: string;
  helpText: string | null;
  required: boolean;
  config: { min?: number; max?: number; step?: number; unit?: string } | null;
  showIf: unknown;
  options: Array<{ value: string; label: string }>;
};

export type Structure = {
  key: string;
  version: number;
  title: string;
  description: string | null;
  sections: Array<{ key: string; title: string; questions: Question[] }>;
};

type Answers = Record<string, unknown>;

/* Renders any DB-defined questionnaire: conditional visibility (showIf),
   required validation, all question types. New forms need zero code changes. */
export function FormRenderer({ structure }: Readonly<{ structure: Structure }>) {
  const t = useTranslations("patient.forms");
  const locale = useLocale();
  const [answers, setAnswers] = useState<Answers>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState<string | null>(null);
  const [result, setResult] = useState<{ redFlags: unknown[] } | null>(null);

  const set = (key: string, value: unknown) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setMissingKey((k) => (k === key ? null : k));
  };

  const visible = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const s of structure.sections)
      for (const q of s.questions)
        map.set(
          q.key,
          !q.showIf || evaluateCondition(q.showIf as Condition, answers),
        );
    return map;
  }, [structure, answers]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Client-side required check (server re-validates).
    for (const s of structure.sections) {
      for (const q of s.questions) {
        const v = answers[q.key];
        if (
          q.required &&
          visible.get(q.key) &&
          (v === undefined || v === null || v === "")
        ) {
          // Name the question and jump to it — a bare "field missing" on a long
          // form leaves the patient hunting for what they skipped.
          setMissingKey(q.key);
          setError(t("missingField", { field: q.label }));
          document
            .getElementById(`q-${q.key}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }
    }
    setPending(true);
    setError(null);
    setMissingKey(null);
    try {
      const res = await api<{ submissionId: string; redFlags: unknown[] }>(
        `/questionnaires/${structure.key}/submissions?locale=${locale}`,
        { method: "POST", body: { answers } },
      );
      setResult(res);
    } catch (err) {
      // A server failure is not a missing field — say what actually went wrong.
      const code = err instanceof ApiError ? err.code : "GENERIC";
      setError(t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.GENERIC"));
      setPending(false);
    }
  }

  if (result) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
        <span
          aria-hidden
          className="msym flex size-16 items-center justify-center rounded-full bg-mint/40 text-[36px] text-pine-600"
        >
          check_circle
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold text-pine">
          {t("successTitle")}
        </h1>
        <p className="mt-2 max-w-xs text-muted">{t("successText")}</p>
        {result.redFlags.length > 0 ? (
          <p className="mt-5 max-w-sm rounded-xl bg-[#fdf3d7] px-4 py-3 text-sm text-sage-900">
            {t("redFlagNotice")}
          </p>
        ) : null}
        <Link
          href="/patient/forms"
          className="mt-8 flex h-12 items-center justify-center rounded-xl bg-pine-600 px-6 font-bold text-white"
        >
          {t("backToForms")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="font-display text-3xl font-bold text-pine">{structure.title}</h1>
      {structure.description ? (
        <p className="mt-1 text-muted">{structure.description}</p>
      ) : null}

      {structure.sections.map((s) => {
        const shown = s.questions.filter((q) => visible.get(q.key));
        if (!shown.length) return null;
        return (
          <section key={s.key} className="cw-watermark mt-5 rounded-2xl border border-hairline bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
              {s.title}
            </h2>
            <div className="mt-4 space-y-6">
              {shown.map((q) => (
                <QuestionField
                  key={q.key}
                  question={q}
                  value={answers[q.key]}
                  onChange={(v) => set(q.key, v)}
                  missing={missingKey === q.key}
                  requiredLabel={t("required")}
                  unsetLabel={t("unset")}
                  yesLabel={t("yes")}
                  noLabel={t("no")}
                  multiHint={t("selectAll")}
                />
              ))}
            </div>
          </section>
        );
      })}

      {error ? (
        <p role="alert" className="mt-4 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent-print">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-pine-600 text-base font-bold text-white disabled:opacity-60"
      >
        <span aria-hidden className="msym text-[20px]">
          send
        </span>
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

function QuestionField({
  question: q,
  value,
  onChange,
  missing,
  requiredLabel,
  unsetLabel,
  yesLabel,
  noLabel,
  multiHint,
}: Readonly<{
  question: Question;
  value: unknown;
  onChange: (v: unknown) => void;
  missing: boolean;
  requiredLabel: string;
  unsetLabel: string;
  yesLabel: string;
  noLabel: string;
  multiHint: string;
}>) {
  const cfg = q.config ?? {};
  const inputBase =
    "w-full rounded-lg border border-hairline bg-white px-4 text-base text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20";

  return (
    <div
      id={`q-${q.key}`}
      className={
        missing
          ? "-mx-3 rounded-xl border-s-4 border-accent-print bg-accent/5 px-3 py-2"
          : undefined
      }
    >
      <p className="font-bold text-ink-strong">
        {q.label}
        {q.required ? (
          <span className="ms-1 align-super text-xs text-accent" title={requiredLabel}>
            *
          </span>
        ) : null}
      </p>
      {q.helpText ? <p className="mt-0.5 text-sm text-muted">{q.helpText}</p> : null}
      {q.type === "MULTI_CHOICE" ? (
        <p className="mt-0.5 text-xs text-muted">{multiHint}</p>
      ) : null}

      <div className="mt-3">
        {q.type === "TEXT" ? (
          <input
            className={`${inputBase} h-12`}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : null}

        {q.type === "TEXTAREA" ? (
          <textarea
            rows={3}
            className={`${inputBase} py-3`}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : null}

        {q.type === "NUMBER" || q.type === "DOSAGE" ? (
          <div className="relative">
            <input
              type="number"
              min={cfg.min}
              max={cfg.max}
              step={cfg.step ?? 1}
              className={`${inputBase} h-12 ${cfg.unit ? "pe-12" : ""}`}
              value={value === undefined || value === null ? "" : String(value)}
              onChange={(e) =>
                onChange(e.target.value === "" ? undefined : Number(e.target.value))
              }
            />
            {cfg.unit ? (
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                {cfg.unit}
              </span>
            ) : null}
          </div>
        ) : null}

        {q.type === "DATE" ? (
          <input
            type="date"
            className={`${inputBase} h-12`}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : null}

        {q.type === "BOOLEAN" ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: true, label: yesLabel },
              { v: false, label: noLabel },
            ].map(({ v, label }) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => onChange(v)}
                className={`h-12 rounded-lg border font-semibold transition-colors ${
                  value === v
                    ? "border-pine-600 bg-mint/30 text-pine"
                    : "border-hairline bg-white text-ink-strong"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {q.type === "SINGLE_CHOICE" ? (
          <div className="space-y-2">
            {q.options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-start transition-colors ${
                  value === o.value
                    ? "border-pine-600 bg-mint/20"
                    : "border-hairline bg-white"
                }`}
              >
                <span
                  aria-hidden
                  className={`size-4 shrink-0 rounded-full border-2 ${
                    value === o.value ? "border-pine-600 bg-pine-600" : "border-hairline"
                  }`}
                />
                <span className="text-ink-strong">{o.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        {q.type === "MULTI_CHOICE" ? (
          <div className="space-y-2">
            {q.options.map((o) => {
              const arr = Array.isArray(value) ? (value as string[]) : [];
              const checked = arr.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() =>
                    onChange(
                      checked ? arr.filter((v) => v !== o.value) : [...arr, o.value],
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-start transition-colors ${
                    checked ? "border-pine-600 bg-mint/20" : "border-hairline bg-white"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`msym flex size-5 shrink-0 items-center justify-center rounded border text-[16px] ${
                      checked
                        ? "border-pine-600 bg-pine-600 text-white"
                        : "border-hairline text-transparent"
                    }`}
                  >
                    check
                  </span>
                  <span className="text-ink-strong">{o.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {q.type === "SCALE" ? (
          /* The knob has to sit somewhere, so an untouched slider used to LOOK
             answered (parked at the midpoint) while the answer was still empty —
             the form then refused to submit with no visible reason. We never
             auto-fill a clinical score the patient did not choose, so instead the
             control renders as visibly unset until it is actually used. */
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{cfg.min ?? 0}</span>
              {typeof value === "number" ? (
                <span className="text-lg font-bold text-pine-600">{value}</span>
              ) : (
                <span className="text-sm font-semibold text-accent-print">
                  {unsetLabel}
                </span>
              )}
              <span className="text-sm text-muted">{cfg.max ?? 10}</span>
            </div>
            <input
              type="range"
              min={cfg.min ?? 0}
              max={cfg.max ?? 10}
              step={cfg.step ?? 1}
              value={
                typeof value === "number"
                  ? value
                  : Math.round(((cfg.max ?? 10) + (cfg.min ?? 0)) / 2)
              }
              // A click anywhere on the track counts as an answer, so the value
              // shown under the knob is always the value that gets submitted.
              onChange={(e) => onChange(Number(e.target.value))}
              onPointerDown={() => {
                if (typeof value !== "number") {
                  onChange(Math.round(((cfg.max ?? 10) + (cfg.min ?? 0)) / 2));
                }
              }}
              aria-label={q.label}
              aria-valuetext={typeof value === "number" ? String(value) : unsetLabel}
              className={`mt-1 w-full accent-(--color-orange-500) ${
                typeof value === "number" ? "" : "opacity-50 grayscale"
              }`}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
