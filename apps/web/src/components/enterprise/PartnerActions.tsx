"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";

type Available = { id: string; name: string; type: string };

/* Onboard a network partner (Figma 8.3). */
export function PartnerActions({ available }: Readonly<{ available: Available[] }>) {
  const t = useTranslations("enterprise.partners");
  const router = useRouter();
  const [dialog, setDialog] = useState<"add" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setDialog(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "ERROR");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDialog("add")}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-pine"
      >
        <span aria-hidden className="msym text-[18px]">
          add_business
        </span>
        {t("onboard")}
      </button>

      {dialog === "add" ? (
        <Dialog title={t("addTitle")} onClose={() => setDialog(null)}>
          <p className="text-sm leading-relaxed text-muted">{t("addText")}</p>
          {available.length === 0 ? (
            <p className="mt-4 rounded-lg border border-hairline bg-surface p-4 text-sm text-muted">
              {t("noneAvailable")}
            </p>
          ) : (
            <form
              action={(form) =>
                run(() =>
                  api("/enterprise/partners", {
                    method: "POST",
                    body: { orgId: String(form.get("orgId")) },
                  }),
                )
              }
              className="mt-4 space-y-4"
            >
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
                  {t("selectOrg")}
                </span>
                <select
                  name="orgId"
                  className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-surface px-3 text-sm text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
                >
                  {available.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.type === "PHARMACY" ? t("pharmacies") : t("practices")})
                    </option>
                  ))}
                </select>
              </label>
              {error ? (
                <p className="text-sm font-semibold text-red-600">{error}</p>
              ) : null}
              <div className="flex justify-end gap-3">
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
                  {t("add")}
                </button>
              </div>
            </form>
          )}
        </Dialog>
      ) : null}

    </>
  );
}

/** Standalone remove button used inside the server-rendered table rows. */
export function RemovePartnerButton({
  id,
  name,
}: Readonly<{ id: string; name: string }>) {
  const t = useTranslations("enterprise.partners");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api(`/enterprise/partners/${id}`, { method: "DELETE" });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "ERROR");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-hairline px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-600 hover:bg-red-50"
      >
        {t("remove")}
      </button>
      {open ? (
        <Dialog title={t("removeTitle")} onClose={() => setOpen(false)}>
          <p className="text-sm leading-relaxed text-muted">{t("removeText", { name })}</p>
          {error ? (
            <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
          ) : null}
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-hairline px-5 py-2.5 text-sm font-bold text-ink-strong hover:bg-surface"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={remove}
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
        className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
      >
        <h3 className="font-display text-xl font-bold text-pine">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
