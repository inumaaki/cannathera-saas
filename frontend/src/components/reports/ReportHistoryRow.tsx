"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { PaywallModal, type PaywallType } from "@/components/paywall/PaywallModal";

export function ReportHistoryRow({
  reportId,
  downloadLabel,
}: Readonly<{ reportId: string; downloadLabel: string }>) {
  const [busy, setBusy] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallType, setPaywallType] = useState<PaywallType>(null);

  async function handleDownload() {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/documents/file/${reportId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/pdf',
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data.message === 'UPGRADE_REQUIRED') {
          setPaywallType('patient');
          setPaywallOpen(true);
          return;
        }
        if (res.status === 403 && data.message === 'PARTNER_INACTIVE') {
          setPaywallType('partner');
          setPaywallOpen(true);
          return;
        }
        throw new Error(`Download failed: ${res.status}`);
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

      const disposition = res.headers.get('Content-Disposition') ?? '';
      const name =
        /filename="([^"]+)"/.exec(disposition)?.[1] ?? `cannathera-report.pdf`;
      
      const pdfUrl = URL.createObjectURL(
        new Blob([blob], { type: 'application/pdf' })
      );

      const newWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');

      if (!newWindow) {
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      window.setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 60_000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Download error: " + msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-pine-600 px-3 py-2 text-xs font-bold text-pine-600 hover:bg-mint/20 disabled:opacity-50"
      >
        <span aria-hidden className="msym text-[16px]">
          {busy ? "hourglass_empty" : "download"}
        </span>
        {downloadLabel}
      </button>
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        type={paywallType}
      />
    </>
  );
}
