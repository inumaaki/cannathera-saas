"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/layout";
import Link from "next/link";

type PharmacyNetwork = {
  id: string;
  name: string;
  postalCode: string | null;
  city: string | null;
  street: string | null;
  distanceKm: number;
  availableStrainsCount: number;
  description: string | null;
  operatingHours: any;
};

export default function DoctorPharmaciesPage() {
  const t = useTranslations("doctor.pharmacies");
  const [pharmacies, setPharmacies] = useState<PharmacyNetwork[]>([]);
  const [loading, setLoading] = useState(true);

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
            <Card key={pharmacy.id} className="flex flex-col p-5 hover:border-pine/30 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
                  <span className="msym text-[24px]">local_pharmacy</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-ink-strong">
                    {pharmacy.name}
                  </h3>
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    <span className="msym text-[16px]">location_on</span>
                    {pharmacy.distanceKm} km
                    {pharmacy.city && ` • ${pharmacy.city}`}
                  </p>
                </div>
              </div>

              {pharmacy.description && (
                <p className="mt-4 line-clamp-2 text-sm text-ink">{pharmacy.description}</p>
              )}
              
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  {pharmacy.availableStrainsCount} Blüten verfügbar
                </span>
              </div>

              <div className="mt-6 flex gap-2">
                <Link 
                  href={`/doctor/chat/${pharmacy.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-white px-4 py-2 font-bold text-ink-strong shadow-sm hover:bg-surface/50"
                >
                  <span className="msym text-[18px]">chat</span>
                  {t("chatButton") || "Nachricht senden"}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
