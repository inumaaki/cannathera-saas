"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { useTranslations } from "next-intl";

export type PaywallType = "patient" | "partner" | null;

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: PaywallType;
}

export function PaywallModal({ isOpen, onClose, type }: Readonly<PaywallModalProps>) {
  const t = useTranslations("paywall");
  const tc = useTranslations("common");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isPatient = type === "patient";

  async function handleCheckout(planTier: string) {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier,
          successUrl: `${API_URL}/stripe/simulate-success`,
          cancelUrl: window.location.href,
        }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        alert(t("checkoutFailed"));
      }
    } catch {
      alert(t("serverUnavailable"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isOpen ? "opacity-100 backdrop-blur-md bg-pine-900/40" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-white border border-hairline p-6 shadow-2xl transition-all duration-200 ${
          isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full hover:bg-surface text-muted transition-colors"
          aria-label={tc("close")}
        >
          <span className="msym text-[20px]">close</span>
        </button>

        {/* Premium Badge Icon */}
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-mint/20 text-brand">
            <span className="msym text-[32px] text-brand">workspace_premium</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-center font-display text-2xl font-bold text-pine">
          {isPatient ? t("patientTitle") : t("partnerTitle")}
        </h3>
        <p className="mt-2 text-center text-sm text-muted">
          {isPatient
            ? t("patientDescription")
            : t("partnerDescription")}
        </p>

        {/* Value Prop Bullets */}
        <ul className="mt-5 space-y-2.5 rounded-xl bg-surface p-4 text-sm text-ink-strong">
          <li className="flex items-center gap-2.5">
            <span className="msym text-[18px] text-brand">check_circle</span>
            <span>{isPatient ? t("patientBenefit1") : t("partnerBenefit1")}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="msym text-[18px] text-brand">check_circle</span>
            <span>{isPatient ? t("patientBenefit2") : t("partnerBenefit2")}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="msym text-[18px] text-brand">check_circle</span>
            <span>{isPatient ? t("patientBenefit3") : t("partnerBenefit3")}</span>
          </li>
        </ul>

        {/* Plans Grid */}
        <div className="mt-6 space-y-3">
          {isPatient ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleCheckout("BASIC")}
                className="flex w-full items-center justify-between rounded-xl border border-hairline bg-white px-4 py-3.5 text-sm font-bold text-ink-strong hover:border-brand transition-colors disabled:opacity-50"
              >
                <span>{t("basicPlan")}</span>
                <span className="text-brand">{t("pricePerMonth", { price: "€9.99" })}</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleCheckout("PLUS")}
                className="flex w-full items-center justify-between rounded-xl border border-hairline bg-white px-4 py-3.5 text-sm font-bold text-ink-strong hover:border-brand transition-colors disabled:opacity-50"
              >
                <span>{t("plusPlan")}</span>
                <span className="text-brand">{t("pricePerMonth", { price: "€29.99" })}</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleCheckout("PREMIUM")}
                className="flex w-full items-center justify-between rounded-xl bg-gradient-to-tr from-brand to-pine px-4 py-3.5 text-sm font-bold text-white hover:opacity-90 shadow-md transition-opacity disabled:opacity-50"
              >
                <span>{t("premiumPlan")}</span>
                <span>{t("pricePerMonth", { price: "€49.99" })}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleCheckout("PLUS")}
                className="flex w-full items-center justify-between rounded-xl border border-hairline bg-white px-4 py-3.5 text-sm font-bold text-ink-strong hover:border-brand transition-colors disabled:opacity-50"
              >
                <span>{t("flexPlan")}</span>
                <span className="text-brand">{t("pricePerMonth", { price: "€449.00" })}</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleCheckout("PREMIUM")}
                className="flex w-full items-center justify-between rounded-xl border border-hairline bg-white px-4 py-3.5 text-sm font-bold text-ink-strong hover:border-brand transition-colors disabled:opacity-50"
              >
                <span>{t("flashbackSPlan")}</span>
                <span className="text-brand">{t("pricePerMonth", { price: "€899.00" })}</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleCheckout("ENTERPRISE")}
                className="flex w-full items-center justify-between rounded-xl bg-gradient-to-tr from-brand to-pine px-4 py-3.5 text-sm font-bold text-white hover:opacity-90 shadow-md transition-opacity disabled:opacity-50"
              >
                <span>{t("flashbackMPlan")}</span>
                <span>{t("pricePerMonth", { price: "€1,599.00" })}</span>
              </button>
            </>
          )}
        </div>

        {/* Stripe Trust Footer */}
        <div className="mt-5 flex flex-col items-center justify-center gap-2 border-t border-hairline pt-4 text-xs text-muted">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-sage-950">
            <svg
              className="h-3 w-auto fill-[#635bff]"
              viewBox="65 258 510 146"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label={t("stripeLogo")}
            >
              <path d="M154.2 345.1c0 25.6-20.3 40.1-49.9 40.3c-12.2 0-25.6-2.4-38.8-8.1v-33.9c12 6.4 27.1 11.3 38.9 11.3c7.9 0 13.6-2.1 13.6-8.7c0-17-54-10.6-54-49.9c0-25.2 19.2-40.2 48-40.2c11.8 0 23.5 1.8 35.3 6.5v33.4c-10.8-5.8-24.5-9.1-35.3-9.1c-7.5 0-12.1 2.2-12.1 7.7c0 16 54.3 8.4 54.3 50.7m68.8-56.6h-27V339c0 20.9 22.5 14.4 27 12.6v28.9c-4.7 2.6-13.3 4.7-24.9 4.7c-21.1 0-36.9-15.5-36.9-36.5l.2-113.9l34.7-7.4v30.8H223zm74 2.4c-4.5-1.5-18.7-3.6-27.1 7.4v84.4h-35.5V258.2h30.7l2.2 10.5c8.3-15.3 24.9-12.2 29.6-10.5h.1zm44.1 91.8h-35.7V258.2h35.7zm0-142.9l-35.7 7.6v-28.9l35.7-7.6zm74.1 145.5c-12.4 0-20-5.3-25.1-9l-.1 40.2l-35.5 7.5V258.2h31.3l1.8 8.8c4.9-4.5 13.9-11.1 27.8-11.1c24.9 0 48.4 22.5 48.4 63.8c0 45.1-23.2 65.5-48.6 65.6m160.4-51.5h-69.5c1.6 16.6 13.8 21.5 27.6 21.5c14.1 0 25.2-3 34.9-7.9V376c-9.7 5.3-22.4 9.2-39.4 9.2c-34.6 0-58.8-21.7-58.8-64.5c0-36.2 20.5-64.9 54.3-64.9c33.7 0 51.3 28.7 51.3 65.1c0 3.5-.3 10.9-.4 12.9M524.4 284.8c-8.9 0-18.7 6.7-18.7 22.7h36.7c0-16-9.3-22.7-18-22.7M407 287.4c-8.2 0-13.3 2.9-17 7l.2 52.8c3.5 3.7 8.5 6.7 16.8 6.7c13.1 0 21.9-14.3 21.9-33.4c0-18.6-9-33.2-21.9-33.1" />
            </svg>
            <span>{t("secureCheckout")}</span>
          </div>
          <p className="text-[10px]">{t("secureBilling")}</p>
        </div>
      </div>
    </div>
  );
}
