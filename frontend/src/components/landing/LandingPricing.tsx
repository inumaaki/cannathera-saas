"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

type PricingTab = "patients" | "pharmacies" | "enterprise";

export function LandingPricing() {
  const [activeTab, setActiveTab] = useState<PricingTab>("patients");

  const optionals = [
    { name: "Einzelner Monatsreport", desc: "Detaillierter Überblick über den aktuellen Therapieverlauf", price: "24,90 €" },
    { name: "Erweiterter PDF-Bericht", desc: "Umfassender Bericht zur Dokumentation und Auswertung", price: "19,90 €" },
    { name: "Verlaufsanalyse", desc: "Tiefgehende Analyse des Therapieverlaufs", price: "39,90 €" },
    { name: "Dokumentationspaket", desc: "Strukturierte Auswertung und ausführlicher Monatsreport", price: "79,90 €" },
    { name: "Unterstützung Kostenübernahme-Antrag", desc: "Aufbereitung relevanter Unterlagen für Ihren Antrag", price: "249,00 €" },
  ];

  return (
    <section id="pricing" className="min-h-screen flex flex-col justify-center py-16 bg-surface border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-pine-600">
            Cooperation & Models
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-pine sm:text-4xl">
            Flexible, Scalable & Transparent Pricing
          </h2>
          <p className="text-muted leading-relaxed">
            Choose the model that fits your operational scale. From self-paying patients looking for daily structure to national telemedicine platforms requiring custom API configurations.
          </p>
        </div>

        {/* Tab Selectors */}
        <div className="mt-10 flex justify-center">
          <div className="flex rounded-xl border border-hairline bg-white p-1 shadow-sm">
            {(["patients", "pharmacies", "enterprise"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-pine-600 text-white shadow"
                    : "text-muted hover:text-ink-strong"
                }`}
              >
                {tab === "patients" && "Patients"}
                {tab === "pharmacies" && "Pharmacies"}
                {tab === "enterprise" && "Telemedicine / Enterprise"}
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
                  <h3 className="text-lg font-bold text-ink-strong">CANNATHERA BASIC</h3>
                  <p className="mt-2 text-sm text-muted">Essential therapy tracking and onboarding structure.</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    9,99 € <span className="text-sm font-semibold text-muted">/ Month</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      1x Monatsreview
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Therapiedokumentation
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Alltagsintegration
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/patient"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  Start Basic Plan
                </Link>
              </div>

              {/* Patient Plus */}
              <div className="relative rounded-2xl border-2 border-pine-600 bg-white p-8 shadow-xl flex flex-col justify-between">
                <span className="absolute -top-3.5 right-6 rounded-full bg-pine-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Popular
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink-strong">CANNATHERA PLUS</h3>
                  <p className="mt-2 text-sm text-muted">Advanced symptom mapping and structured monthly reporting.</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    29,99 € <span className="text-sm font-semibold text-muted">/ Month</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      1x Monatsreview
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Erweiterte Dokumentation
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Detaillierte PDF-Berichte
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Symptom Verlaufsanalysen
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/patient"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  Start Plus Plan
                </Link>
              </div>

              {/* Patient Premium */}
              <div className="rounded-2xl border border-hairline bg-white p-8 transition-all hover:border-pine-600 duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink-strong">CANNATHERA PREMIUM</h3>
                  <p className="mt-2 text-sm text-muted">Full-scope clinical accompaniment and prioritized review channels.</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    49,99 € <span className="text-sm font-semibold text-muted">/ Month</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Vollständige Begleitung
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Erweiterte Verlaufsgrafiken
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Monatsreviews & PDF-Berichte
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Priorisierter Support
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/patient"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  Start Premium Plan
                </Link>
              </div>
            </div>
          )}

          {activeTab === "pharmacies" && (
            <div className="grid gap-8 md:grid-cols-3">
              {/* Flex */}
              <div className="rounded-2xl border border-hairline bg-white p-8 transition-all hover:border-pine-600 duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink-strong">FLEX</h3>
                  <p className="mt-2 text-sm text-muted">Digital entry for specialized cannabis dispensaries.</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    449 € <span className="text-sm font-semibold text-muted">netto / Month</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      bis zu 50 Monatsreviews
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Monatsreporting inklusive
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Patientenbegleitung
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/pharmacy"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  Select Flex Pack
                </Link>
              </div>

              {/* S Pack */}
              <div className="relative rounded-2xl border-2 border-pine-600 bg-white p-8 shadow-xl flex flex-col justify-between">
                <span className="absolute -top-3.5 right-6 rounded-full bg-pine-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Growth
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink-strong">FLASHBACK S</h3>
                  <p className="mt-2 text-sm text-muted">Engineered for pharmacies scaling patient volume.</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    899 € <span className="text-sm font-semibold text-muted">netto / Month</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      bis zu 150 Monatsreviews
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Monatsreporting inklusive
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Priorisierter Support
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/pharmacy"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  Select S Pack
                </Link>
              </div>

              {/* M Pack */}
              <div className="rounded-2xl border border-hairline bg-white p-8 transition-all hover:border-pine-600 duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink-strong">FLASHBACK M</h3>
                  <p className="mt-2 text-sm text-muted">High-volume model for clinics & dispensary networks.</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-pine">
                    1.599 € <span className="text-sm font-semibold text-muted">netto / Month</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-strong">
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      bis zu 350 Monatsreviews
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Monatsreporting inklusive
                    </li>
                    <li className="flex gap-2.5 items-center font-semibold">
                      <span className="msym text-[18px] text-pine-600">check_circle</span>
                      Premium Support
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/pharmacy"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine"
                >
                  Select M Pack
                </Link>
              </div>
            </div>
          )}

          {activeTab === "enterprise" && (
            <div className="mx-auto max-w-3xl rounded-2xl border border-hairline bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-ink-strong text-center">Volume-Based Telemedicine Tiers</h3>
              <p className="mt-2 text-sm text-muted text-center max-w-md mx-auto">
                Skalierbare Enterprise-Lösungen für Telemedizin-Plattformen & Großkunden mit voller API-Konnektivität.
              </p>

              <div className="mt-8 overflow-hidden rounded-xl border border-hairline">
                <table className="w-full text-sm text-left">
                  <thead className="bg-surface text-ink-strong uppercase tracking-wider text-xs font-bold border-b border-hairline">
                    <tr>
                      <th className="px-6 py-4">Monatliches Volumen</th>
                      <th className="px-6 py-4 text-right">Preis pro Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    <tr>
                      <td className="px-6 py-4 font-semibold">1 – 500 Reviews</td>
                      <td className="px-6 py-4 text-right font-bold text-pine-600">8,00 € netto</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-semibold">501 – 1.500 Reviews</td>
                      <td className="px-6 py-4 text-right font-bold text-pine-600">6,50 € netto</td>
                    </tr>
                    <tr className="bg-mint/10">
                      <td className="px-6 py-4 font-semibold flex items-center gap-2">
                        ab 1.501 Reviews
                        <span className="rounded-full bg-pine-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                          Price Cap Limit
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-pine-600">5,00 € netto</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-xl bg-[#eef2fe] border border-info/20 p-4 text-xs leading-relaxed text-info">
                <p className="font-bold flex items-center gap-1">
                  <span aria-hidden className="msym text-[16px]">info</span>
                  Enterprise Price Cap Guarantee:
                </p>
                <p className="mt-1">
                  Der Preis von 5,00 € netto pro Monatsreview stellt die finale Preisstufe dar. Unabhängig vom weiteren Anstieg (z. B. 10.000+ Reviews) erfolgt keine weitere Preisreduktion, was Partnern maximale Kalkulationssicherheit sichert.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs font-bold text-ink-strong uppercase tracking-wide">
                <span className="flex items-center gap-1"><span className="msym text-[16px] text-pine-600 font-normal">api</span> API-Anbindung</span>
                <span className="flex items-center gap-1"><span className="msym text-[16px] text-pine-600 font-normal">webhook</span> Webhooks</span>
                <span className="flex items-center gap-1"><span className="msym text-[16px] text-pine-600 font-normal">hub</span> Make.com/Zapier</span>
                <span className="flex items-center gap-1"><span className="msym text-[16px] text-pine-600 font-normal">workspace_premium</span> Powered by Co-Branding</span>
              </div>
              
              <a
                href="mailto:info@cannathera.de?subject=Enterprise%20Integration%20Request"
                className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-pine-600 font-bold text-white transition-colors hover:bg-pine shadow-md"
              >
                Request Enterprise Integration
              </a>
            </div>
          )}
        </div>

        {/* Optional Services Table */}
        <div className="mt-16 mx-auto max-w-4xl">
          <h3 className="font-display text-xl font-bold text-pine text-center">Optionale Einzelleistungen</h3>
          <p className="mt-1.5 text-xs text-muted text-center">Umfassende Dokumentations- und Auswertungshilfen</p>
          <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-white shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface text-ink-strong uppercase tracking-wider text-xs font-bold border-b border-hairline">
                <tr>
                  <th className="px-6 py-4">Leistung</th>
                  <th className="px-6 py-4">Beschreibung</th>
                  <th className="px-6 py-4 text-right">Preis</th>
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
