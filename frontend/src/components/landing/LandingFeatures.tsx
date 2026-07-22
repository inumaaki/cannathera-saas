"use client";

import { useTranslations } from "next-intl";

export function LandingFeatures() {
  const t = useTranslations("auth.signup.chooseRole");

  const features = [
    {
      title: t("patient"),
      desc: t("patientDesc") + " Securely record symptoms, dosages, and daily activity. Track adherence metrics in real-time.",
      icon: "person",
      color: "bg-mint/20 text-pine-600 border-mint/30",
      bullets: ["Structured 90-Day Plan", "Daily Dosage Logs", "Adherence Analytics"],
    },
    {
      title: t("doctor"),
      desc: t("doctorDesc") + " Automated triage protocols monitor patient values. Generate structured PDF course reports with one click.",
      icon: "psychiatry",
      color: "bg-info/20 text-blue-600 border-info/30",
      bullets: ["Automated Red-Flags", "Patient Roster Management", "Clinical PDF Exports"],
    },
    {
      title: t("pharmacy"),
      desc: t("pharmacyDesc") + " Log dispensations and manage stocks. Track patient reviews and monthly assessment targets.",
      icon: "medication",
      color: "bg-[#fdf3d7] text-gold border-yellow-200",
      bullets: ["Inventory Tracking", "Compliance Reviews", "Billing Logs Audit"],
    },
    {
      title: t("enterprise"),
      desc: t("enterpriseDesc") + " Support platform scaling with secure integrations, telemetry API webhooks, and partner settings.",
      icon: "business",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      bullets: ["Custom Tenant Branding", "Webhook & API access", "Comprehensive Security Policy"],
    },
  ];

  return (
    <section id="features" className="min-h-screen flex flex-col justify-center py-16 bg-surface border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-pine-600">
            Platform Capabilities
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-pine sm:text-4xl">
            A Complete Ecosystem for Therapy Accompaniment
          </h2>
          <p className="text-muted leading-relaxed">
            Cannathera bridges the gap between clinicians, pharmacies, and patients by translating complex therapy regimes into structured, secure, data-driven progress workflows.
          </p>
        </div>

        {/* Roster Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="cw-watermark flex flex-col justify-between rounded-2xl border border-hairline bg-white p-6 transition-all hover:border-pine-600 hover:shadow-xl hover:-translate-y-1 duration-300"
            >
              <div>
                <span className={`flex size-12 items-center justify-center rounded-xl border ${f.color}`}>
                  <span aria-hidden className="msym text-[24px]">
                    {f.icon}
                  </span>
                </span>
                <h3 className="mt-5 text-xl font-bold text-ink-strong">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
              </div>

              <div className="mt-6 border-t border-hairline pt-4">
                <ul className="space-y-2">
                  {f.bullets.map((b, bi) => (
                    <li key={bi} className="flex items-center gap-2 text-xs font-bold text-ink-strong">
                      <span className="flex size-4 items-center justify-center rounded-full bg-pine-600/10 text-pine-600">
                        <span aria-hidden className="msym text-[10px]">
                          check
                        </span>
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
