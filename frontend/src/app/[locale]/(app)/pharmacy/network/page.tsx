"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/layout";
import { TextField } from "@/components/ui/fields";

type OperatingHour = {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
};

type PhysicianPractice = {
  id: string;
  name: string;
  city: string | null;
  street: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  specialty?: string | null;
  distanceKm?: number;
  operatingHours: OperatingHour[] | null;
  branding?: any;
  memberships: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }[];
};

function ContactRow({
  icon,
  href,
  label,
}: {
  icon: string;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-3 rounded-lg p-2 text-sm font-semibold text-pine-600 hover:bg-pine/5 hover:underline"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pine/10 text-pine">
        <span className="msym text-[18px]">{icon}</span>
      </span>
      <span className="truncate">{label}</span>
    </a>
  );
}

function PhysicianDrawer({
  practice,
  onClose,
  t,
}: {
  practice: PhysicianPractice | null;
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!practice) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [practice, onClose]);

  if (!practice) return null;

  const address = [practice.street, practice.postalCode, practice.city]
    .filter(Boolean)
    .join(", ");

  const hours: OperatingHour[] = Array.isArray(practice.operatingHours)
    ? (practice.operatingHours as OperatingHour[])
    : [];

  const specialty = practice.specialty || "Allgemeinmedizin";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-label={practice.name}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl ring-1 ring-hairline"
      >
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-hairline px-6 py-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
            <span className="msym text-[26px]">medical_services</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold text-ink-strong leading-tight">
              {practice.name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted flex-wrap">
              <span className="msym text-[14px]">location_on</span>
              <span>
                {practice.city
                  ? [practice.postalCode, practice.city].filter(Boolean).join(" ")
                  : t("address")}
              </span>
              {practice.distanceKm != null && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-pine/10 px-2.5 py-0.5 text-xs font-bold text-pine">
                  <span className="msym text-[12px]">near_me</span>
                  {practice.distanceKm} km entfernt
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink-strong"
            aria-label={t("closed")}
          >
            <span className="msym text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 space-y-6 px-6 py-5">
          {/* Specialty (Item 7 Requirement) */}
          <div className="rounded-xl border border-pine/20 bg-pine-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pine-700">
              <span className="msym text-[16px]">stethoscope</span>
              {t("specialty")}
            </div>
            <p className="mt-1.5 text-base font-bold text-ink-strong">
              {specialty}
            </p>
            {practice.description && (
              <p className="mt-2 text-xs text-ink leading-relaxed">
                {practice.description}
              </p>
            )}
          </div>

          {/* Location & Address (Item 7 Requirement) */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              {t("address")}
            </p>
            <div className="rounded-xl border border-hairline bg-surface/40 p-4">
              {practice.street && (
                <p className="text-sm font-semibold text-ink-strong">
                  {practice.street}
                </p>
              )}
              <p className="text-sm text-muted">
                {[practice.postalCode, practice.city].filter(Boolean).join(" ")}
              </p>
              {address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    address + ", Deutschland"
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-pine-600 hover:underline"
                >
                  <span className="msym text-[15px]">map</span>
                  {t("viewOnMap")}
                </a>
              )}
            </div>
          </div>

          {/* Opening Hours (Item 7 Requirement) */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              {t("openingHours")}
            </p>
            {hours.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-hairline">
                <table className="w-full text-sm">
                  <tbody>
                    {hours.map((h, i) => {
                      const isClosed =
                        h.closed ||
                        h.open === "Geschlossen" ||
                        !h.open ||
                        h.open.trim() === "";
                      return (
                        <tr
                          key={i}
                          className={`border-t border-hairline first:border-t-0 ${
                            i % 2 === 0 ? "bg-white" : "bg-surface/30"
                          }`}
                        >
                          <td className="px-4 py-2.5 font-semibold text-ink-strong">
                            {h.day}
                          </td>
                          <td className="px-4 py-2.5 text-end text-muted">
                            {isClosed ? (
                              <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted">
                                {t("closed")}
                              </span>
                            ) : (
                              <span>
                                {h.open} {h.close ? `– ${h.close}` : "Uhr"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-hairline bg-surface/30 p-4 text-center">
                <p className="text-xs text-muted">{t("noOpeningHours")}</p>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              {t("contact")}
            </p>
            <div className="space-y-1 rounded-xl border border-hairline bg-white p-2">
              {practice.phone && (
                <ContactRow
                  icon="phone"
                  href={`tel:${practice.phone}`}
                  label={practice.phone}
                />
              )}
              {practice.email && (
                <ContactRow
                  icon="mail"
                  href={`mailto:${practice.email}`}
                  label={practice.email}
                />
              )}
              {practice.website && (
                <ContactRow
                  icon="language"
                  href={
                    practice.website.startsWith("http")
                      ? practice.website
                      : `https://${practice.website}`
                  }
                  label={practice.website}
                />
              )}
              {!practice.phone && !practice.email && !practice.website && (
                <p className="p-3 text-xs italic text-muted">
                  {t("noContact")}
                </p>
              )}
            </div>
          </div>

          {/* Practicing Physicians */}
          {practice.memberships.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                {t("physicians")}
              </p>
              <div className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
                {practice.memberships.map((m) => (
                  <div
                    key={m.user.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex size-9 items-center justify-center rounded-full bg-pine/10 text-pine font-bold text-xs">
                      Dr
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-strong">
                        Dr. {m.user.firstName} {m.user.lastName}
                      </p>
                      {m.user.email && (
                        <p className="text-xs text-muted">{m.user.email}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct CTA: Start Chat */}
          <div className="pt-2">
            <Link
              href={`/pharmacy/chat/${practice.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-bold text-white shadow-sm transition hover:bg-pine"
            >
              <span className="msym text-[20px]">chat</span>
              {t("startChat")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PharmacyNetworkPage() {
  const t = useTranslations("pharmacy.network");
  const [practices, setPractices] = useState<PhysicianPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PhysicianPractice | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const q = query.trim();
        const data = await api<PhysicianPractice[]>(
          `/pharmacy/network/physicians${
            q ? `?q=${encodeURIComponent(q)}` : ""
          }`
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-strong">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <div className="w-full sm:w-80">
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
          <span className="msym animate-spin text-[32px] text-muted">
            refresh
          </span>
        </div>
      ) : practices.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-hairline bg-surface/50">
          <p className="text-sm font-semibold text-muted">{t("noResults")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {practices.map((practice) => {
            const specialty = practice.specialty || "Allgemeinmedizin";
            const fullAddress = [
              practice.street,
              practice.postalCode,
              practice.city,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <Card
                key={practice.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(practice)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(practice);
                  }
                }}
                className="group flex cursor-pointer flex-col p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-pine/40 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pine/30"
              >
                {/* Card Top */}
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine transition group-hover:bg-pine group-hover:text-white">
                    <span className="msym text-[24px]">medical_services</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-ink-strong group-hover:text-pine">
                      {practice.name}
                    </h3>
                    {practice.city && (
                      <p className="flex items-center gap-1.5 text-xs text-muted">
                        <span className="msym text-[14px]">location_on</span>
                        {practice.city}
                      </p>
                    )}
                  </div>
                </div>

                {/* Specialty and Distance Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-pine-50 px-2.5 py-1 text-xs font-semibold text-pine-700 ring-1 ring-inset ring-pine-600/20">
                    <span className="msym text-[14px]">stethoscope</span>
                    {specialty}
                  </span>
                  {practice.distanceKm != null && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                      <span className="msym text-[14px]">near_me</span>
                      {practice.distanceKm} km
                    </span>
                  )}
                  {Array.isArray(practice.operatingHours) &&
                    practice.operatingHours.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        <span className="msym text-[13px]">schedule</span>
                        {t("openingHours")}
                      </span>
                    )}
                </div>

                {/* Address snippet if available */}
                {fullAddress && (
                  <p className="mt-3 text-xs text-muted line-clamp-1">
                    <span className="font-semibold text-ink-strong">
                      Adresse:
                    </span>{" "}
                    {fullAddress}
                  </p>
                )}

                {practice.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-ink leading-relaxed">
                    {practice.description}
                  </p>
                )}

                {/* Card Bottom / Contacts */}
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between border-t border-hairline pt-3 text-xs text-muted">
                    <span>
                      {practice.memberships.length > 0
                        ? `${practice.memberships.length} ${
                            practice.memberships.length === 1 ? "Arzt" : "Ärzte"
                          }`
                        : "Praxis"}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-pine group-hover:underline">
                      {t("viewDetails")}
                      <span className="msym text-[16px]">chevron_right</span>
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      <PhysicianDrawer
        practice={selected}
        onClose={() => setSelected(null)}
        t={t}
      />
    </div>
  );
}
