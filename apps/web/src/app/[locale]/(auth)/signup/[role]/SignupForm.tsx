"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { LOCALES, LOCALE_LABELS } from "@cannathera/shared";
import { api, ApiError } from "@/lib/api";
import {
  CheckboxField,
  FieldLabel,
  PasswordField,
  PrimaryButton,
  TextField,
} from "@/components/ui/fields";

import type { SignupRole } from "./roles";

const selectClass =
  "w-full h-12 rounded-lg border border-hairline bg-white px-4 text-base text-ink-strong " +
  "outline-none transition-colors focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20";

function ProgressHeader({
  title,
  step,
}: Readonly<{ title: string; step: 1 | 2 }>) {
  const t = useTranslations("auth.signup");
  return (
    <div className="mt-7">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink-strong">{title}</h1>
        <span className="shrink-0 text-sm text-muted">
          {t("step", { current: step, total: 2 })}
        </span>
      </div>
      <div className="mt-4 h-1 rounded-full bg-hairline" aria-hidden>
        <div
          className="h-full rounded-full bg-pine-600 transition-all"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>
    </div>
  );
}

export function SignupForm({ role }: Readonly<{ role: SignupRole }>) {
  const t = useTranslations("auth.signup");
  const f = useTranslations("auth.signup.fields");
  const tc = useTranslations("common");
  const te = useTranslations("auth.errors");
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [account, setAccount] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Persist step-1 values in state — the step-2 form replaces this DOM.
    const form = new FormData(e.currentTarget);
    setAccount({
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const roleData: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
      roleData[key] = value === "on" ? true : String(value);
    }
    setPending(true);
    setError(null);
    try {
      const res = await api<{ requires2fa: boolean; devCode?: string }>(
        "/auth/register",
        {
          method: "POST",
          body: { role, ...account, roleData },
        },
      );
      if (res.devCode) sessionStorage.setItem("cannathera_dev_code", res.devCode);
      router.push("/verify");
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "GENERIC";
      setError(te.has(code) ? te(code) : te("GENERIC"));
      setPending(false);
    }
  }

  return (
    <>
      <ProgressHeader title={t(`titles.${role}`)} step={step} />

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent-print"
        >
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <form onSubmit={handleStep1} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={f("firstName")}
              name="firstName"
              required
              placeholder={f("firstNamePlaceholder")}
              autoComplete="given-name"
            />
            <TextField
              label={f("lastName")}
              name="lastName"
              required
              placeholder={f("lastNamePlaceholder")}
              autoComplete="family-name"
            />
          </div>
          <TextField
            label={f("email")}
            type="email"
            name="email"
            required
            placeholder={f("emailPlaceholder")}
            autoComplete="email"
          />
          <PasswordField
            label={f("password")}
            name="password"
            required
            placeholder={f("passwordPlaceholder")}
            autoComplete="new-password"
          />
          <CheckboxField name="terms" required>
            {t.rich("terms", {
              terms: (chunks) => (
                <a href="#terms" className="text-pine-600 hover:underline">
                  {chunks}
                </a>
              ),
              privacy: (chunks) => (
                <a href="#privacy" className="text-pine-600 hover:underline">
                  {chunks}
                </a>
              ),
            })}
          </CheckboxField>
          <PrimaryButton arrow>
            {role === "patient" ? t("continueToPlan") : tc("continue")}
          </PrimaryButton>

          <p className="text-center text-ink-strong">
            {t("haveAccount")}{" "}
            <Link href="/login" className="font-bold text-pine-600 hover:underline">
              {t("loginLink")}
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleStep2} className="mt-6 space-y-4">
          {role === "patient" && (
            <>
              <TextField
                label={f("dateOfBirth")}
                type="date"
                name="dateOfBirth"
                required
                autoComplete="bday"
              />
              <div>
                <FieldLabel htmlFor="preferredLanguage">
                  {f("preferredLanguage")}
                </FieldLabel>
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  className={selectClass}
                  defaultValue="de"
                >
                  {LOCALES.map((l) => (
                    <option key={l} value={l}>
                      {LOCALE_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>

              <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
                <h2 className="font-bold text-ink-strong">{t("consents.title")}</h2>
                <p className="mt-1 text-sm text-muted">{t("consents.subtitle")}</p>
                <div className="mt-5 space-y-4">
                  <CheckboxField name="consentArt9" required>
                    {t("consents.art9")}{" "}
                    <span className="text-sm text-accent">
                      ({t("consents.required")})
                    </span>
                  </CheckboxField>
                  <CheckboxField name="consentShareDoctor">
                    {t("consents.shareDoctor")}
                  </CheckboxField>
                </div>
              </section>
            </>
          )}

          {role === "doctor" && (
            <>
              <TextField
                label={f("practiceName")}
                name="practiceName"
                required
                placeholder={f("practiceNamePlaceholder")}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={f("lanr")}
                  name="lanr"
                  required
                  placeholder={f("lanrPlaceholder")}
                />
                <TextField
                  label={f("bsnr")}
                  name="bsnr"
                  required
                  placeholder={f("bsnrPlaceholder")}
                />
              </div>
              <TextField
                label={f("specialty")}
                name="specialty"
                required
                placeholder={f("specialtyPlaceholder")}
              />
              <TextField
                label={f("phone")}
                type="tel"
                name="phone"
                placeholder={f("phonePlaceholder")}
                autoComplete="tel"
              />
            </>
          )}

          {role === "pharmacy" && (
            <>
              <TextField
                label={f("pharmacyName")}
                name="pharmacyName"
                required
                placeholder={f("pharmacyNamePlaceholder")}
              />
              <TextField
                label={f("contactPerson")}
                name="contactPerson"
                required
                placeholder={f("contactPersonPlaceholder")}
              />
              <TextField
                label={f("address")}
                name="address"
                required
                placeholder={f("addressPlaceholder")}
                autoComplete="street-address"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={f("phone")}
                  type="tel"
                  name="phone"
                  placeholder={f("phonePlaceholder")}
                  autoComplete="tel"
                />
                <TextField
                  label={f("idf")}
                  name="idf"
                  placeholder={f("idfPlaceholder")}
                />
              </div>
            </>
          )}

          {role === "enterprise" && (
            <>
              <TextField
                label={f("companyName")}
                name="companyName"
                required
                placeholder={f("companyNamePlaceholder")}
                autoComplete="organization"
              />
              <TextField
                label={f("contactPerson")}
                name="contactPerson"
                required
                placeholder={f("contactPersonPlaceholder")}
              />
              <div>
                <FieldLabel htmlFor="partnerType">{f("partnerType")}</FieldLabel>
                <select id="partnerType" name="partnerType" className={selectClass}>
                  {(["telemedicine", "clinic", "platform", "other"] as const).map(
                    (v) => (
                      <option key={v} value={v}>
                        {f(`partnerTypes.${v}`)}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <TextField
                label={f("phone")}
                type="tel"
                name="phone"
                placeholder={f("phonePlaceholder")}
                autoComplete="tel"
              />
            </>
          )}

          <PrimaryButton arrow disabled={pending}>
            {t("createAccount")}
          </PrimaryButton>
        </form>
      )}

      {/* Trust badges (Figma bottom row) */}
      <div className="mt-8 border-t border-hairline pt-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] font-semibold uppercase tracking-wide text-sage-900">
          <span className="flex items-center gap-2">
            <span aria-hidden className="msym text-[16px] text-gold">
              verified_user
            </span>
            {t("badges.gdpr")}
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden className="msym text-[16px] text-gold">
              lock
            </span>
            {t("badges.encrypted")}
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden className="msym text-[16px] text-gold">
              workspace_premium
            </span>
            {t("badges.certified")}
          </span>
        </div>
      </div>
    </>
  );
}
