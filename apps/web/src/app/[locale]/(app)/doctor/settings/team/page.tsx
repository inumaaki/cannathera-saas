import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { requirePermission } from "@/lib/permissions";
import { getSessionUser } from "@/lib/session";
import { InviteDialog } from "./InviteDialog";
import { MemberRow, type Member } from "./MemberRow";

type Org = { id: string; name: string };

/* Figma 5.7 Team Management — real members, roles + per-member permissions. */
export default async function SettingsTeam({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const denied = await requirePermission("settings:team");
  if (denied) return denied;

  const [t, format, me, org, members] = await Promise.all([
    getTranslations("doctor.settings"),
    getFormatter(),
    getSessionUser(),
    apiServer<Org>("/doctor/practice"),
    apiServer<Member[]>("/doctor/team"),
  ]);

  const list = members ?? [];
  const admins = list.filter((m) => m.orgRole === "ADMIN").length;
  const pending = list.filter((m) => m.pending).length;

  const roleLabels = {
    ADMIN: t("roles.ADMIN"),
    DOCTOR: t("roles.DOCTOR"),
    ASSISTANT: t("roles.ASSISTANT"),
    VIEWER: t("roles.VIEWER"),
  };
  const permLabels = Object.fromEntries(
    (
      [
        "patients:view",
        "patients:create",
        "patients:note",
        "alerts:view",
        "alerts:acknowledge",
        "appointments:manage",
        "reports:view",
        "settings:practice",
        "settings:team",
        "compliance:view",
      ] as const
    ).map((p) => [p, t(`perms.${p}`)]),
  );
  const labels = {
    roleLabel: t("roleLabel"),
    permissionsLabel: t("permissionsLabel"),
    roleHint: t("roleHint"),
    edit: t("editMember"),
    save: t("saveMember"),
    saved: t("memberSaved"),
    cancel: t("cancel"),
    roles: roleLabels,
    perms: permLabels,
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-pine">{t("teamTitle")}</h2>
          <p className="mt-1 text-muted">{t("teamSub")}</p>
        </div>
        <InviteDialog />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <StatCard
          icon="groups"
          tint="bg-mint/30 text-pine-600"
          label={t("totalStaff")}
          value={t("activeCount", { count: list.filter((m) => m.active).length })}
        />
        <StatCard
          icon="mail"
          tint="bg-[#fdf3d7] text-gold"
          label={t("pendingInvites")}
          value={t("sent", { count: pending })}
        />
        <StatCard
          icon="admin_panel_settings"
          tint="bg-[#eef2fe] text-info"
          label={t("adminRoles")}
          value={t("assigned", { count: admins })}
        />
      </div>

      <section className="cw-watermark mt-5 overflow-x-auto rounded-xl border border-hairline bg-white">
        <h3 className="border-b border-hairline px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
          {t("staffDirectory")} — {org?.name}
        </h3>
        <table className="w-full min-w-[54rem] text-sm">
          <thead>
            <tr className="bg-[#eef1f8] text-xs font-bold uppercase tracking-wide text-ink-strong">
              <th className="px-6 py-3 text-start">{t("colName")}</th>
              <th className="px-6 py-3 text-start">{t("colRole")}</th>
              <th className="px-6 py-3 text-start">{t("permissionsLabel")}</th>
              <th className="px-6 py-3 text-start">{t("colStatus")}</th>
              <th className="px-6 py-3 text-end">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <MemberRow
                key={m.membershipId}
                member={m}
                isSelf={m.userId === me?.id}
                labels={labels}
                statusActive={t("statusActive")}
                statusPending={t("statusPendingSetup")}
                since={format.dateTime(new Date(m.since), {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              />
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function StatCard({
  icon,
  tint,
  label,
  value,
}: Readonly<{ icon: string; tint: string; label: string; value: string }>) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-5">
      <span aria-hidden className={`msym flex size-11 items-center justify-center rounded-lg text-[22px] ${tint}`}>
        {icon}
      </span>
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-sage-900">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink-strong">{value}</p>
    </div>
  );
}
