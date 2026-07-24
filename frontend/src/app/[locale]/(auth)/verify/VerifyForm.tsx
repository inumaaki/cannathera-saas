"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";
import { OtpInput } from "@/components/ui/OtpInput";
import { PrimaryButton } from "@/components/ui/fields";

const EXPOSE_DEV_AUTH_CODES =
  process.env.NEXT_PUBLIC_EXPOSE_DEV_AUTH_CODES === "true";

export function VerifyForm() {
  const t = useTranslations("auth.verify");
  const ta = useTranslations("auth");
  const te = useTranslations("auth.errors");
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Dev-only convenience: backend returns the 2FA code outside production.
  useEffect(() => {
    if (EXPOSE_DEV_AUTH_CODES) {
      setDevCode(sessionStorage.getItem("cannathera_dev_code"));
    } else {
      sessionStorage.removeItem("cannathera_dev_code");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const code = [0, 1, 2, 3, 4, 5].map((i) => form.get(`code-${i}`) ?? "").join("");
    setPending(true);
    setError(null);
    try {
      const res = await api<{ user: { role: string }; home: string }>(
        "/auth/verify",
        { method: "POST", body: { code } },
      );
      sessionStorage.removeItem("cannathera_dev_code");
      // Hard navigation so server components render with the NEW session cookie
      // (client router.push can re-render with the stale cookie → wrong account).
      window.location.assign(`/${locale}${res.home}`);
      return;
    } catch (err) {
      const codeKey = err instanceof ApiError ? err.code : "GENERIC";
      setError(te.has(codeKey) ? te(codeKey) : te("GENERIC"));
      setPending(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      const res = await api<{ sent: boolean; devCode?: string }>("/auth/resend", {
        method: "POST",
      });
      if (EXPOSE_DEV_AUTH_CODES && res.devCode) {
        sessionStorage.setItem("cannathera_dev_code", res.devCode);
        setDevCode(res.devCode);
      }
    } catch (err) {
      const codeKey = err instanceof ApiError ? err.code : "GENERIC";
      setError(te.has(codeKey) ? te(codeKey) : te("GENERIC"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      {EXPOSE_DEV_AUTH_CODES && devCode ? (
        <p className="mx-auto mb-4 max-w-md rounded-lg bg-mint/20 px-4 py-2 text-center text-sm text-pine">
          {ta("devCodeHint", { code: devCode })}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mx-auto mb-4 max-w-md rounded-lg border border-accent/40 bg-accent/5 px-4 py-2 text-center text-sm text-accent-print"
        >
          {error}
        </p>
      ) : null}

      <OtpInput />
      <div className="mx-auto mt-6 max-w-md">
        <PrimaryButton disabled={pending}>{t("submit")}</PrimaryButton>
      </div>
      <button
        type="button"
        className="mx-auto mt-4 flex items-center gap-2 font-semibold text-pine-600 hover:underline"
        onClick={handleResend}
      >
        <span aria-hidden className="msym text-[18px]">
          refresh
        </span>
        {t("resend")}
      </button>
    </form>
  );
}
