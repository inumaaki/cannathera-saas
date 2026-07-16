"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";

export type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  orgRole: "SUPER_ADMIN" | "SUPPORT" | "BILLING" | "VIEWER";
  status: "active" | "invited";
  isSelf: boolean;
};

const ROLES = ["SUPER_ADMIN", "SUPPORT", "BILLING", "VIEWER"] as const;

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: "bg-[#eef2fe] text-info",
  SUPPORT: "bg-mint/40 text-pine",
  BILLING: "bg-[#fdece0] text-accent-print",
  VIEWER: "bg-[#eef1f8] text-ink-strong",
};

type Dialog =
  | { kind: "invite" }
  | { kind: "invited"; email: string; tempPassword: string }
  | { kind: "remove"; member: Member }
  | null;

/* Figma 8.7 — Team Management. `canManage` only hides the controls; the API
   rejects the calls regardless, so it is convenience, not the security boundary. */
export function TeamPanel({
  members,
  canManage,
}: Readonly<{ members: Member[]; canManage: boolean }>) {
  const t = useTranslations("enterprise.team");
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [q, setQ] = useState("");

  const errorText = (code: string) => {
    const key = `errors.${code}`;
    const text = t(key);
    return text === key ? t("errors.ERROR") : text;
  };

  async function run<T>(fn: () => Promise<T>, after?: (r: T) => void) {
    setBusy(true);
    setError(null);
    try {
      const result = await fn();
      if (after) after(result);
      else setDialog(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "ERROR");
    } finally {
      setBusy(false);
    }
  }

  const rows = members.filter(
    (m) =>
      !q ||
      m.name.toLowerCase().includes(q.toLowerCase()) ||
      m.email.toLowerCase().includes(q.toLowerCase()) ||
      m.orgRole.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        {canManage ? (
          <span />
        ) : (
          <p className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-xs font-semibold text-muted">
            <span aria-hidden className="msym text-[16px]">
              lock
            </span>
            {t("readOnly")}
          </p>
        )}
        {canManage ? (
          <button
            type="button"
            onClick={() => setDialog({ kind: "invite" })}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-pine"
          >
            <span aria-hidden className="msym text-[18px]">
              person_add
            </span>
            {t("invite")}
          </button>
        ) : null}
      </div>

      <section className="cw-watermark overflow-hidden rounded-xl border border-hairline bg-white">
        <div className="border-b border-hairline px-6 py-4">
          <label className="relative block max-w-md">
            <span
              aria-hidden
              className="msym absolute start-3 top-1/2 -translate-y-1/2 text-[20px] text-muted"
            >
              search
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search")}
              className="h-10 w-full rounded-lg border border-hairline bg-surface ps-10 pe-3 text-sm text-ink-strong outline-none placeholder:text-muted focus:ring-2 focus:ring-pine-600/30"
            />
          </label>
        </div>

        {error && !dialog ? (
          <p className="border-b border-hairline bg-red-50 px-6 py-2 text-sm font-semibold text-red-600">
            {errorText(error)}
          </p>
        ) : null}

        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs font-bold uppercase tracking-wide text-sage-900">
                  <th className="px-6 py-3 text-start">{t("colMember")}</th>
                  <th className="px-6 py-3 text-start">{t("colRole")}</th>
                  <th className="px-6 py-3 text-start">{t("colStatus")}</th>
                  <th className="px-6 py-3 text-end">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-b border-hairline last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mint/40 text-xs font-bold text-pine">
                          {m.name
                            .split(/\s+/)
                            .filter(Boolean)
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div>
                          <p className="font-bold text-ink-strong">
                            {m.name}
                            {m.isSelf ? (
                              <span className="ms-2 rounded bg-[#eef1f8] px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">
                                {t("you")}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={m.orgRole}
                        disabled={busy || m.isSelf || !canManage}
                        onChange={(e) =>
                          run(() =>
                            api(`/enterprise/team/${m.id}`, {
                              method: "PATCH",
                              body: { orgRole: e.target.value },
                            }),
                          )
                        }
                        className={`rounded-md px-2.5 py-1 text-xs font-bold outline-none disabled:opacity-70 ${ROLE_STYLE[m.orgRole]}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {t(`roles.${r}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-bold ${
                          m.status === "active" ? "text-pine-600" : "text-gold"
                        }`}
                      >
                        <span aria-hidden className="size-2 rounded-full bg-current" />
                        {m.status === "active" ? t("active") : t("invited")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      {m.isSelf || !canManage ? null : (
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: "remove", member: m })}
                          className="rounded-lg border border-hairline px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-600 hover:bg-red-50"
                        >
                          {t("remove")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="border-t border-hairline px-6 py-3 text-xs text-muted">
          {t("showing", { count: rows.length })}
        </p>
      </section>

      {dialog?.kind === "invite" ? (
        <Dialog title={t("inviteTitle")} onClose={() => setDialog(null)}>
          <form
            action={(form) =>
              run(
                () =>
                  api<{ email: string; tempPassword: string }>("/enterprise/team", {
                    method: "POST",
                    body: {
                      email: String(form.get("email")),
                      firstName: String(form.get("firstName") || "") || undefined,
                      lastName: String(form.get("lastName") || "") || undefined,
                      orgRole: String(form.get("orgRole")),
                    },
                  }),
                (r) =>
                  setDialog({
                    kind: "invited",
                    email: r.email,
                    tempPassword: r.tempPassword,
                  }),
              )
            }
            className="space-y-4"
          >
            <Field label={t("email")} name="email" type="email" required />
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("firstName")} name="firstName" />
              <Field label={t("lastName")} name="lastName" />
            </div>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
                {t("role")}
              </span>
              <select
                name="orgRole"
                defaultValue="SUPPORT"
                className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-surface px-3 text-sm text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`roles.${r}`)}
                  </option>
                ))}
              </select>
            </label>
            {error ? (
              <p className="text-sm font-semibold text-red-600">{errorText(error)}</p>
            ) : null}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="rounded-lg border border-hairline px-5 py-2.5 text-sm font-bold text-ink-strong hover:bg-surface"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-pine disabled:opacity-60"
              >
                {t("send")}
              </button>
            </div>
          </form>
        </Dialog>
      ) : null}

      {dialog?.kind === "invited" ? (
        <Dialog title={t("invitedTitle")} onClose={() => setDialog(null)}>
          <p className="rounded-lg border border-accent-print/40 bg-[#fdece0] p-3 text-sm leading-relaxed text-ink-strong">
            {t("tempPasswordNote", { email: dialog.email })}
          </p>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-sage-900">
            {t("tempPassword")}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-hairline bg-surface p-3 font-mono text-lg font-bold tracking-wider text-ink-strong">
              {dialog.tempPassword}
            </code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(dialog.tempPassword);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="shrink-0 rounded-lg bg-brand px-4 py-3 text-xs font-bold uppercase text-white hover:bg-pine"
            >
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setDialog(null)}
              className="rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pine"
            >
              {t("done")}
            </button>
          </div>
        </Dialog>
      ) : null}

      {dialog?.kind === "remove" ? (
        <Dialog title={t("removeTitle")} onClose={() => setDialog(null)}>
          <p className="text-sm leading-relaxed text-muted">
            {t("removeText", { name: dialog.member.name })}
          </p>
          {error ? (
            <p className="mt-3 text-sm font-semibold text-red-600">{errorText(error)}</p>
          ) : null}
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDialog(null)}
              className="rounded-lg border border-hairline px-5 py-2.5 text-sm font-bold text-ink-strong hover:bg-surface"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(() =>
                  api(`/enterprise/team/${dialog.member.id}`, { method: "DELETE" }),
                )
              }
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {t("confirmRemove")}
            </button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: Readonly<{ label: string; name: string; type?: string; required?: boolean }>) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-surface px-3 text-sm text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
      />
    </label>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: Readonly<{ title: string; onClose: () => void; children: React.ReactNode }>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-pine/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        <h3 className="font-display text-xl font-bold text-pine">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
