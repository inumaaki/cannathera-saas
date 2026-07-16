"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";
import { PasswordField, PrimaryButton } from "@/components/ui/fields";

const ROLE_HOME: Record<string, string> = {
  PATIENT: "/patient",
  DOCTOR: "/doctor",
  PHARMACY: "/pharmacy",
  ENTERPRISE: "/enterprise",
  ADMIN: "/admin",
};

export function SetPasswordForm() {
  const t = useTranslations("auth.setPassword");
  const f = useTranslations("auth.signup.fields");
  const te = useTranslations("auth.errors");
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: { password: form.get("password") },
      });
      const me = await api<{ role: string }>("/auth/me");
      // Hard navigation — server components must see the cleared mustChangePassword flag.
      window.location.assign(`/${locale}${ROLE_HOME[me.role] ?? "/"}`);
      return;
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "GENERIC";
      setError(te.has(code) ? te(code) : te("GENERIC"));
      setPending(false);
    }
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
