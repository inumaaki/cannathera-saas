"use client";

import { useTranslations } from "next-intl";

export function LandingFeatures() {
  const tr = useTranslations("auth.signup.chooseRole");
  const t = useTranslations("landing.features");

  const features = [
    {
      title: tr("patient"),
      desc: tr("patientDesc") + " " + t("patientDescSuffix"),
      icon: "person",
      color: "bg-mint/20 text-pine-600 border-mint/30",
      bullets: [
        t("patientBullets.0"),
        t("patientBullets.1"),
        t("patientBullets.2"),
      ],
    },
    {
      title: tr("doctor"),
      desc: tr("doctorDesc") + " " + t("doctorDescSuffix"),
      icon: "psychiatry",
      color: "bg-info/20 text-blue-600 border-info/30",
      bullets: [
        t("doctorBullets.0"),
        t("doctorBullets.1"),
        t("doctorBullets.2"),
      ],
    },
    {
      title: tr("pharmacy"),
      desc: tr("pharmacyDesc") + " " + t("pharmacyDescSuffix"),
      icon: "medication",
      color: "bg-[#fdf3d7] text-gold border-yellow-200",
      bullets: [
        t("pharmacyBullets.0"),
        t("pharmacyBullets.1"),
        t("pharmacyBullets.2"),
      ],
    },
    {
      title: tr("enterprise"),
      desc: tr("enterpriseDesc") + " " + t("enterpriseDescSuffix"),
      icon: "business",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      bullets: [
        t("enterpriseBullets.0"),
        t("enterpriseBullets.1"),
        t("enterpriseBullets.2"),
      ],
    },
  ];

  return (
    <section id="features" className="min-h-screen flex flex-col justify-center py-16 bg-surface border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-pine-600">
            {t("tag")}
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-pine sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-muted leading-relaxed">
            {t("subtitle")}
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
