"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { PERMISSIONS, ROLE_PRESETS, type OrgRole } from "@cannathera/shared";

export type Member = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  orgRole: string;
  permissions: string[];
  pending: boolean;
  active: boolean;
  since: string;
};

export type TeamLabels = {
  roleLabel: string;
  permissionsLabel: string;
  roleHint: string;
  edit: string;
  save: string;
  saved: string;
  cancel: string;
  roles: Record<string, string>;
  perms: Record<string, string>;
};

/* One team member row + inline role/permission editor (admin only). */
export function MemberRow({
  member,
  isSelf,
  labels,
  statusActive,
  statusPending,
  since,
}: Readonly<{
  member: Member;
  isSelf: boolean;
  labels: TeamLabels;
  statusActive: string;
  statusPending: string;
  since: string;
}>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orgRole, setOrgRole] = useState(member.orgRole);
  const [perms, setPerms] = useState<string[]>(member.permissions);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  function applyPreset(role: string) {
    setOrgRole(role);
    const preset = ROLE_PRESETS[role as OrgRole];
    if (preset) setPerms([...preset]);
  }

  function toggle(p: string) {
    setPerms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  async function handleSave() {
    setPending(true);
    try {
      await api(`/doctor/team/${member.membershipId}`, {
        method: "PATCH",
        body: { orgRole, permissions: perms },
      });
      setSaved(true);
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <tr className="border-t border-hairline align-middle">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint/40 font-bold text-pine">
              {(member.name || member.email)
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-ink-strong">{member.name || member.email}</p>
              <p className="truncate text-xs text-muted">{member.email}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 font-semibold text-ink-strong">
          {labels.roles[member.orgRole] ?? member.orgRole}
        </td>
        <td className="px-6 py-4">
          <span className="rounded-full bg-[#eef1f8] px-3 py-1 text-xs font-bold text-ink-strong">
            {member.permissions.length} / {PERMISSIONS.length}
          </span>
        </td>
        <td className="px-6 py-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
              member.pending ? "bg-[#fdf3d7] text-gold" : "bg-mint/40 text-pine"
            }`}
          >
            ● {member.pending ? statusPending : statusActive}
          </span>
          <p className="mt-1 font-mono text-xs text-muted">{since}</p>
        </td>
        <td className="px-6 py-4 text-end">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-pine-600 px-4 py-2 text-xs font-bold text-pine-600 hover:bg-mint/20"
          >
            {saved && !open ? labels.saved : labels.edit}
          </button>
        </td>
      </tr>

      {open ? (
        <tr className="border-t border-hairline bg-surface/60">
          <td colSpan={5} className="px-6 py-5">
            <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
              <div>
                <label
                  htmlFor={`role-${member.membershipId}`}
                  className="block text-sm font-semibold text-ink-strong"
                >
                  {labels.roleLabel}
                </label>
                <select
                  id={`role-${member.membershipId}`}
                  value={orgRole}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600"
                >
                  {Object.keys(ROLE_PRESETS).map((r) => (
                    <option key={r} value={r}>
                      {labels.roles[r] ?? r}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-relaxed text-muted">{labels.roleHint}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-ink-strong">
                  {labels.permissionsLabel}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {PERMISSIONS.map((p) => {
                    const checked = perms.includes(p);
                    const locked = isSelf && p === "settings:team";
                    return (
                      <label
                        key={p}
                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm ${
                          checked ? "border-pine-600 bg-mint/15" : "border-hairline bg-white"
                        } ${locked ? "opacity-60" : "cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={() => toggle(p)}
                          className="size-4 accent-(--color-pine-600)"
                        />
                        <span className="text-ink-strong">{labels.perms[p] ?? p}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={pending}
                    className="h-11 rounded-lg bg-brand px-5 font-bold text-white hover:bg-pine disabled:opacity-60"
                  >
                    {labels.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-11 rounded-lg px-4 font-bold text-ink-strong hover:bg-white"
                  >
                    {labels.cancel}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
