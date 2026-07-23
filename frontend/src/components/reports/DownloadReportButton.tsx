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
      const url = `${API_URL}/reports/patient/${patientId}?type=MONTHLY`;
      const res = await fetch(url, { credentials: "include" });
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
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const name =
        /filename="([^"]+)"/.exec(disposition)?.[1] ?? `cannathera-monthly-${patientId}.pdf`;

      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = name;
      a.click();
      URL.revokeObjectURL(href);
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
