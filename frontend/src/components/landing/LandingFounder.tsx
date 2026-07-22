"use client";

import Image from "next/image";

export function LandingFounder() {
  return (
    <section id="founder" className="min-h-screen flex flex-col justify-center py-16 bg-white border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-2 lg:items-center w-full">
        {/* Left: Interactive clinical card representation or photo placeholder */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative rounded-2xl border border-hairline bg-surface p-6 shadow-xl">
            {/* Visual Badge/Mockup of Doctor-Patient Cooperation */}
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-xl bg-pine text-white">
                <span aria-hidden className="msym text-[28px]">
                  stethoscope
                </span>
              </span>
              <div>
                <p className="text-base font-bold text-pine">Dominique Larkin</p>
                <p className="text-xs text-muted">Examinierter Intensivpfleger · Gründer & Inhaber</p>
              </div>
            </div>

            {/* Blockquote */}
            <div className="relative mt-6 border-s-4 border-pine-600 bg-white px-4 py-3 rounded-r-lg">
              <span className="absolute -top-3 -left-2 font-serif text-5xl text-pine-600/10 leading-none">“</span>
              <p className="text-sm italic leading-relaxed text-ink-strong">
                Die größte Schwachstelle im gesamten Versorgungssystem ist die fehlende strukturierte Begleitung zwischen den Arztterminen.
              </p>
            </div>

            {/* Clinical Value comparison */}
            <div className="mt-6 border-t border-hairline pt-6">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted">
                <div className="p-2 border border-hairline rounded-lg bg-white">
                  <span className="block text-sm font-extrabold text-pine-600">Arzt</span>
                  behandelt
                </div>
                <div className="p-2 border border-hairline rounded-lg bg-white">
                  <span className="block text-sm font-extrabold text-pine-600">Apotheke</span>
                  versorgt
                </div>
                <div className="p-2 border-2 border-pine bg-mint/10 rounded-lg">
                  <span className="block text-sm font-extrabold text-pine">Cannathera</span>
                  begleitet
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Copy details */}
        <div className="space-y-6">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-pine-600">
            Founder & Clinical Alignment
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-pine sm:text-4xl">
            Clinically-Led Therapy Accompaniment
          </h2>
          <p className="text-muted leading-relaxed">
            Cannathera is built from actual clinical ward experience, not market spec sheets. Dominique Larkin’s background as a registered intensive care nurse ensures that every question, warning indicator, and triage flow is aligned with patient safety and practical workflow optimization.
          </p>

          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-ink-strong">Our Philosophy</h4>
            <p className="text-sm leading-relaxed text-muted">
              We do not replace physicians or pharmacists; we provide the structure they need. Patients carry out their daily lives, pharmacies supply high-grade care, and physicians manage treatment decisions. Cannathera accompanies the path between them by structuring, documenting, and transparently mapping outcomes.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="rounded-xl border border-hairline p-4 bg-surface max-w-xs flex-1">
                <h5 className="font-bold text-ink-strong text-xs uppercase tracking-wide">Medical Focus</h5>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Every check-in and tracking parameter is optimized to minimize clinician administrative load.
                </p>
              </div>
              <div className="rounded-xl border border-hairline p-4 bg-surface max-w-xs flex-1">
                <h5 className="font-bold text-ink-strong text-xs uppercase tracking-wide">Patient Safety</h5>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Intelligent triage logs automatically flag warning indicators (such as pain NRS ≥ 8).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
