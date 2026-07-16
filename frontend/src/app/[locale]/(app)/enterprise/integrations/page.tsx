import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import {
  IntegrationsPanel,
  type ApiKeyRow,
  type DeliveryRow,
  type WebhookRow,
} from "@/components/enterprise/IntegrationsPanel";

type Status = {
  zoom: { status: string; sessions: number };
  zapier: { status: string; hooks: number };
  webhooks: { status: string; active: number; successRate: number | null };
  restApi: { status: string; version: string; activeKeys: number };
};

/* Figma 8.4 — Platform Connectivity. */
export default async function EnterpriseIntegrations({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, status, keys, webhooks, deliveries] = await Promise.all([
    getTranslations("enterprise.integrations"),
    apiServer<Status>("/enterprise/integrations/status"),
    apiServer<ApiKeyRow[]>("/enterprise/integrations/keys"),
    apiServer<WebhookRow[]>("/enterprise/integrations/webhooks"),
    apiServer<DeliveryRow[]>("/enterprise/integrations/deliveries?limit=12"),
  ]);

  const cards = [
    {
      icon: "videocam",
      tint: "bg-[#eef2fe] text-info",
      title: t("zoom"),
      text: t("zoomText"),
      // Honest: Zoom is not wired until the client provides credentials (M9).
      badge: t("statusPlanned"),
      badgeTone: "bg-[#eef1f8] text-muted",
      foot: t("sessions", { count: status?.zoom.sessions ?? 0 }),
    },
    {
      icon: "bolt",
      tint: "bg-[#fdece0] text-accent-print",
      title: t("zapier"),
      text: t("zapierText"),
      badge:
        status?.zapier.status === "connected" ? t("statusConnected") : t("statusInactive"),
      badgeTone:
        status?.zapier.status === "connected"
          ? "bg-mint/40 text-pine"
          : "bg-[#eef1f8] text-muted",
      foot: t("statusActive", { count: status?.zapier.hooks ?? 0 }),
    },
    {
      icon: "webhook",
      tint: "bg-mint/30 text-pine-600",
      title: t("webhooks"),
      text: t("webhooksText"),
      badge: t("statusActive", { count: status?.webhooks.active ?? 0 }),
      badgeTone: "bg-mint/40 text-pine",
      foot:
        status?.webhooks.successRate != null
          ? t("successRate", { rate: status.webhooks.successRate })
          : "—",
    },
    {
      icon: "api",
      tint: "bg-[#eef1f8] text-ink-strong",
      title: t("restApi"),
      text: t("restApiText"),
      badge: t("statusOperational"),
      badgeTone: "bg-mint/40 text-pine",
      foot: t("activeKeys", { count: status?.restApi.activeKeys ?? 0 }),
    },
  ];

  return (
    <>
      <div>
        <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
        <p className="mt-1 max-w-3xl text-muted">{t("subtitle")}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.title}
            className="cw-watermark rounded-xl border border-hairline bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <span
                aria-hidden
                className={`msym flex size-11 items-center justify-center rounded-xl text-[22px] ${c.tint}`}
              >
                {c.icon}
              </span>
              <span
                className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${c.badgeTone}`}
              >
                {c.badge}
              </span>
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-pine">{c.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{c.text}</p>
            <p className="mt-3 border-t border-dashed border-hairline pt-3 font-mono text-xs font-bold text-ink-strong">
              {c.foot}
            </p>
          </div>
        ))}
      </div>

      <IntegrationsPanel
        keys={keys ?? []}
        webhooks={webhooks ?? []}
        deliveries={deliveries ?? []}
      />
    </>
  );
}
