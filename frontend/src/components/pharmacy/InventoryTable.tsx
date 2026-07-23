"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";

export type Item = {
  id: string;
  sku: string;
  name: string;
  category: string;
  thc: number | null;
  cbd: number | null;
  stockLevel: number;
  unit: string;
  safetyThreshold: number;
  pendingOrder: boolean;
  reorderQty: number | null;
  orderedAt: string | null;
  lastRestockAt: string | null;
  status: "critical" | "low" | "inStock";
};

type HistoryEvent = {
  id: string;
  action: string;
  at: string;
  by: string;
  metadata: Record<string, unknown> | null;
};

const STATUS_STYLE: Record<Item["status"], string> = {
  critical: "bg-red-50 text-red-600",
  low: "bg-[#fdece0] text-accent-print",
  inStock: "bg-mint/30 text-pine-600",
};

const CATEGORIES = ["Flower", "Oil", "Extract", "Capsule"] as const;
const UNITS = ["g", "ml", "Stk."] as const;

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; item: Item }
  | { kind: "reorder"; item: Item }
  | { kind: "receive"; item: Item }
  | { kind: "archive"; item: Item }
  | { kind: "history"; item: Item; events: HistoryEvent[] }
  | null;

/* Figma 6.6 — Product ledger: reorder → receive → stock trail, plus full editing. */
export function InventoryTable({ items }: Readonly<{ items: Item[] }>) {
  const t = useTranslations("pharmacy.inventory");
  const format = useFormatter();
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categoryLabel = (value: string) => {
    const key = `category${value}` as
      | "categoryFlower"
      | "categoryOil"
      | "categoryExtract"
      | "categoryCapsule";
    return CATEGORIES.includes(value as (typeof CATEGORIES)[number]) ? t(key) : value;
  };
  const unitLabel = (value: string) => (value === "Stk." ? t("unitPieces") : value);

  const day = (iso: string) =>
    format.dateTime(new Date(iso), { day: "2-digit", month: "2-digit", year: "numeric" });

  /* Every mutation funnels through here so one place owns the busy flag, the
     German error message and the refresh. */
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

  const errorText = (code: string) => {
    const key = `errors.${code}`;
    const text = t(key);
    return text === key ? t("errors.ERROR") : text;
  };

  async function openHistory(item: Item) {
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ events: HistoryEvent[] }>(
        `/pharmacy/inventory/${item.id}/history`,
      );
      setDialog({ kind: "history", item, events: data.events });
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "ERROR");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="cw-watermark mt-6 overflow-hidden rounded-xl border border-hairline bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-4">
          <h2 className="font-display text-xl font-bold text-pine">{t("ledger")}</h2>
          <button
            type="button"
            onClick={() => setDialog({ kind: "create" })}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-pine"
          >
            <span aria-hidden className="msym text-[16px]">
              add
            </span>
            {t("newSku")}
          </button>
        </div>

        {error && !dialog ? (
          <p className="border-b border-hairline bg-red-50 px-6 py-2 text-sm font-semibold text-red-600">
            {errorText(error)}
          </p>
        ) : null}

        {items.length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">{t("noResults")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs font-bold uppercase tracking-wide text-sage-900">
                  <th className="px-6 py-3 text-start">{t("colProduct")}</th>
                  <th className="px-6 py-3 text-start">{t("colCategory")}</th>
                  <th className="px-6 py-3 text-start">{t("colStrength")}</th>
                  <th className="px-6 py-3 text-start">{t("colStock")}</th>
                  <th className="px-6 py-3 text-start">{t("colStatus")}</th>
                  <th className="px-6 py-3 text-end">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-hairline last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-bold text-ink-strong">{i.name}</p>
                      <p className="font-mono text-xs text-muted">{i.sku}</p>
                      {i.lastRestockAt ? (
                        <p className="mt-0.5 text-xs text-muted">
                          {t("lastRestock", { date: day(i.lastRestockAt) })}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-ink-strong">{categoryLabel(i.category)}</td>
                    <td className="px-6 py-4 font-mono text-ink-strong">
                      THC {i.thc ?? 0}% · CBD {i.cbd ?? 0}%
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-ink-strong">
                        {i.stockLevel} {unitLabel(i.unit)}
                      </p>
                      <p className="text-xs text-muted">
                        {t("threshold")}: {i.safetyThreshold} {unitLabel(i.unit)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[i.status]}`}
                      >
                        {i.status === "critical"
                          ? t("statusCritical")
                          : i.status === "low"
                            ? t("statusLow")
                            : t("statusInStock")}
                      </span>
                      {i.pendingOrder ? (
                        <p className="mt-1 text-xs font-semibold text-info">
                          {t("orderOpen", {
                            qty: i.reorderQty ?? 0,
                            unit: i.unit,
                            date: i.orderedAt ? day(i.orderedAt) : "—",
                          })}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {i.pendingOrder ? (
                          <button
                            type="button"
                            onClick={() => setDialog({ kind: "receive", item: i })}
                            className="rounded-lg bg-pine-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-pine"
                          >
                            {t("receive")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDialog({ kind: "reorder", item: i })}
                            className="rounded-lg bg-brand px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-pine"
                          >
                            {t("reorder")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: "edit", item: i })}
                          className="rounded-lg border border-hairline px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink-strong hover:bg-surface"
                        >
                          {t("manage")}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openHistory(i)}
                          aria-label={t("history")}
                          title={t("history")}
                          className="flex size-9 items-center justify-center rounded-lg border border-hairline text-ink-strong hover:bg-surface"
                        >
                          <span aria-hidden className="msym text-[18px]">
                            history
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="border-t border-hairline px-6 py-3 text-xs text-muted">
          {t("showing", { count: items.length })}
        </p>
      </section>

      {/* ---------------------------------------------------------- Dialogs --- */}
      {dialog?.kind === "create" ? (
        <Dialog title={t("newTitle")} onClose={() => setDialog(null)}>
          <form
            action={(form) =>
              run(() =>
                api("/pharmacy/inventory", {
                  method: "POST",
                  body: {
                    sku: String(form.get("sku")),
                    name: String(form.get("name")),
                    category: String(form.get("category")),
                    thc: form.get("thc") ? Number(form.get("thc")) : undefined,
                    cbd: form.get("cbd") ? Number(form.get("cbd")) : undefined,
                    stockLevel: Number(form.get("stockLevel")),
                    unit: String(form.get("unit")),
                    safetyThreshold: Number(form.get("safetyThreshold")),
                  },
                }),
              )
            }
            className="space-y-4"
          >
            <Field label={t("sku")} name="sku" type="text" required />
            <Field label={t("name")} name="name" type="text" required />
            <Select label={t("category")} name="category" options={CATEGORIES} optionLabel={categoryLabel} />
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("thc")} name="thc" defaultValue={0} />
              <Field label={t("cbd")} name="cbd" defaultValue={0} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("stockLevel")} name="stockLevel" defaultValue={0} required />
              <Select label={t("unit")} name="unit" options={UNITS} optionLabel={unitLabel} />
            </div>
            <Field label={t("threshold")} name="safetyThreshold" defaultValue={50} required />
            <Actions
              busy={busy}
              error={error && errorText(error)}
              submit={t("create")}
              cancel={t("cancel")}
              onCancel={() => setDialog(null)}
            />
          </form>
        </Dialog>
      ) : null}

      {dialog?.kind === "edit" ? (
        <Dialog
          title={t("editTitle", { name: dialog.item.name })}
          onClose={() => setDialog(null)}
        >
          <form
            action={(form) =>
              run(() =>
                api(`/pharmacy/inventory/${dialog.item.id}`, {
                  method: "PATCH",
                  body: {
                    name: String(form.get("name")),
                    category: String(form.get("category")),
                    thc: Number(form.get("thc")),
                    cbd: Number(form.get("cbd")),
                    unit: String(form.get("unit")),
                    stockLevel: Number(form.get("stockLevel")),
                    safetyThreshold: Number(form.get("safetyThreshold")),
                  },
                }),
              )
            }
            className="space-y-4"
          >
            <Field label={t("name")} name="name" type="text" defaultValue={dialog.item.name} required />
            <Select
              label={t("category")}
              name="category"
              options={CATEGORIES}
              defaultValue={dialog.item.category}
              optionLabel={categoryLabel}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("thc")} name="thc" defaultValue={dialog.item.thc ?? 0} />
              <Field label={t("cbd")} name="cbd" defaultValue={dialog.item.cbd ?? 0} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={t("stockLevel")}
                name="stockLevel"
                defaultValue={dialog.item.stockLevel}
                required
              />
              <Select
                label={t("unit")}
                name="unit"
                options={UNITS}
                defaultValue={dialog.item.unit}
                optionLabel={unitLabel}
              />
            </div>
            <Field
              label={t("threshold")}
              name="safetyThreshold"
              defaultValue={dialog.item.safetyThreshold}
              required
            />
            <p className="text-xs text-muted">{t("stockNote")}</p>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDialog({ kind: "archive", item: dialog.item })}
                className="flex items-center gap-1.5 text-sm font-bold text-red-600 hover:underline"
              >
                <span aria-hidden className="msym text-[18px]">
                  archive
                </span>
                {t("archive")}
              </button>
              <Actions
                busy={busy}
                error={error && errorText(error)}
                submit={t("save")}
                cancel={t("cancel")}
                onCancel={() => setDialog(null)}
              />
            </div>
          </form>
        </Dialog>
      ) : null}

      {dialog?.kind === "reorder" ? (
        <Dialog
          title={t("reorderTitle", { name: dialog.item.name })}
          onClose={() => setDialog(null)}
        >
          <form
            action={(form) =>
              run(() =>
                api(`/pharmacy/inventory/${dialog.item.id}/reorder`, {
                  method: "POST",
                  body: { qty: Number(form.get("qty")) },
                }),
              )
            }
            className="space-y-4"
          >
            <p className="text-sm leading-relaxed text-muted">{t("reorderText")}</p>
            <Field
              label={t("qty", { unit: dialog.item.unit })}
              name="qty"
              defaultValue={Math.max(
                1,
                Math.round(dialog.item.safetyThreshold * 2 - dialog.item.stockLevel),
              )}
              required
            />
            <Actions
              busy={busy}
              error={error && errorText(error)}
              submit={t("placeOrder")}
              cancel={t("cancel")}
              onCancel={() => setDialog(null)}
            />
          </form>
        </Dialog>
      ) : null}

      {dialog?.kind === "receive" ? (
        <Dialog
          title={t("receiveTitle", { name: dialog.item.name })}
          onClose={() => setDialog(null)}
        >
          <form
            action={(form) =>
              run(() =>
                api(`/pharmacy/inventory/${dialog.item.id}/receive`, {
                  method: "POST",
                  body: { qty: Number(form.get("qty")) },
                }),
              )
            }
            className="space-y-4"
          >
            <p className="text-sm leading-relaxed text-muted">{t("receiveText")}</p>
            <Field
              label={t("receivedQty", { unit: dialog.item.unit })}
              name="qty"
              defaultValue={dialog.item.reorderQty ?? 0}
              required
            />
            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    api(`/pharmacy/inventory/${dialog.item.id}/cancel-order`, {
                      method: "POST",
                    }),
                  )
                }
                className="text-sm font-bold text-red-600 hover:underline disabled:opacity-60"
              >
                {t("cancelOrder")}
              </button>
              <Actions
                busy={busy}
                error={error && errorText(error)}
                submit={t("confirmReceive")}
                cancel={t("cancel")}
                onCancel={() => setDialog(null)}
              />
            </div>
          </form>
        </Dialog>
      ) : null}

      {dialog?.kind === "archive" ? (
        <Dialog title={t("archiveTitle")} onClose={() => setDialog(null)}>
          <p className="text-sm leading-relaxed text-muted">
            {t("archiveText", { name: dialog.item.name })}
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
                  api(`/pharmacy/inventory/${dialog.item.id}`, { method: "DELETE" }),
                )
              }
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {t("confirmArchive")}
            </button>
          </div>
        </Dialog>
      ) : null}

      {dialog?.kind === "history" ? (
        <Dialog
          title={t("historyTitle", { name: dialog.item.name })}
          onClose={() => setDialog(null)}
        >
          {dialog.events.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t("historyEmpty")}</p>
          ) : (
            <ol className="space-y-3">
              {dialog.events.map((e) => (
                <li
                  key={e.id}
                  className="flex gap-3 border-b border-hairline pb-3 last:border-0"
                >
                  <span
                    aria-hidden
                    className="msym mt-0.5 text-[18px] text-pine-600"
                  >
                    {e.action === "INVENTORY_RECEIVED"
                      ? "local_shipping"
                      : e.action === "INVENTORY_REORDERED"
                        ? "shopping_cart"
                        : e.action === "INVENTORY_STOCK_CORRECTED"
                          ? "edit"
                          : "history"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink-strong">
                      {t(`event.${e.action}`)}
                      <Delta metadata={e.metadata} unit={dialog.item.unit} />
                    </p>
                    <p className="text-xs text-muted">
                      {format.dateTime(new Date(e.at), {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {t("by", { name: e.by })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Dialog>
      ) : null}
    </>
  );
}

/** Shows the stock movement carried in an audit row, when there is one. */
function Delta({
  metadata,
  unit,
}: Readonly<{ metadata: Record<string, unknown> | null; unit: string }>) {
  if (!metadata) return null;
  const qty = typeof metadata.qty === "number" ? metadata.qty : null;
  const delta = typeof metadata.delta === "number" ? metadata.delta : null;
  const value = delta ?? qty;
  if (value == null) return null;
  const positive = value > 0;
  return (
    <span
      className={`ms-2 font-mono text-xs font-bold ${
        positive ? "text-pine-600" : "text-accent-print"
      }`}
    >
      {positive ? "+" : ""}
      {value} {unit}
    </span>
  );
}

function Actions({
  busy,
  error,
  submit,
  cancel,
  onCancel,
}: Readonly<{
  busy: boolean;
  error: string | null | false;
  submit: string;
  cancel: string;
  onCancel: () => void;
}>) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {error ? (
        <p className="me-auto text-sm font-semibold text-red-600">{error}</p>
      ) : null}
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

function Field({
  label,
  name,
  defaultValue,
  type = "number",
  required,
}: Readonly<{
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
}>) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={type === "number" ? "any" : undefined}
        min={type === "number" ? 0 : undefined}
        defaultValue={defaultValue}
        required={required}
        className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-surface px-3 text-sm text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
  optionLabel = (value) => value,
}: Readonly<{
  label: string;
  name: string;
  options: readonly string[];
  defaultValue?: string;
  optionLabel?: (value: string) => string;
}>) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-surface px-3 text-sm text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {optionLabel(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: Readonly<{ title: string; onClose: () => void; children: React.ReactNode }>) {
  const t = useTranslations("pharmacy.inventory");
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
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
