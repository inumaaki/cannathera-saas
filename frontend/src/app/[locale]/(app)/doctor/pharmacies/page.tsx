"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/layout";
import Link from "next/link";

type OperatingHour = { day: string; open: string; close: string };

type PharmacyNetwork = {
  id: string;
  name: string;
  postalCode: string | null;
  city: string | null;
  street: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  distanceKm: number;
  availableStrainsCount: number;
  description: string | null;
  operatingHours: OperatingHour[] | null;
};

function ContactRow({ icon, href, label }: { icon: string; href: string; label: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="flex items-center gap-3 rounded-lg p-2 text-sm font-semibold text-pine-600 hover:bg-pine/5 hover:underline"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pine/10 text-pine">
        <span className="msym text-[18px]">{icon}</span>
      </span>
      <span className="truncate">{label}</span>
    </a>
  );
}

function PharmacyDrawer({
  pharmacy,
  onClose,
  t,
}: {
  pharmacy: PharmacyNetwork | null;
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pharmacy) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pharmacy, onClose]);

  if (!pharmacy) return null;

  const address = [pharmacy.street, pharmacy.postalCode, pharmacy.city].filter(Boolean).join(", ");
  const hours: OperatingHour[] = Array.isArray(pharmacy.operatingHours)
    ? (pharmacy.operatingHours as OperatingHour[])
    : [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-label={pharmacy.name}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl ring-1 ring-hairline"
      >
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-hairline px-6 py-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
            <span className="msym text-[26px]">local_pharmacy</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold text-ink-strong leading-tight">{pharmacy.name}</h2>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
              <span className="msym text-[14px]">location_on</span>
              {pharmacy.distanceKm} km entfernt{pharmacy.city ? ` · ${pharmacy.city}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink-strong"
            aria-label="Close"
          >
            <span className="msym text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 space-y-6 px-6 py-5">
          {/* Badge */}
          <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            {pharmacy.availableStrainsCount} Blüten verfügbar
          </span>

          {pharmacy.description && (
            <p className="text-sm text-ink leading-relaxed">{pharmacy.description}</p>
          )}

          {/* Contact */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              {t("contact") || "Kontakt"}
            </p>
            <div className="space-y-1">
              {pharmacy.phone && <ContactRow icon="phone" href={`tel:${pharmacy.phone}`} label={pharmacy.phone} />}
              {pharmacy.email && <ContactRow icon="mail" href={`mailto:${pharmacy.email}`} label={pharmacy.email} />}
              {pharmacy.website && (
                <ContactRow
                  icon="language"
                  href={pharmacy.website.startsWith("http") ? pharmacy.website : `https://${pharmacy.website}`}
                  label={pharmacy.website}
                />
              )}
              {!pharmacy.phone && !pharmacy.email && !pharmacy.website && (
                <p className="text-sm text-muted italic">{t("noContact") || "Keine Kontaktdaten hinterlegt."}</p>
              )}
            </div>
          </div>

          {/* Address */}
          {address && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                {t("address") || "Adresse"}
              </p>
              <div className="rounded-xl border border-hairline bg-surface/40 p-4">
                {pharmacy.street && <p className="text-sm font-semibold text-ink-strong">{pharmacy.street}</p>}
                <p className="text-sm text-muted">{[pharmacy.postalCode, pharmacy.city].filter(Boolean).join(" ")}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-pine-600 hover:underline"
                >
                  <span className="msym text-[14px]">map</span>
                  {t("viewOnMap") || "Auf Karte anzeigen"}
                </a>
              </div>
            </div>
          )}

          {/* Opening hours */}
          {hours.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                {t("openingHours") || "Öffnungszeiten"}
              </p>
              <div className="overflow-hidden rounded-xl border border-hairline">
                <table className="w-full text-sm">
                  <tbody>
                    {hours.map((h, i) => (
                      <tr
                        key={i}
                        className={`border-t border-hairline first:border-t-0 ${i % 2 === 0 ? "bg-white" : "bg-surface/30"}`}
                      >
                        <td className="px-4 py-2.5 font-semibold text-ink-strong">{h.day}</td>
                        <td className="px-4 py-2.5 text-end text-muted">{h.open} – {h.close}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chat CTA */}
          <Link
            href={`/doctor/chat/${pharmacy.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-white px-4 py-2.5 font-bold text-ink-strong shadow-sm hover:bg-surface/50"
          >
            <span className="msym text-[18px]">chat</span>
            {t("chatButton") || "Nachricht senden"}
          </Link>
        </div>
      </div>
    </>
  );
}

export default function DoctorPharmaciesPage() {
  const t = useTranslations("doctor.pharmacies");
  const [pharmacies, setPharmacies] = useState<PharmacyNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PharmacyNetwork | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<PharmacyNetwork[]>("/doctor/pharmacies");
        setPharmacies(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <PharmacyDrawer pharmacy={selected} onClose={() => setSelected(null)} t={t} />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-strong">{t("title") || "Apotheken-Übersicht"}</h1>
            <p className="mt-1 text-sm text-muted">
              {t("subtitle") || "Übersicht lokaler Partner-Apotheken für Ihre Patienten."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-hairline bg-surface/50">
            <span className="msym animate-spin text-[32px] text-muted">refresh</span>
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-hairline bg-surface/50">
            <p className="text-sm font-semibold text-muted">{t("noResults") || "Keine Apotheken in der Nähe gefunden."}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pharmacies.map((pharmacy) => (
              <button
                key={pharmacy.id}
                type="button"
                onClick={() => setSelected(pharmacy)}
                className="text-start"
              >
                <Card className="flex h-full cursor-pointer flex-col p-5 transition-all hover:border-pine/40 hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
                      <span className="msym text-[24px]">local_pharmacy</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold text-ink-strong">{pharmacy.name}</h3>
                      <p className="flex items-center gap-1.5 text-sm text-muted">
                        <span className="msym text-[16px]">location_on</span>
                        {pharmacy.distanceKm} km
                        {pharmacy.city && ` • ${pharmacy.city}`}
                      </p>
                    </div>
                    <span className="msym shrink-0 text-[18px] text-muted">chevron_right</span>
                  </div>

                  {pharmacy.description && (
                    <p className="mt-4 line-clamp-2 text-sm text-ink">{pharmacy.description}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      {pharmacy.availableStrainsCount} Blüten verfügbar
                    </span>
                    {pharmacy.phone && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pine/10 px-2.5 py-1 text-xs font-semibold text-pine">
                        <span className="msym text-[12px]">phone</span>
                        {pharmacy.phone}
                      </span>
                    )}
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
