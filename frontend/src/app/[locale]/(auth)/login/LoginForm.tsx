"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";
import {
  CheckboxField,
  PasswordField,
  PrimaryButton,
  TextField,
} from "@/components/ui/fields";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const te = useTranslations("auth.errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      const res = await api<{
        requires2fa: boolean;
        devCode?: string;
        home?: string;
      }>(
        "/auth/login",
        {
          method: "POST",
          body: {
            email: form.get("email"),
            password: form.get("password"),
            remember: form.get("remember") === "on",
          },
        },
      );
      // The org can switch 2FA off — then login is already complete and there is
      // no code to enter. Hard navigation so server components see the new cookie.
      if (!res.requires2fa && res.home) {
        window.location.assign(res.home);
        return;
      }
      sessionStorage.removeItem("cannathera_dev_code");
      if (
        process.env.NEXT_PUBLIC_EXPOSE_DEV_AUTH_CODES === "true" &&
        res.devCode
      ) {
        sessionStorage.setItem("cannathera_dev_code", res.devCode);
      }
      router.push("/verify");
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
      <TextField
        label={t("emailLabel")}
        type="email"
        name="email"
        required
        placeholder={t("emailPlaceholder")}
        autoComplete="email"
        icon="mail"
      />
      <PasswordField
        label={t("passwordLabel")}
        name="password"
        required
        placeholder="••••••••"
        labelEnd={
          <Link
            href="/forgot-password"
            className="text-sm font-bold text-pine-600 hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        }
      />
      <CheckboxField name="remember">{t("rememberMe")}</CheckboxField>
      <PrimaryButton arrow disabled={pending}>
        {t("submit")}
      </PrimaryButton>
    </form>
  );
}
