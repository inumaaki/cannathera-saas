"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type PricingTab = "patients" | "pharmacies" | "enterprise";

export function LandingPricing() {
  const [activeTab, setActiveTab] = useState<PricingTab>("patients");
  const t = useTranslations("landing.pricing");

  const optionals = [
    { name: t("optionalName0"), desc: t("optionalDesc0"), price: "24,90 €" },
    { name: t("optionalName1"), desc: t("optionalDesc1"), price: "19,90 €" },
    { name: t("optionalName2"), desc: t("optionalDesc2"), price: "39,90 €" },
    { name: t("optionalName3"), desc: t("optionalDesc3"), price: "79,90 €" },
    { name: t("optionalName4"), desc: t("optionalDesc4"), price: "249,00 €" },
  ];

  return (
    <section id="pricing" className="min-h-screen flex flex-col justify-center py-16 bg-surface border-t border-hairline">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
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

        {/* Tab Selectors */}
        <div className="mt-8 flex justify-center sm:mt-10">
          <div className="grid w-full max-w-xl grid-cols-3 rounded-xl border border-hairline bg-white p-1 shadow-sm">
            {(["patients", "pharmacies", "enterprise"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`min-w-0 rounded-lg px-1 py-2.5 text-[10px] font-bold uppercase leading-tight tracking-wide transition-all cursor-pointer sm:px-4 sm:text-sm sm:tracking-wider ${
                  activeTab === tab
                    ? "bg-pine-600 text-white shadow"
                    : "text-muted hover:text-ink-strong"
                }`}
              >
                {tab === "patients" && t("patients")}
                {tab === "pharmacies" && t("pharmacies")}
                {tab === "enterprise" && t("enterprise")}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12">
          {activeTab === "patients" && (
            <div className="grid gap-8 md:grid-cols-3">
              {/* Patient Basic */}
              <div className="rounded-2xl border border-hairline bg-white p-8 transition-all hover:border-pine-600 duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink-strong">{t("basic")}</h3>
                  <p className="mt-2 text-sm text-muted">{t("basicDesc")}</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    9,99 € <span className="text-sm font-semibold text-muted">/ {t("month")}</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPatientBasic0")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPatientBasic1")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPatientBasic2")}
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/patient"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  {t("startBasic")}
                </Link>
              </div>

              {/* Patient Plus */}
              <div className="relative rounded-2xl border-2 border-pine-600 bg-white p-8 shadow-xl flex flex-col justify-between">
                <span className="absolute -top-3.5 right-6 rounded-full bg-pine-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  {t("popular")}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink-strong">{t("plus")}</h3>
                  <p className="mt-2 text-sm text-muted">{t("plusDesc")}</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    29,99 € <span className="text-sm font-semibold text-muted">/ {t("month")}</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPatientPlus0")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPatientPlus1")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPatientPlus2")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPatientPlus3")}
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/patient"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  {t("startPlus")}
                </Link>
              </div>

              {/* Patient Premium */}
              <div className="rounded-2xl border border-hairline bg-white p-8 transition-all hover:border-pine-600 duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink-strong">{t("premium")}</h3>
                  <p className="mt-2 text-sm text-muted">{t("premiumDesc")}</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    49,99 € <span className="text-sm font-semibold text-muted">/ {t("month")}</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPatientPremium0")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPatientPremium1")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPatientPremium2")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPatientPremium3")}
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/patient"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  {t("startPremium")}
                </Link>
              </div>
            </div>
          )}

          {activeTab === "pharmacies" && (
            <div className="grid gap-8 md:grid-cols-3">
              {/* Flex */}
              <div className="rounded-2xl border border-hairline bg-white p-8 transition-all hover:border-pine-600 duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink-strong">{t("flex")}</h3>
                  <p className="mt-2 text-sm text-muted">{t("flexDesc")}</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    449 € <span className="text-sm font-semibold text-muted">{t("netto")} / {t("month")}</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPharmacyFlex0")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPharmacyFlex1")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPharmacyFlex2")}
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/pharmacy"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  {t("selectFlex")}
                </Link>
              </div>

              {/* S Pack */}
              <div className="relative rounded-2xl border-2 border-pine-600 bg-white p-8 shadow-xl flex flex-col justify-between">
                <span className="absolute -top-3.5 right-6 rounded-full bg-pine-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  {t("growth")}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink-strong">{t("flashbackS")}</h3>
                  <p className="mt-2 text-sm text-muted">{t("flashbackSDesc")}</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    899 € <span className="text-sm font-semibold text-muted">{t("netto")} / {t("month")}</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPharmacyS0")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPharmacyS1")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPharmacyS2")}
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/pharmacy"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  {t("selectS")}
                </Link>
              </div>

              {/* M Pack */}
              <div className="rounded-2xl border border-hairline bg-white p-8 transition-all hover:border-pine-600 duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink-strong">{t("flashbackM")}</h3>
                  <p className="mt-2 text-sm text-muted">{t("flashbackMDesc")}</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    1.599 € <span className="text-sm font-semibold text-muted">{t("netto")} / {t("month")}</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPharmacyM0")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPharmacyM1")}
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      {t("bulletPharmacyM2")}
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/pharmacy"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  {t("selectM")}
                </Link>
              </div>
            </div>
          )}

          {activeTab === "enterprise" && (
            <div className="mx-auto max-w-3xl rounded-2xl border border-hairline bg-white p-4 shadow-sm sm:p-8">
              <h3 className="text-xl font-bold text-ink-strong text-center">{t("enterpriseTitle")}</h3>
              <p className="mt-2 text-sm text-muted text-center max-w-md mx-auto">
                {t("enterpriseDesc")}
              </p>

              <div className="mt-6 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline sm:hidden">
                {[
                  { volume: `1 – 500 ${t("reviews")}`, price: `8,00 € ${t("netto")}` },
                  { volume: `501 – 1.500 ${t("reviews")}`, price: `6,50 € ${t("netto")}` },
                  { volume: `1.501+ ${t("reviews")}`, price: `5,00 € ${t("netto")}`, capped: true },
                ].map((tier) => (
                  <div key={tier.volume} className={`p-4 ${tier.capped ? "bg-mint/10" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 font-semibold text-ink-strong">{tier.volume}</span>
                      <span className="shrink-0 text-end font-bold text-pine-600">{tier.price}</span>
                    </div>
                    {tier.capped ? (
                      <span className="mt-2 inline-flex rounded-full bg-pine-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                        {t("priceCapLimit")}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-8 hidden overflow-hidden rounded-xl border border-hairline sm:block">
                <table className="w-full text-start text-sm">
                  <thead className="bg-surface text-ink-strong uppercase tracking-wider text-xs font-bold border-b border-hairline">
                    <tr>
                      <th className="px-6 py-4">{t("enterpriseVol")}</th>
                      <th className="px-6 py-4 text-right">{t("enterprisePrice")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    <tr>
                      <td className="px-6 py-4 font-semibold">1 – 500 {t("reviews")}</td>
                      <td className="px-6 py-4 text-right font-bold text-pine-600">8,00 € {t("netto")}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-semibold">501 – 1.500 {t("reviews")}</td>
                      <td className="px-6 py-4 text-right font-bold text-pine-600">6,50 € {t("netto")}</td>
                    </tr>
                    <tr className="bg-mint/10">
                      <td className="px-6 py-4 font-semibold flex items-center gap-2">
                        1.501+ {t("reviews")}
                        <span className="rounded-full bg-pine-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                          {t("priceCapLimit")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-pine-600">5,00 € {t("netto")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-xl bg-[#eef2fe] border border-info/20 p-4 text-xs leading-relaxed text-info">
                <p className="font-bold flex items-center gap-1">
                  <span aria-hidden className="msym text-[16px]">info</span>
                  {t("enterpriseGuaranteeTitle")}
                </p>
                <p className="mt-1">
                  {t("enterpriseGuaranteeDesc")}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs font-bold text-ink-strong uppercase tracking-wide">
                <span className="flex items-center gap-1"><span className="msym text-[16px] text-pine-600 font-normal">api</span> {t("api")}</span>
                <span className="flex items-center gap-1"><span className="msym text-[16px] text-pine-600 font-normal">webhook</span> {t("webhooks")}</span>
                <span className="flex items-center gap-1"><span className="msym text-[16px] text-pine-600 font-normal">hub</span> {t("automation")}</span>
                <span className="flex items-center gap-1"><span className="msym text-[16px] text-pine-600 font-normal">workspace_premium</span> {t("coBranding")}</span>
              </div>
              
              <a
                href="mailto:info@cannathera.de?subject=Enterprise%20Integration%20Request"
                className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine shadow-md"
              >
                {t("reqEnterprise")}
              </a>
            </div>
          )}
        </div>

        {/* Optional Services Table */}
        <div className="mt-16 mx-auto max-w-4xl">
          <h3 className="font-display text-xl font-bold text-pine text-center">{t("optionalsTitle")}</h3>
          <p className="mt-1.5 text-xs text-muted text-center">{t("optionalsDesc")}</p>
          <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-white shadow-sm">
            <div className="divide-y divide-hairline md:hidden">
              {optionals.map((opt, i) => (
                <article key={i} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="min-w-0 font-bold text-ink-strong">{opt.name}</h4>
                    <span className="shrink-0 rounded-full bg-mint/25 px-2.5 py-1 text-xs font-bold text-pine-600">
                      {opt.price}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{opt.desc}</p>
                </article>
              ))}
            </div>
            <table className="hidden w-full text-start text-sm md:table">
              <thead className="bg-surface text-ink-strong uppercase tracking-wider text-xs font-bold border-b border-hairline">
                <tr>
                  <th className="px-6 py-4">{t("optionalsColName")}</th>
                  <th className="px-6 py-4">{t("optionalsColDesc")}</th>
                  <th className="px-6 py-4 text-right">{t("optionalsColPrice")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {optionals.map((opt, i) => (
                  <tr key={i} className="hover:bg-surface/50">
                    <td className="px-6 py-4 font-bold text-ink-strong">{opt.name}</td>
                    <td className="px-6 py-4 text-xs text-muted leading-relaxed">{opt.desc}</td>
                    <td className="px-6 py-4 text-right font-bold text-pine-600 whitespace-nowrap">{opt.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
