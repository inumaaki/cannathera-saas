"use client";

import { useCallback, useEffect, useId, useRef, useState, Fragment } from "react";
import { API_URL } from "@/lib/api";
import { useTranslations } from "next-intl";

type Subscription = {
  id: string;
  isActive: boolean;
  plan: {
    name: string;
    tier: string;
    monthlyPrice?: number;
  };
};

type Membership = {
  id: string;
  roleInOrg: string;
  orgRole: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    createdAt: string;
    mustChangePassword: boolean;
    temporaryPassword: string | null;
  };
};

type Partner = {
  id: string;
  name: string;
  type: string;
  subscriptions: Subscription[];
  memberships: Membership[];
  createdAt: string;
  settings?: {
    mandatory2fa: boolean;
  } | null;
};

type GlobalUser = {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: string;
  memberships: {
    id: string;
    org: {
      name: string;
    };
  }[];
};

type PricingPlan = {
  id: string;
  tier: string;
  name: string;
  monthlyPrice: string | number;
  reviewCap: number | null;
  isActive: boolean;
};

type AuditLog = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

type AdminSection = "partners" | "users" | "plans" | "logs";

type SelectOption = {
  value: string;
  label: string;
};

function StyledSelect({
  label,
  value,
  options,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}>) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <span id={`${id}-label`} className="block text-xs font-bold uppercase tracking-wider text-sage-950">
        {label}
      </span>
      <button
        type="button"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`mt-1.5 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border bg-surface px-3.5 py-2.5 text-start text-sm font-semibold text-ink-strong outline-none transition ${
          open
            ? "border-brand bg-white ring-4 ring-brand/10"
            : "border-hairline hover:border-sage-400 hover:bg-white"
        }`}
      >
        <span id={`${id}-value`} className="min-w-0 truncate">{selected.label}</span>
        <span
          aria-hidden
          className={`msym shrink-0 text-[20px] text-brand transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          keyboard_arrow_down
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-60 overflow-y-auto rounded-xl border border-hairline bg-white p-1.5 shadow-[0_18px_45px_rgba(0,43,35,0.18)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition ${
                  isSelected
                    ? "bg-brand text-white shadow-sm"
                    : "text-ink-strong hover:bg-surface hover:text-pine"
                }`}
              >
                <span>{option.label}</span>
                {isSelected ? <span aria-hidden className="msym shrink-0 text-[18px]">check</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const labels: Record<string, string> = {
    ALL: t("all"),
    PRACTICE: t("practice"),
    PHARMACY: t("pharmacy"),
    ENTERPRISE: t("enterprise"),
    PATIENT: t("patient"),
    DOCTOR: t("doctor"),
    ADMIN: t("admin"),
    ACTIVE: t("active"),
    INACTIVE: t("inactive"),
    SUSPENDED: t("suspended"),
  };
  const [activeTab, setActiveTab] = useState<AdminSection>("partners");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [globalUsers, setGlobalUsers] = useState<GlobalUser[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Edit Plan Price State
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState("");

  const [onboardSuccessData, setOnboardSuccessData] = useState<{ name: string; email: string; tempPassword: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    type: "PRACTICE",
    adminEmail: "",
    adminFirstName: "",
    adminLastName: "",
    planTier: "PREMIUM",
  });
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const loadTabData = useCallback(async () => {
    setLoading(true);
    setSearch("");
    try {
      if (activeTab === "partners") {
        const res = await fetch(`${API_URL}/admin/partners`, { credentials: "include" });
        if (res.ok) setPartners(await res.json());
      } else if (activeTab === "users") {
        const res = await fetch(`${API_URL}/admin/users`, { credentials: "include" });
        if (res.ok) setGlobalUsers(await res.json());
      } else if (activeTab === "plans") {
        const res = await fetch(`${API_URL}/admin/pricing-plans`, { credentials: "include" });
        if (res.ok) setPlans(await res.json());
      } else if (activeTab === "logs") {
        const res = await fetch(`${API_URL}/admin/audit-logs`, { credentials: "include" });
        if (res.ok) setLogs(await res.json());
      }
    } catch (e) {
      console.error("Failed loading admin resources", e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadTabData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadTabData]);

  useEffect(() => {
    const syncSection = () => {
      const section = new URLSearchParams(window.location.search).get("tab");
      if (
        section === "partners" ||
        section === "users" ||
        section === "plans" ||
        section === "logs"
      ) {
        setActiveTab(section);
      }
    };

    syncSection();
    window.addEventListener("popstate", syncSection);
    window.addEventListener("admin-section-change", syncSection);
    return () => {
      window.removeEventListener("popstate", syncSection);
      window.removeEventListener("admin-section-change", syncSection);
    };
  }, []);

  async function handleTogglePartner(orgId: string) {
    try {
      const res = await fetch(`${API_URL}/admin/partners/${orgId}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPartners((prev) =>
          prev.map((p) => {
            if (p.id !== orgId) return p;
            return {
              ...p,
              subscriptions: p.subscriptions.map((s) => ({ ...s, isActive: data.isActive })),
              memberships: p.memberships.map((m) => ({
                ...m,
                user: { ...m.user, isActive: data.isActive },
              })),
            };
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggle2FA(orgId: string) {
    try {
      const res = await fetch(`${API_URL}/admin/partners/${orgId}/toggle-2fa`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPartners((prev) =>
          prev.map((p) => {
            if (p.id !== orgId) return p;
            return {
              ...p,
              settings: { mandatory2fa: data.mandatory2fa },
            };
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleIssueTemporaryPassword(orgId: string, userId: string) {
    try {
      const res = await fetch(`${API_URL}/admin/partners/${orgId}/temporary-password`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { tempPassword: string };
      setPartners((current) =>
        current.map((partner) =>
          partner.id !== orgId
            ? partner
            : {
                ...partner,
                memberships: partner.memberships.map((membership) =>
                  membership.user.id === userId
                    ? {
                        ...membership,
                        user: {
                          ...membership.user,
                          temporaryPassword: data.tempPassword,
                        },
                      }
                    : membership,
                ),
              },
        ),
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function handleToggleUser(userId: string) {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setGlobalUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: data.isActive } : u))
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpdatePlan(planId: string) {
    try {
      const res = await fetch(`${API_URL}/admin/pricing-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyPrice: parseFloat(editPriceVal) }),
        credentials: "include",
      });
      if (res.ok) {
        setEditingPlanId(null);
        loadTabData();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleOnboard(e: React.FormEvent) {
    e.preventDefault();
    setFormBusy(true);
    setFormError("");
    try {
      const res = await fetch(`${API_URL}/admin/partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setOnboardSuccessData({
          name: formData.name,
          email: formData.adminEmail,
          tempPassword: data.tempPassword || "",
        });
        setFormData({
          name: "",
          type: "PRACTICE",
          adminEmail: "",
          adminFirstName: "",
          adminLastName: "",
          planTier: "PREMIUM",
        });
        loadTabData();
      } else {
        const data = await res.json();
        setFormError(data.message || t("onboardingFailed"));
      }
    } catch {
      setFormError(t("serverError"));
    } finally {
      setFormBusy(false);
    }
  }

  // Filter partners
  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.memberships.some((m) => m.user.email.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "ALL" || p.type === typeFilter;
    const isActive = p.subscriptions.some((s) => s.isActive);
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && isActive) ||
      (statusFilter === "INACTIVE" && !isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filter global users
  const filteredUsers = globalUsers.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.firstName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.lastName || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = typeFilter === "ALL" || u.role === typeFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.isActive) ||
      (statusFilter === "INACTIVE" && !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filter audit logs
  const filteredLogs = logs.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.user?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const partnersActive = partners.filter((p) => p.subscriptions.some((s) => s.isActive)).length;
  const globalUsersActive = globalUsers.filter((u) => u.isActive).length;

  return (
    <div className="min-w-0 space-y-5 sm:space-y-8">
      {/* Compact section navigation for mobile; desktop navigation lives in the sidebar. */}
      {/* Partners Tab */}
      {activeTab === "partners" && (
        <div className="space-y-6">
          {/* Dynamic Statistics Cards */}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("totalPartners")}</div>
                <div className="mt-1 text-3xl font-extrabold text-pine">{partners.length}</div>
                <div className="mt-2 text-xs text-muted">{t("partnerTypesSummary")}</div>
              </div>
              <span className="msym text-[36px] text-mint bg-mint/10 p-3 rounded-xl">corporate_fare</span>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("activeSystems")}</div>
                <div className="mt-1 text-3xl font-extrabold text-brand">{partnersActive}</div>
                <div className="mt-2 text-xs text-brand-600">{t("stripeBillingActive")}</div>
              </div>
              <span className="msym text-[36px] text-brand bg-brand/10 p-3 rounded-xl">credit_card</span>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("onboardingPending")}</div>
                <div className="mt-1 text-3xl font-extrabold text-red-600">{partners.length - partnersActive}</div>
                <div className="mt-2 text-xs text-muted">{t("manualActivation")}</div>
              </div>
              <span className="msym text-[36px] text-red-600 bg-red-50 p-3 rounded-xl">pending_actions</span>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("distribution")}</div>
                <div className="mt-2 space-y-1.5 text-sm font-semibold text-ink-strong">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="msym text-[18px] text-brand">clinical_notes</span>
                    <span>{t("practiceCount", { count: partners.filter((p) => p.type === "PRACTICE").length })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="msym text-[18px] text-brand">medication</span>
                    <span>{t("pharmacyCount", { count: partners.filter((p) => p.type === "PHARMACY").length })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="msym text-[18px] text-brand">domain</span>
                    <span>{t("enterpriseCount", { count: partners.filter((p) => p.type === "ENTERPRISE").length })}</span>
                  </div>
                </div>
              </div>
              <span className="msym text-[36px] text-pine bg-surface p-3 rounded-xl">analytics</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-white p-3 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full flex-1 lg:max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted">
                <span className="msym text-[20px]">search</span>
              </span>
              <input
                type="text"
                placeholder={t("searchPartners")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
              <div className="flex max-w-full overflow-x-auto rounded-lg border border-hairline bg-surface p-1 text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {["ALL", "PRACTICE", "PHARMACY", "ENTERPRISE"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`shrink-0 rounded-md px-3 py-1.5 transition-colors ${
                      typeFilter === t ? "bg-white text-pine font-bold shadow-sm" : "text-muted hover:text-ink-strong"
                    }`}
                  >
                    {labels[t] ?? t}
                  </button>
                ))}
              </div>

              <div className="flex max-w-full overflow-x-auto rounded-lg border border-hairline bg-surface p-1 text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {["ALL", "ACTIVE", "INACTIVE"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`shrink-0 rounded-md px-3 py-1.5 transition-colors ${
                      statusFilter === s ? "bg-white text-pine font-bold shadow-sm" : "text-muted hover:text-ink-strong"
                    }`}
                  >
                    {labels[s] ?? s}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-pine sm:w-auto"
              >
                <span className="msym text-[18px]">add_circle</span>
                {t("onboardPartner")}
              </button>
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-hairline bg-white shadow-sm [scrollbar-width:thin]">
            {loading ? (
              <div className="p-12 text-center text-sm text-muted">{t("loadingPartners")}</div>
            ) : filteredPartners.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted">{t("noPartners")}</div>
            ) : (
              <table className="w-full min-w-[1120px] text-start text-sm">
                <thead className="bg-surface text-xs font-bold uppercase tracking-wider text-sage-950 border-b border-hairline">
                  <tr>
                    <th className="px-6 py-4">{t("partnerOrg")}</th>
                    <th className="px-6 py-4">{t("type")}</th>
                    <th className="px-6 py-4">{t("primaryAdmin")}</th>
                    <th className="px-6 py-4">{t("loginStatus")}</th>
                    <th className="px-6 py-4">{t("billingPlan")}</th>
                    <th className="px-6 py-4">{t("licenseStatus")}</th>
                    <th className="px-6 py-4 text-right">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredPartners.map((p) => {
                    const sub = p.subscriptions[0];
                    const isActive = sub?.isActive ?? false;
                    const contact = p.memberships.find((m) => m.orgRole === "ADMIN")?.user ?? p.memberships[0]?.user;
                    const isExpanded = expandedOrgId === p.id;

                    return (
                      <Fragment key={p.id}>
                        <tr className={`hover:bg-surface/20 transition-colors ${isExpanded ? "bg-surface/10" : ""}`}>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => setExpandedOrgId(isExpanded ? null : p.id)}
                              className="flex items-center gap-2 font-bold text-pine hover:text-brand"
                            >
                              <span className="msym text-[18px] text-muted transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                                chevron_right
                              </span>
                              {p.name}
                            </button>
                            <div className="text-[10px] text-muted mt-0.5 ml-6">{t("joined", { date: new Date(p.createdAt).toLocaleDateString() })}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-mint/20 px-2.5 py-0.5 text-xs font-bold text-pine border border-mint">
                              {p.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {contact ? (
                              <>
                                <div className="font-semibold text-ink-strong flex items-center gap-1.5">
                                  <span className={`size-2 rounded-full ${contact.isActive ? "bg-brand" : "bg-neutral-300"}`} />
                                  {contact.firstName} {contact.lastName}
                                </div>
                                <div className="text-xs text-muted ml-3.5">{contact.email}</div>
                              </>
                            ) : (
                              <span className="text-xs text-muted">{t("noAdmin")}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {contact?.mustChangePassword ? (
                              <div>
                                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                  {t("passwordChangePending")}
                                </div>
                                {contact.temporaryPassword ? (
                                  <div className="inline-flex items-center overflow-hidden rounded-lg border border-amber-200 bg-amber-50">
                                    <code className="px-2.5 py-1.5 text-xs font-bold text-amber-950">
                                      {contact.temporaryPassword}
                                    </code>
                                    <button
                                      type="button"
                                      aria-label={t("copyTempPassword")}
                                      title={t("copyTempPassword")}
                                      onClick={() => void navigator.clipboard.writeText(contact.temporaryPassword!)}
                                      className="flex self-stretch items-center border-s border-amber-200 px-2 text-amber-800 transition hover:bg-amber-100"
                                    >
                                      <span aria-hidden className="msym text-[17px]">content_copy</span>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => void handleIssueTemporaryPassword(p.id, contact.id)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-50"
                                  >
                                    <span aria-hidden className="msym text-[16px]">key</span>
                                    {t("generateTempPassword")}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">
                                <span aria-hidden className="msym text-[16px]">verified_user</span>
                                {t("passwordUpdated")}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-ink-strong">{sub?.plan?.name ?? t("noPlan")}</div>
                            <div className="text-xs text-muted mt-0.5">
                              {sub?.plan?.monthlyPrice
                                ? t("pricePerMonth", { price: `€${sub.plan.monthlyPrice}.00` })
                                : t("planInactive")}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                isActive ? "bg-brand/10 text-brand" : "bg-neutral-100 text-muted"
                              }`}
                            >
                              <span className="size-1.5 rounded-full bg-current" />
                              {isActive ? t("active") : t("inactive")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePartner(p.id)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                                isActive
                                  ? "border border-red-200 text-red-600 hover:bg-red-50"
                                  : "bg-brand text-white hover:bg-pine"
                              }`}
                            >
                              {isActive ? t("deactivate") : t("activate")}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-surface/30">
                            <td colSpan={6} className="px-8 py-5 border-t border-b border-hairline">
                              <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-pine uppercase tracking-wider">{t("organizationDetails")}</h4>
                                  <ul className="space-y-1.5 text-xs text-ink-strong">
                                    <li><strong>{t("organizationId")}:</strong> {p.id}</li>
                                    <li><strong>{t("created")}:</strong> {new Date(p.createdAt).toLocaleString()}</li>
                                    <li><strong>{t("subscriptionActive")}:</strong> {isActive ? t("yes") : t("no")}</li>
                                    <li><strong>{t("planLevel")}:</strong> {sub?.plan?.tier ?? t("none")}</li>
                                    <li className="flex items-center gap-1.5 mt-1">
                                      <strong>{t("enforce2fa")}:</strong>
                                      <button
                                        type="button"
                                        onClick={() => handleToggle2FA(p.id)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider transition-colors ${
                                          (p.settings?.mandatory2fa ?? true)
                                            ? "bg-brand/10 text-brand border border-brand/20"
                                            : "bg-neutral-100 text-muted border border-neutral-200"
                                        }`}
                                      >
                                        {(p.settings?.mandatory2fa ?? true) ? t("mandatory") : t("optional")}
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold text-pine uppercase tracking-wider">{t("associatedUsers")}</h4>
                                  <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {p.memberships.map((m) => (
                                      <div key={m.id} className="flex items-center justify-between rounded-lg border border-hairline bg-white p-2.5 text-xs">
                                        <div>
                                          <div className="font-semibold text-ink-strong">
                                            {m.user.firstName} {m.user.lastName} <span className="text-[10px] text-muted uppercase">({m.orgRole})</span>
                                          </div>
                                          <div className="text-muted text-[11px]">{m.user.email}</div>
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.user.isActive ? "bg-mint/30 text-pine" : "bg-neutral-100 text-muted"}`}>
                                          {m.user.isActive ? t("active") : t("inactive")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Users Registry Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("totalAccounts")}</div>
                <div className="mt-1 text-3xl font-extrabold text-pine">{globalUsers.length}</div>
              </div>
              <span className="msym text-[36px] text-pine bg-surface p-3 rounded-xl">groups</span>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("activeUsers")}</div>
                <div className="mt-1 text-3xl font-extrabold text-brand">{globalUsersActive}</div>
              </div>
              <span className="msym text-[36px] text-brand bg-brand/10 p-3 rounded-xl">how_to_reg</span>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("suspendedAccounts")}</div>
                <div className="mt-1 text-3xl font-extrabold text-red-600">{globalUsers.length - globalUsersActive}</div>
              </div>
              <span className="msym text-[36px] text-red-600 bg-red-50 p-3 rounded-xl">person_off</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-white p-3 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full flex-1 lg:max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted">
                <span className="msym text-[20px]">search</span>
              </span>
              <input
                type="text"
                placeholder={t("searchUsers")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
              <div className="flex max-w-full overflow-x-auto rounded-lg border border-hairline bg-surface p-1 text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {["ALL", "PATIENT", "DOCTOR", "PHARMACY", "ENTERPRISE", "ADMIN"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTypeFilter(r)}
                    className={`shrink-0 rounded-md px-3 py-1.5 transition-colors ${
                      typeFilter === r ? "bg-white text-pine font-bold shadow-sm" : "text-muted hover:text-ink-strong"
                    }`}
                  >
                    {labels[r] ?? r}
                  </button>
                ))}
              </div>

              <div className="flex max-w-full overflow-x-auto rounded-lg border border-hairline bg-surface p-1 text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {["ALL", "ACTIVE", "INACTIVE"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`shrink-0 rounded-md px-3 py-1.5 transition-colors ${
                      statusFilter === s ? "bg-white text-pine font-bold shadow-sm" : "text-muted hover:text-ink-strong"
                    }`}
                  >
                    {labels[s] ?? s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Directory Table */}
          <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-hairline bg-white shadow-sm [scrollbar-width:thin]">
            {loading ? (
              <div className="p-12 text-center text-sm text-muted">{t("loadingUsers")}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted">{t("noUsers")}</div>
            ) : (
              <table className="w-full min-w-[860px] text-start text-sm">
                <thead className="bg-surface text-xs font-bold uppercase tracking-wider text-sage-950 border-b border-hairline">
                  <tr>
                    <th className="px-6 py-4">{t("user")}</th>
                    <th className="px-6 py-4">{t("globalRole")}</th>
                    <th className="px-6 py-4">{t("organizationMembership")}</th>
                    <th className="px-6 py-4">{t("createdDate")}</th>
                    <th className="px-6 py-4">{t("status")}</th>
                    <th className="px-6 py-4 text-right">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-surface/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-ink-strong">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-xs text-muted mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-sage-100 border border-hairline px-2 py-0.5 text-xs font-bold text-pine uppercase tracking-wide">
                          {labels[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.memberships.length > 0 ? (
                          <div className="space-y-0.5">
                            {u.memberships.map((m, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs font-semibold text-ink-strong">
                                <span aria-hidden className="msym text-[16px] text-brand">apartment</span>
                                <span>{m.org.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">{t("independentAccount")}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            u.isActive ? "bg-brand/10 text-brand" : "bg-neutral-100 text-muted"
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {u.isActive ? t("active") : t("suspended")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUser(u.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                            u.isActive
                              ? "border border-red-200 text-red-600 hover:bg-red-50"
                              : "bg-brand text-white hover:bg-pine"
                          }`}
                        >
                          {u.isActive ? t("suspend") : t("activate")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Pricing Plans Tab */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm sm:p-5">
            <h3 className="font-display text-lg font-bold text-pine">{t("globalLicensingPlans")}</h3>
            <p className="text-xs text-muted mt-0.5">{t("licensingDescription")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((p) => {
              const isEditing = editingPlanId === p.id;
              return (
                <div key={p.id} className="flex flex-col justify-between rounded-2xl border border-hairline bg-white p-4 shadow-sm sm:p-6">
                  <div>
                    <div className="flex items-center justify-between border-b border-hairline pb-3">
                      <div>
                        <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                          {p.tier}
                        </span>
                        <h4 className="text-lg font-extrabold text-pine mt-1">{p.name}</h4>
                      </div>
                      <span className="msym text-[28px] text-muted">payments</span>
                    </div>

                    <div className="py-4 space-y-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("monthlyCost")}</div>
                        {isEditing ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xl font-bold text-pine">€</span>
                            <input
                              type="number"
                              value={editPriceVal}
                              onChange={(e) => setEditPriceVal(e.target.value)}
                              className="w-24 rounded-lg border border-hairline px-2 py-1 text-sm focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div className="text-2xl font-extrabold text-pine mt-0.5">€{p.monthlyPrice}.00</div>
                        )}
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("includedReviews")}</div>
                        <div className="text-sm font-semibold text-ink-strong mt-0.5">
                          {p.reviewCap ? t("countPerMonth", { count: p.reviewCap }) : t("unlimitedCap")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-hairline pt-4 flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingPlanId(null)}
                          className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-bold text-ink-strong hover:bg-surface"
                        >
                          {t("cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdatePlan(p.id)}
                          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-pine"
                        >
                          {t("save")}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlanId(p.id);
                          setEditPriceVal(p.monthlyPrice.toString());
                        }}
                        className="rounded-lg border border-hairline px-4 py-1.5 text-xs font-bold text-pine hover:bg-surface"
                      >
                        {t("adjustPricing")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audit Event Logs Tab */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-pine">{t("globalSecurityLogs")}</h3>
              <p className="text-xs text-muted mt-0.5">{t("securityLogsDescription")}</p>
            </div>
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted">
                <span className="msym text-[20px]">search</span>
              </span>
              <input
                type="text"
                placeholder={t("searchLogs")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-hairline bg-white shadow-sm [scrollbar-width:thin]">
            {loading ? (
              <div className="p-12 text-center text-sm text-muted">{t("loadingLogs")}</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted">{t("noLogs")}</div>
            ) : (
              <table className="w-full min-w-[820px] text-start text-sm">
                <thead className="bg-surface text-xs font-bold uppercase tracking-wider text-sage-950 border-b border-hairline">
                  <tr>
                    <th className="px-6 py-4">{t("timestamp")}</th>
                    <th className="px-6 py-4">{t("actor")}</th>
                    <th className="px-6 py-4">{t("eventAction")}</th>
                    <th className="px-6 py-4">{t("entityContext")}</th>
                    <th className="px-6 py-4 text-right">{t("accessIp")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-surface/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-muted">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {l.user ? (
                          <>
                            <div className="font-bold text-ink-strong">{l.user.firstName} {l.user.lastName}</div>
                            <div className="text-[11px] text-muted">{l.user.email}</div>
                          </>
                        ) : (
                          <span className="text-xs text-muted">{t("systemGuest")}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-pine text-xs">
                        {l.action}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-ink-strong">
                        {l.entityType ? `${l.entityType} (${l.entityId})` : t("globalSession")}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-mono text-muted">
                        {l.ipAddress || "127.0.0.1"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Onboard Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pine-900/40 p-2 backdrop-blur-md animate-fade-in sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("onboardPartner")}
            className="max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-hairline bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-display text-xl font-bold text-pine">{t("onboardPartner")}</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setOnboardSuccessData(null);
                }}
                className="text-muted hover:text-ink-strong"
                aria-label={t("close")}
              >
                <span className="msym text-[22px]">close</span>
              </button>
            </div>

            {onboardSuccessData ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-mint/10 p-4 border border-brand/20 text-center">
                  <span className="msym text-[48px] text-brand">check_circle</span>
                  <h4 className="mt-2 font-display text-lg font-bold text-pine">{t("onboardSuccess")}</h4>
                  <p className="text-xs text-muted mt-1">{t("activationEmailSent")}</p>
                </div>
                <div className="rounded-xl bg-surface p-4 border border-hairline space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t("organization")}:</span>
                    <span className="font-bold text-ink-strong">{onboardSuccessData.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t("adminEmail")}:</span>
                    <span className="font-bold text-ink-strong">{onboardSuccessData.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t("temporaryPassword")}:</span>
                    <span className="font-mono font-bold text-brand bg-white px-2 py-0.5 rounded border border-hairline">{onboardSuccessData.tempPassword}</span>
                  </div>
                </div>
                <div className="mt-6 flex justify-end pt-4 border-t border-hairline">
                  <button
                    onClick={() => {
                      setOnboardSuccessData(null);
                      setShowModal(false);
                    }}
                    className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white hover:bg-pine transition-colors shadow-sm"
                  >
                    {t("done")}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOnboard} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage-950">{t("organizationName")}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("organizationPlaceholder")}
                    className="mt-1.5 w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <StyledSelect
                    label={t("type")}
                    value={formData.type}
                    onChange={(type) => setFormData((current) => ({ ...current, type }))}
                    options={[
                      { value: "PRACTICE", label: t("practiceClinic") },
                      { value: "PHARMACY", label: t("pharmacy") },
                      { value: "ENTERPRISE", label: t("enterprise") },
                    ]}
                  />
                  <StyledSelect
                    label={t("licensePlan")}
                    value={formData.planTier}
                    onChange={(planTier) => setFormData((current) => ({ ...current, planTier }))}
                    options={[
                      { value: "BASIC", label: t("basicOption") },
                      { value: "PLUS", label: t("plusOption") },
                      { value: "PREMIUM", label: t("premiumOption") },
                      { value: "ENTERPRISE", label: t("enterpriseOption") },
                    ]}
                  />
                </div>

                <div className="border-t border-hairline pt-3">
                  <span className="text-xs font-bold text-pine uppercase tracking-wider">{t("primarySystemAdmin")}</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-sage-950">{t("firstName")}</label>
                    <input
                      type="text"
                      required
                      value={formData.adminFirstName}
                      onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                      placeholder="Elena"
                      className="mt-1.5 w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-sage-950">{t("lastName")}</label>
                    <input
                      type="text"
                      required
                      value={formData.adminLastName}
                      onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                      placeholder="Vance"
                      className="mt-1.5 w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage-950">{t("adminEmailAddress")}</label>
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="elena.vance@example.com"
                    className="mt-1.5 w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none"
                  />
                </div>

                {formError && <p className="text-xs font-bold text-red-600 mt-2">{formError}</p>}

                <div className="mt-6 flex justify-end gap-3 border-t border-hairline pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setOnboardSuccessData(null);
                    }}
                    className="rounded-xl border border-hairline px-5 py-2.5 text-sm font-bold text-ink-strong hover:bg-surface transition-colors"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={formBusy}
                    className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-pine disabled:opacity-65 transition-colors shadow-sm"
                  >
                    {formBusy ? t("onboarding") : t("onboardPartner")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
