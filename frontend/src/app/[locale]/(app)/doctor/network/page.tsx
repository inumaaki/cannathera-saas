"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/layout";
import { TextField } from "@/components/ui/fields";

type PharmacyNetwork = {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
};

export default function DoctorNetworkPage() {
  const t = useTranslations("doctor.network");
  const [pharmacies, setPractices] = useState<PharmacyNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const q = query.trim();
        const data = await api<PharmacyNetwork[]>(
          `/doctor/network/pharmacies${q ? `?q=${encodeURIComponent(q)}` : ""}`,
        );
        setPractices(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-strong">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <div className="w-full sm:w-72">
          <TextField
            label=""
            name="search"
            icon="search"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-hairline bg-surface/50">
          <span className="msym animate-spin text-[32px] text-muted">refresh</span>
        </div>
      ) : pharmacies.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-hairline bg-surface/50">
          <p className="text-sm font-semibold text-muted">{t("noResults")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} className="flex flex-col p-5 hover:border-pine/30 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
                  <span className="msym text-[24px]">medical_services</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-ink-strong">
                    {pharmacy.name}
                  </h3>
                  {pharmacy.city && (
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      <span className="msym text-[16px]">location_on</span>
                      {pharmacy.city}
                    </p>
                  )}
                </div>
              </div>

              {pharmacy.description && (
                <p className="mt-4 line-clamp-2 text-sm text-ink">{pharmacy.description}</p>
              )}

              <div className="mt-6 space-y-2 border-t border-hairline pt-4">
                {pharmacy.email && (
                  <a
                    href={`mailto:${pharmacy.email}`}
                    className="flex items-center gap-3 text-sm font-semibold text-pine-600 hover:underline"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-pine-50 text-pine-600">
                      <span className="msym text-[18px]">mail</span>
                    </span>
                    {pharmacy.email}
                  </a>
                )}
                {pharmacy.phone && (
                  <a
                    href={`tel:${pharmacy.phone}`}
                    className="flex items-center gap-3 text-sm font-semibold text-pine-600 hover:underline"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-pine-50 text-pine-600">
                      <span className="msym text-[18px]">phone</span>
                    </span>
                    {pharmacy.phone}
                  </a>
                )}
                {pharmacy.website && (
                  <a
                    href={pharmacy.website.startsWith("http") ? pharmacy.website : `https://${pharmacy.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-sm font-semibold text-pine-600 hover:underline"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-pine-50 text-pine-600">
                      <span className="msym text-[18px]">language</span>
                    </span>
                    {pharmacy.website}
                  </a>
                )}
              </div>

            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
