"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";
import { PaywallModal, type PaywallType } from "@/components/paywall/PaywallModal";

const TYPES = ["MONTHLY", "QUARTERLY", "YEARLY", "LONG_TERM"] as const;
export type ReportType = (typeof TYPES)[number];

/* Generates a PDF server-side and streams it to the browser as a download.
   `patientId` = doctor view; omitted = the logged-in patient's own report. */
export function ReportButtons({
  patientId,
  labels,
  compact = false,
}: Readonly<{
  patientId?: string;
  labels: Record<ReportType | "generating", string>;
  compact?: boolean;
}>) {
  const router = useRouter();
  const [busy, setBusy] = useState<ReportType | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallType, setPaywallType] = useState<PaywallType>(null);

  async function download(type: ReportType) {
    setBusy(type);
    try {
      const url = patientId
        ? `${API_URL}/documents/patient/${patientId}?type=${type}`
        : `${API_URL}/documents/mine?type=${type}`;
      
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'GET',
          credentials: "include",
          headers: {
            Accept: 'application/pdf',
          },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(`Fetch blocked! URL: ${url}. Error: ${msg}. If you have an Adblocker or Edge Tracking Prevention, please disable it!`);
        throw err;
      }
      
      if (!res.ok) {
        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          if (data.message === "UPGRADE_REQUIRED") {
            setPaywallType("patient");
            setPaywallOpen(true);
            return;
          } else if (data.message === "PARTNER_INACTIVE") {
            setPaywallType("partner");
            setPaywallOpen(true);
            return;
          }
          throw new Error(`403 Forbidden: ${JSON.stringify(data)}`);
        }
        
        const text = await res.text().catch(() => "no body");
        throw new Error(`Report fetch failed: ${res.status} - ${text}`);
      }
      
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        const body = await res.text();
        throw new Error(`Expected application/pdf but received ${contentType}: ${body}`);
      }

      const blob = await res.blob();
      if (blob.size < 1000) {
        throw new Error(`Received an invalid PDF: ${blob.size} bytes`);
      }

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const name =
        /filename="([^"]+)"/.exec(disposition)?.[1] ?? `cannathera-${type.toLowerCase()}-report.pdf`;

      const pdfUrl = URL.createObjectURL(
        new Blob([blob], { type: 'application/pdf' })
      );

      const newWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');

      if (!newWindow) {
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      window.setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 60_000);

      router.refresh(); // report history gains a row
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className={compact ? "flex flex-wrap gap-2" : "grid gap-3 sm:grid-cols-2"}>
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => download(type)}
            disabled={busy !== null}
            className={
              compact
                ? "flex items-center gap-1.5 rounded-lg border border-pine-600 px-3 py-2 text-xs font-bold text-pine-600 hover:bg-mint/20 disabled:opacity-50"
                : "flex items-center justify-center gap-2 rounded-xl border border-hairline bg-white px-4 py-3 font-bold text-ink-strong hover:border-pine-600 hover:text-pine-600 disabled:opacity-50"
            }
          >
            <span aria-hidden className="msym text-[18px]">
              picture_as_pdf
            </span>
            {busy === type ? labels.generating : labels[type]}
          </button>
        ))}
      </div>
      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} type={paywallType} />
    </>
  );
}
