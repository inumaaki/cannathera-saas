"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";
import { ROLE_PRESETS, type OrgRole } from "@cannathera/shared";
import { CredentialRow } from "../../patients/new/NewPatientForm";

const label = "block text-sm font-semibold text-ink-strong";
const input =
  "mt-1.5 h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20";

type InviteResult = { userId: string; email: string; tempPassword: string };

export function InviteDialog() {
  const t = useTranslations("doctor.settings");
  const tn = useTranslations("doctor.newPatient");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      const role = String(form.get("orgRole") ?? "DOCTOR") as OrgRole;
      const res = await api<InviteResult>("/doctor/team/invite", {
        method: "POST",
        body: {
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: form.get("email"),
          orgRole: role,
          permissions: [...(ROLE_PRESETS[role] ?? ROLE_PRESETS.DOCTOR)],
        },
      });
      setResult(res);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "EMAIL_TAKEN"
          ? tn("emailTaken")
          : tn("emailTaken"),
      );
    } finally {
      setPending(false);
    }
  }

  function close() {
    setOpen(false);
    setResult(null);
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 items-center gap-2 rounded-lg bg-brand px-5 font-bold text-white hover:bg-pine"
      >
        <span aria-hidden className="msym text-[18px]">
          person_add
        </span>
        {t("invite")}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" aria-label={t("cancel")} onClick={close} className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-display text-2xl font-bold text-pine">{t("inviteTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("inviteText")}</p>

            {result !== null ? (
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
                  {tn("credsTitle")}
                </h3>
                <div className="mt-2 space-y-2">
                  <CredentialRow
                    label={tn("loginEmail")}
                    value={result.email}
                    copyLabel={tn("copy")}
                    copiedLabel={tn("copied")}
                  />
                  <CredentialRow
                    label={tn("tempPassword")}
                    value={result.tempPassword}
                    copyLabel={tn("copy")}
                    copiedLabel={tn("copied")}
                  />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{tn("credsHint")}</p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-4 h-11 w-full rounded-lg bg-brand font-bold text-white hover:bg-pine"
                >
                  OK
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {error ? (
                  <p role="alert" className="rounded-lg border border-accent/40 bg-accent/5 px-4 py-2.5 text-sm text-accent-print">
                    {error}
                  </p>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="invFirst" className={label}>
                      {tn("firstName")}
                    </label>
                    <input id="invFirst" name="firstName" required className={input} />
                  </div>
                  <div>
                    <label htmlFor="invLast" className={label}>
                      {tn("lastName")}
                    </label>
                    <input id="invLast" name="lastName" required className={input} />
                  </div>
                </div>
                <div>
                  <label htmlFor="invEmail" className={label}>
                    {tn("email")}
                  </label>
                  <input id="invEmail" name="email" type="email" required className={input} />
                </div>
                <div>
                  <label htmlFor="invRole" className={label}>
                    {t("roleLabel")}
                  </label>
                  <select id="invRole" name="orgRole" className={input} defaultValue="DOCTOR">
                    {Object.keys(ROLE_PRESETS).map((r) => (
                      <option key={r} value={r}>
                        {t(`roles.${r}`)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                    {t("roleHint")}
                  </p>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={pending}
                    className="h-11 flex-1 rounded-lg bg-brand font-bold text-white hover:bg-pine disabled:opacity-60"
                  >
                    {t("sendInvite")}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="h-11 rounded-lg px-4 font-bold text-ink-strong hover:bg-surface"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
