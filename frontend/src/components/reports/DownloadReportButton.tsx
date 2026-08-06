"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { PaywallModal, type PaywallType } from "@/components/paywall/PaywallModal";
import { useTranslations } from "next-intl";

export function DownloadReportButton({
  patientId,
  label = "PDF",
}: Readonly<{
  patientId: string;
  label?: string;
}>) {
  const t = useTranslations("common");
  const [busy, setBusy] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallType, setPaywallType] = useState<PaywallType>(null);

  async function download() {
    setBusy(true);
    try {
      const url = `${API_URL}/documents/patient/${patientId}?type=MONTHLY`;
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/pdf',
        },
      });
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
        }
        alert(t("actionFailed"));
        return;
      }
      
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error(`Expected application/pdf but received ${contentType}`);
      }

      const blob = await res.blob();
      if (blob.size < 1000) {
        throw new Error(`Received an invalid PDF: ${blob.size} bytes`);
      }

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const name =
        /filename="([^"]+)"/.exec(disposition)?.[1] ?? `cannathera-monthly-${patientId}.pdf`;

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
    } catch {
      alert(t("actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="inline-flex items-center gap-1 font-bold text-pine-600 hover:underline disabled:opacity-50"
      >
        <span aria-hidden className="msym text-[18px]">
          picture_as_pdf
        </span>
        {label}
      </button>
      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} type={paywallType} />
    </>
  );
}
