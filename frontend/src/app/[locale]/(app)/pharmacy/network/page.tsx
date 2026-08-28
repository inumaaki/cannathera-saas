"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/layout";
import { TextField } from "@/components/ui/fields";

type PhysicianPractice = {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  memberships: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }[];
};

export default function PharmacyNetworkPage() {
  const t = useTranslations("pharmacy.network");
  const [practices, setPractices] = useState<PhysicianPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const q = query.trim();
        const data = await api<PhysicianPractice[]>(
          `/pharmacy/network/physicians${q ? `?q=${encodeURIComponent(q)}` : ""}`,
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
      ) : practices.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-hairline bg-surface/50">
          <p className="text-sm font-semibold text-muted">{t("noResults")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {practices.map((practice) => (
            <Card key={practice.id} className="flex flex-col p-5 hover:border-pine/30 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
                  <span className="msym text-[24px]">medical_services</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-ink-strong">
                    {practice.name}
                  </h3>
                  {practice.city && (
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      <span className="msym text-[16px]">location_on</span>
                      {practice.city}
                    </p>
                  )}
                </div>
              </div>

              {practice.description && (
                <p className="mt-4 line-clamp-2 text-sm text-ink">{practice.description}</p>
              )}

              <div className="mt-6 space-y-2 border-t border-hairline pt-4">
                {practice.email && (
                  <a
                    href={`mailto:${practice.email}`}
                    className="flex items-center gap-3 text-sm font-semibold text-pine-600 hover:underline"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-pine-50 text-pine-600">
                      <span className="msym text-[18px]">mail</span>
                    </span>
                    {practice.email}
                  </a>
                )}
                {practice.phone && (
                  <a
                    href={`tel:${practice.phone}`}
                    className="flex items-center gap-3 text-sm font-semibold text-pine-600 hover:underline"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-pine-50 text-pine-600">
                      <span className="msym text-[18px]">phone</span>
                    </span>
                    {practice.phone}
                  </a>
                )}
                {practice.website && (
                  <a
                    href={practice.website.startsWith("http") ? practice.website : `https://${practice.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-sm font-semibold text-pine-600 hover:underline"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-pine-50 text-pine-600">
                      <span className="msym text-[18px]">language</span>
                    </span>
                    {practice.website}
                  </a>
                )}
              </div>

              {practice.memberships.length > 0 && (
                <div className="mt-4 border-t border-hairline pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                    {t("doctors")}
                  </p>
                  <ul className="space-y-1">
                    {practice.memberships.map((m) => (
                      <li key={m.user.id} className="text-sm text-ink-strong">
                        Dr. {m.user.firstName} {m.user.lastName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
