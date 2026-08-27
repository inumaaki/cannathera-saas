"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

type Prescription = {
  id: string;
  patientName: string;
  status: string;
  parsedData: { inventoryId: string; name: string; quantity: number; unit: string }[] | null;
  createdAt: string;
};

export function LiveOrderTicker({
  prescriptions,
  translations,
  timeFormatter,
}: Readonly<{
  prescriptions: Prescription[];
  translations: {
    liveOrderTicker: string;
    viewAllOrders: string;
    noNewOrders: string;
    newPrescriptionReceived: (name: string) => string;
    processOrder: string;
    aiExtracted: string;
  };
  timeFormatter: (date: Date) => string;
}>) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function handleProcess(id: string) {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api(`/pharmacy/prescriptions/${id}/process`, {
        method: "POST",
      });
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to process prescription");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <section className="cw-watermark overflow-hidden rounded-xl border border-hairline bg-white">
      <div className="flex items-center justify-between border-b border-hairline bg-[#fdece0] px-6 py-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-accent-print">
          <span aria-hidden className="msym text-[22px]">
            inbox
          </span>
          {translations.liveOrderTicker}
        </h2>
        <Link
          href="/pharmacy/prescriptions"
          className="flex items-center gap-1 text-sm font-bold text-ink-strong hover:text-accent-print"
        >
          {translations.viewAllOrders}
          <span aria-hidden className="msym text-[16px] rtl:-scale-x-100">
            chevron_right
          </span>
        </Link>
      </div>

      {prescriptions.length === 0 ? (
        <p className="px-6 py-10 text-center text-muted">{translations.noNewOrders}</p>
      ) : (
        <div className="grid gap-0 divide-y divide-hairline">
          {prescriptions.map((r) => (
            <div key={r.id} className="flex flex-col px-6 py-4 transition-colors hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <span className="msym">receipt_long</span>
                  </div>
                  <div>
                    <p className="font-bold text-ink-strong">
                      {translations.newPrescriptionReceived(r.patientName)}
                    </p>
                    <p className="text-xs text-muted">
                      {timeFormatter(new Date(r.createdAt))}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleProcess(r.id)}
                  disabled={processingId === r.id}
                  className="rounded-lg bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-pine disabled:opacity-50 transition-opacity"
                >
                  {processingId === r.id ? "Processing..." : translations.processOrder}
                </button>
              </div>

              {/* AI Parsed Data Display */}
              {r.parsedData && r.parsedData.length > 0 && (
                <div className="mt-4 rounded-lg bg-amber-50/50 p-3 border border-amber-100">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
                    <span className="msym text-[14px]">smart_toy</span>
                    {translations.aiExtracted}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {r.parsedData.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-ink-strong shadow-sm border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {item.name}
                        <span className="text-muted ml-1 font-mono">{item.quantity}{item.unit}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
