import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { TeamPanel, type Member } from "@/components/enterprise/TeamPanel";
import { ProgressRing } from "@/components/patient/charts";

type Data = {
  rows: Member[];
  me: { orgRole: string; canManageTeam: boolean };
  stats: { totalActive: number; pendingInvites: number; mfaCoverage: number };
};

/* Figma 8.7 — Team Management. */
export default async function EnterpriseTeam({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, d] = await Promise.all([
    getTranslations("enterprise.team"),
    apiServer<Data>("/enterprise/team"),
  ]);

  return (
    <>
      <div>
        <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_2fr]">
        <div className="cw-watermark rounded-xl border border-hairline bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
            {t("totalActive")}
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-pine">
            {d?.stats.totalActive ?? 0}
          </p>
        </div>
        <div className="cw-watermark rounded-xl border border-hairline bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
            {t("pendingInvites")}
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-gold">
            {d?.stats.pendingInvites ?? 0}
          </p>
          <p className="mt-1 text-xs text-muted">{t("last7")}</p>
        </div>
        <div className="flex items-center gap-5 rounded-xl bg-brand p-5 text-white">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
              {t("compliance")}
            </p>
            <p className="mt-1 font-display text-2xl font-bold">
              {d?.stats.mfaCoverage ?? 0}%
            </p>
            <p className="mt-1 text-sm leading-relaxed text-white/80">
              {t("complianceNote")}
            </p>
          </div>
          <ProgressRing
            pct={d?.stats.mfaCoverage ?? 0}
            size={80}
            stroke={8}
            color="#9ef5be"
            track="rgba(255,255,255,0.18)"
          >
            <span className="font-mono text-sm font-bold text-white">
              {d?.stats.mfaCoverage ?? 0}%
            </span>
          </ProgressRing>
        </div>
      </div>

      <div className="mt-6">
        <TeamPanel
          members={d?.rows ?? []}
          canManage={d?.me.canManageTeam ?? false}
        />
      </div>

      <section className="cw-watermark mt-6 rounded-xl border border-hairline bg-[#eef2fe] p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-pine">
          <span aria-hidden className="msym text-[22px] text-info">
            info
          </span>
          {t("matrixTitle")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-strong">
          {t("matrixText")}
        </p>
      </section>
    </>
  );
}
