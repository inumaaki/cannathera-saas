"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";

const label = "block text-sm font-semibold text-ink-strong";
const input =
  "mt-1.5 h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20";

type Result = {
  patientId: string;
  patientRef: string | null;
  email: string;
  tempPassword: string;
};

export function CredentialRow({
  label: rowLabel,
  value,
  copyLabel,
  copiedLabel,
}: Readonly<{ label: string; value: string; copyLabel: string; copiedLabel: string }>) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-sage-900">{rowLabel}</p>
        <p className="truncate font-mono text-sm font-bold text-ink-strong">{value}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-pine-600 px-3 py-1.5 text-xs font-bold text-pine-600 hover:bg-mint/20"
      >
        <span aria-hidden className="msym text-[14px]">
          content_copy
        </span>
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

export function NewPatientForm() {
  const t = useTranslations("doctor.newPatient");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      const res = await api<Result>("/doctor/patients", {
        method: "POST",
        body: {
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: form.get("email"),
          dateOfBirth: form.get("dateOfBirth") || undefined,
        },
      });
      setResult(res);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "EMAIL_TAKEN"
          ? t("emailTaken")
          : t("emailTaken"),
      );
    } finally {
      setPending(false);
    }
  }

  if (result) {
    return (
      <div>
        <p className="flex items-center gap-2 rounded-lg bg-mint/25 px-4 py-3 font-bold text-pine">
          <span aria-hidden className="msym text-[20px]">
            check_circle
          </span>
          {t("successTitle")}
        </p>
        <p className="mt-3 text-sm text-muted">
          {t("patientRef")}: <strong className="font-mono text-ink-strong">{result.patientRef}</strong>
        </p>

        <h3 className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
          {t("credsTitle")}
        </h3>
        <div className="mt-2 space-y-2">
          <CredentialRow
            label={t("loginEmail")}
            value={result.email}
            copyLabel={t("copy")}
            copiedLabel={t("copied")}
          />
          <CredentialRow
            label={t("tempPassword")}
            value={result.tempPassword}
            copyLabel={t("copy")}
            copiedLabel={t("copied")}
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t("credsHint")}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setResult(null)}
            className="h-11 rounded-lg bg-brand px-5 font-bold text-white hover:bg-pine"
          >
            {t("createAnother")}
          </button>
          <Link
            href="/doctor/patients"
            className="flex h-11 items-center rounded-lg px-4 font-bold text-ink-strong hover:bg-surface"
          >
            {t("backToRoster")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <p role="alert" className="rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent-print">
          {error}
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="npFirst" className={label}>
            {t("firstName")}
          </label>
          <input id="npFirst" name="firstName" required className={input} />
        </div>
        <div>
          <label htmlFor="npLast" className={label}>
            {t("lastName")}
          </label>
          <input id="npLast" name="lastName" required className={input} />
        </div>
      </div>
      <div>
        <label htmlFor="npEmail" className={label}>
          {t("email")}
        </label>
        <input id="npEmail" name="email" type="email" required className={input} />
      </div>
      <div>
        <label htmlFor="npDob" className={label}>
          {t("dateOfBirth")}
        </label>
        <input id="npDob" name="dateOfBirth" type="date" className={input} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-bold text-white hover:bg-pine disabled:opacity-60"
      >
        <span aria-hidden className="msym text-[20px]">
          person_add
        </span>
        {t("submit")}
      </button>
    </form>
  );
}
