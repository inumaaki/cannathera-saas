"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";
import { PrimaryButton, TextField } from "@/components/ui/fields";

export function ForgotForm() {
  const t = useTranslations("auth.forgot");
  const tl = useTranslations("auth.login");
  const te = useTranslations("auth.errors");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      const res = await api<{ sent: boolean; devToken?: string }>(
        "/auth/forgot-password",
        { method: "POST", body: { email: form.get("email") } },
      );
      setDevToken(res.devToken ?? null);
      setSent(true);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "GENERIC";
      setError(te.has(code) ? te(code) : te("GENERIC"));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6">
        <p className="rounded-lg bg-mint/20 px-4 py-3 text-center text-sm text-pine">
          {t("sent")}
        </p>
        {devToken ? (
          <p className="mt-4 break-all rounded-lg border border-hairline bg-surface px-4 py-3 text-center text-sm text-muted">
            {t("devLink")}{" "}
            <Link
              href={`/reset-password?token=${encodeURIComponent(devToken)}`}
              className="font-bold text-pine-600 hover:underline"
            >
              /reset-password
            </Link>
          </p>
        ) : null}
        <p className="mt-6 text-center">
          <Link href="/login" className="font-bold text-pine-600 hover:underline">
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent-print"
        >
          {error}
        </p>
      ) : null}
      <TextField
        label={tl("emailLabel")}
        type="email"
        name="email"
        required
        placeholder={tl("emailPlaceholder")}
        autoComplete="email"
        icon="mail"
      />
      <PrimaryButton arrow disabled={pending}>
        {t("submit")}
      </PrimaryButton>
      <p className="text-center">
        <Link href="/login" className="text-sm font-bold text-pine-600 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
