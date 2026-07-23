"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";

export type ApiKeyRow = {
  id: string;
  name: string;
  masked: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
};
export type WebhookRow = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  successRate: number | null;
};
export type DeliveryRow = {
  id: string;
  event: string;
  url: string;
  statusCode: number | null;
  ok: boolean;
  error: string | null;
  attempts: number;
  createdAt: string;
};

const EVENTS = [
  "patient.created",
  "report.finalized",
  "alert.triggered",
  "session.updated",
] as const;
const SCOPES = ["READ", "WRITE", "ALL_ACCESS"] as const;

type Dialog =
  | { kind: "newKey" }
  | { kind: "keyCreated"; key: string }
  | { kind: "newHook" }
  | { kind: "hookCreated"; secret: string }
  | null;

/* Figma 8.4 — API keys, webhooks and the event delivery log. */
export function IntegrationsPanel({
  keys,
  webhooks,
  deliveries,
}: Readonly<{
  keys: ApiKeyRow[];
  webhooks: WebhookRow[];
  deliveries: DeliveryRow[];
}>) {
  const t = useTranslations("enterprise.integrations");
  const format = useFormatter();
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const errorText = (code: string) => {
    const key = `errors.${code}`;
    const text = t(key);
    return text === key ? t("errors.ERROR") : text;
  };

  async function run<T>(fn: () => Promise<T>, after?: (result: T) => void) {
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

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const time = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
      <div className="mt-6 grid gap-6 xl:grid-cols-[7fr_5fr]">
        {/* API keys */}
        <section className="cw-watermark self-start overflow-hidden rounded-xl border border-hairline bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-4">
            <div>
              <h2 className="font-display text-xl font-bold text-pine">{t("keys")}</h2>
              <p className="text-xs text-muted">{t("keysNote")}</p>
            </div>
            <button
              type="button"
              onClick={() => setDialog({ kind: "newKey" })}
              className="rounded-lg bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-pine"
            >
              {t("generateKey")}
            </button>
          </div>

          {error && !dialog ? (
            <p className="border-b border-hairline bg-red-50 px-6 py-2 text-sm font-semibold text-red-600">
              {errorText(error)}
            </p>
          ) : null}

          {keys.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted">{t("noKeys")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline text-xs font-bold uppercase tracking-wide text-sage-900">
                    <th className="px-6 py-3 text-start">{t("colKey")}</th>
                    <th className="px-6 py-3 text-start">{t("colScopes")}</th>
                    <th className="px-6 py-3 text-start">{t("colLastUsed")}</th>
                    <th className="px-6 py-3 text-end">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className="border-b border-hairline last:border-0">
                      <td className="px-6 py-4">
                        <p
                          className={`font-bold ${k.revoked ? "text-muted line-through" : "text-ink-strong"}`}
                        >
                          {k.name}
                        </p>
                        <p className="font-mono text-xs text-muted">{k.masked}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map((s) => (
                            <span
                              key={s}
                              className="rounded bg-[#eef2fe] px-1.5 py-0.5 text-[10px] font-bold text-info"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted">
                        {k.lastUsedAt ? time(k.lastUsedAt) : t("never")}
                      </td>
                      <td className="px-6 py-4 text-end">
                        {k.revoked ? (
                          <span className="rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase text-red-600">
                            {t("revoked")}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              run(() =>
                                api(`/enterprise/integrations/keys/${k.id}`, {
                                  method: "DELETE",
                                }),
                              )
                            }
                            className="rounded-lg border border-hairline px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-600 hover:bg-red-50"
                          >
                            {t("revoke")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Webhooks */}
          <div className="flex items-center justify-between border-y border-hairline bg-surface px-6 py-4">
            <h2 className="font-display text-xl font-bold text-pine">
              {t("webhookTitle")}
            </h2>
            <button
              type="button"
              onClick={() => setDialog({ kind: "newHook" })}
              className="rounded-lg border border-pine-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-pine-600 hover:bg-mint/20"
            >
              {t("addWebhook")}
            </button>
          </div>

          {webhooks.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted">{t("noWebhooks")}</p>
          ) : (
            <ul>
              {webhooks.map((h) => (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-4 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-bold text-ink-strong">
                      {h.url}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {h.events.map((e) => (
                        <span
                          key={e}
                          className="rounded bg-mint/30 px-1.5 py-0.5 text-[10px] font-bold text-pine"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {h.successRate !== null ? (
                      <span
                        className={`font-mono text-xs font-bold ${
                          h.successRate >= 95 ? "text-pine-600" : "text-accent-print"
                        }`}
                      >
                        {t("successRate", { rate: h.successRate })}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          api(`/enterprise/integrations/webhooks/${h.id}`, {
                            method: "PATCH",
                            body: { active: !h.active },
                          }),
                        )
                      }
                      className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-bold text-ink-strong hover:bg-surface"
                    >
                      {h.active ? t("pause") : t("resume")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          api(`/enterprise/integrations/webhooks/${h.id}`, {
                            method: "DELETE",
                          }),
                        )
                      }
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Event delivery log */}
        <section className="cw-watermark self-start rounded-xl border border-hairline bg-white">
          <div className="border-b border-hairline px-6 py-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-pine">
              <span aria-hidden className="size-2 rounded-full bg-pine-600" />
              {t("deliveryLog")}
            </h2>
            <p className="text-xs text-muted">{t("deliveryNote")}</p>
          </div>

          {deliveries.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted">{t("noDeliveries")}</p>
          ) : (
            <ul>
              {deliveries.map((d) => (
                <li
                  key={d.id}
                  className={`flex items-start gap-3 border-b border-hairline px-6 py-3 last:border-0 ${
                    d.ok ? "" : "bg-red-50/50"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`msym mt-0.5 text-[20px] ${
                      d.ok ? "text-pine-600" : "text-red-600"
                    }`}
                  >
                    {d.ok ? "check_circle" : "error"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-mono text-sm font-bold ${
                        d.ok ? "text-ink-strong" : "text-red-600"
                      }`}
                    >
                      {d.event}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      {d.statusCode ?? "—"} {d.error ?? "OK"}
                      {d.attempts > 1 ? ` · ${d.attempts}×` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="font-mono text-xs text-muted">{time(d.createdAt)}</p>
                    {!d.ok ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(() =>
                            api(`/enterprise/integrations/deliveries/${d.id}/retry`, {
                              method: "POST",
                            }),
                          )
                        }
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        {t("retry")}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ----------------------------------------------------------- dialogs --- */}
      {dialog?.kind === "newKey" ? (
        <Dialog title={t("newKeyTitle")} onClose={() => setDialog(null)}>
          <form
            action={(form) =>
              run(
                () =>
                  api<{ key: string }>("/enterprise/integrations/keys", {
                    method: "POST",
                    body: {
                      name: String(form.get("name")),
                      scopes: form.getAll("scopes").map(String),
                      live: form.get("live") === "on",
                    },
                  }),
                (created) => setDialog({ kind: "keyCreated", key: created.key }),
              )
            }
            className="space-y-4"
          >
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
                {t("keyName")}
              </span>
              <input
                name="name"
                required
                maxLength={60}
                className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-surface px-3 text-sm text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
              />
            </label>
            <fieldset>
              <legend className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
                {t("scopes")}
              </legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {SCOPES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      name="scopes"
                      value={s}
                      defaultChecked={s === "READ"}
                      className="size-4 accent-[#066c41]"
                    />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                name="live"
                defaultChecked
                className="size-4 accent-[#066c41]"
              />
              {t("live")}
            </label>
            {error ? (
              <p className="text-sm font-semibold text-red-600">{errorText(error)}</p>
            ) : null}
            <Actions
              busy={busy}
              submit={t("create")}
              cancel={t("cancel")}
              onCancel={() => setDialog(null)}
            />
          </form>
        </Dialog>
      ) : null}

      {dialog?.kind === "keyCreated" ? (
        <Dialog title={t("keyCreatedTitle")} onClose={() => setDialog(null)}>
          <p className="rounded-lg border border-accent-print/40 bg-[#fdece0] p-3 text-sm leading-relaxed text-ink-strong">
            {t("keyOnce")}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-hairline bg-surface p-3 font-mono text-xs text-ink-strong">
              {dialog.key}
            </code>
            <button
              type="button"
              onClick={() => copy(dialog.key)}
              className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-xs font-bold uppercase text-white hover:bg-pine"
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

      {dialog?.kind === "newHook" ? (
        <Dialog title={t("newWebhookTitle")} onClose={() => setDialog(null)}>
          <form
            action={(form) =>
              run(
                () =>
                  api<{ secret: string }>("/enterprise/integrations/webhooks", {
                    method: "POST",
                    body: {
                      url: String(form.get("url")),
                      events: form.getAll("events").map(String),
                    },
                  }),
                (created) => setDialog({ kind: "hookCreated", secret: created.secret }),
              )
            }
            className="space-y-4"
          >
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
                {t("url")}
              </span>
              <input
                name="url"
                type="url"
                required
                placeholder="https://hook.eu2.make.com/…"
                className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-surface px-3 font-mono text-sm text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
              />
            </label>
            <fieldset>
              <legend className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
                {t("events")}
              </legend>
              <div className="mt-2 space-y-2">
                {EVENTS.map((e) => (
                  <label
                    key={e}
                    className="flex items-center gap-2 font-mono text-sm text-ink-strong"
                  >
                    <input
                      type="checkbox"
                      name="events"
                      value={e}
                      defaultChecked
                      className="size-4 accent-[#066c41]"
                    />
                    {e}
                  </label>
                ))}
              </div>
            </fieldset>
            {error ? (
              <p className="text-sm font-semibold text-red-600">{errorText(error)}</p>
            ) : null}
            <Actions
              busy={busy}
              submit={t("create")}
              cancel={t("cancel")}
              onCancel={() => setDialog(null)}
            />
          </form>
        </Dialog>
      ) : null}

      {dialog?.kind === "hookCreated" ? (
        <Dialog title={t("secretTitle")} onClose={() => setDialog(null)}>
          <p className="rounded-lg border border-accent-print/40 bg-[#fdece0] p-3 text-sm leading-relaxed text-ink-strong">
            {t("secretNote")}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-hairline bg-surface p-3 font-mono text-xs text-ink-strong">
              {dialog.secret}
            </code>
            <button
              type="button"
              onClick={() => copy(dialog.secret)}
              className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-xs font-bold uppercase text-white hover:bg-pine"
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
    </>
  );
}

function Actions({
  busy,
  submit,
  cancel,
  onCancel,
}: Readonly<{ busy: boolean; submit: string; cancel: string; onCancel: () => void }>) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-hairline px-5 py-2.5 text-sm font-bold text-ink-strong hover:bg-surface"
      >
        {cancel}
      </button>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-pine disabled:opacity-60"
      >
        {submit}
      </button>
    </div>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: Readonly<{ title: string; onClose: () => void; children: React.ReactNode }>) {
  const t = useTranslations("enterprise.integrations");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t("cancel")}
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
