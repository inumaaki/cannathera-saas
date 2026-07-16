"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";
import { PasswordField, PrimaryButton } from "@/components/ui/fields";

export function ResetForm({ token }: Readonly<{ token: string }>) {
  const t = useTranslations("auth.reset");
  const f = useTranslations("auth.signup.fields");
  const te = useTranslations("auth.errors");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: { token, password: form.get("password") },
      });
      setDone(true);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "GENERIC";
      setError(te.has(code) ? te(code) : te("GENERIC"));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6">
        <p className="rounded-lg bg-mint/20 px-4 py-3 text-center text-sm text-pine">
          {t("success")}
        </p>
        <p className="mt-6 text-center">
          <Link href="/login" className="font-bold text-pine-600 hover:underline">
            {t("toLogin")}
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
      <PasswordField
        label={t("newPassword")}
        name="password"
        required
        placeholder={f("passwordPlaceholder")}
        autoComplete="new-password"
      />
      <PrimaryButton arrow disabled={pending}>
        {t("submit")}
      </PrimaryButton>
    </form>
  );
}
