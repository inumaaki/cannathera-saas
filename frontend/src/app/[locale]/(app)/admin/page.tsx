"use client";

import { useEffect, useState, Fragment } from "react";
import { API_URL } from "@/lib/api";

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

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"partners" | "users" | "plans" | "logs">("partners");
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

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  async function loadTabData() {
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
  }

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
        setFormError(data.message || "Onboarding failed.");
      }
    } catch {
      setFormError("Server error. Please try again.");
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
    <div className="space-y-8">
      {/* Top Professional Tab Selector */}
      <div className="flex border-b border-hairline space-x-6 text-sm font-bold">
        {[
          { id: "partners", label: "Partners", icon: "corporate_fare" },
          { id: "users", label: "Users Registry", icon: "people" },
          { id: "plans", label: "Pricing Plans", icon: "payments" },
          { id: "logs", label: "Audit Event Logs", icon: "history_toggle_off" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
              activeTab === t.id
                ? "border-brand text-brand font-extrabold"
                : "border-transparent text-muted hover:text-pine"
            }`}
          >
            <span className="msym text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Partners Tab */}
      {activeTab === "partners" && (
        <div className="space-y-6">
          {/* Dynamic Statistics Cards */}
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Partners</div>
                <div className="mt-1 text-3xl font-extrabold text-pine">{partners.length}</div>
                <div className="mt-2 text-xs text-muted">Clinics, practices, pharmacies</div>
              </div>
              <span className="msym text-[36px] text-mint bg-mint/10 p-3 rounded-xl">corporate_fare</span>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Active Systems</div>
                <div className="mt-1 text-3xl font-extrabold text-brand">{partnersActive}</div>
                <div className="mt-2 text-xs text-brand-600">Secure Stripe billing active</div>
              </div>
              <span className="msym text-[36px] text-brand bg-brand/10 p-3 rounded-xl">credit_card</span>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Onboarding Pending</div>
                <div className="mt-1 text-3xl font-extrabold text-red-600">{partners.length - partnersActive}</div>
                <div className="mt-2 text-xs text-muted">Requires manual activation</div>
              </div>
              <span className="msym text-[36px] text-red-600 bg-red-50 p-3 rounded-xl">pending_actions</span>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Distribution</div>
                <div className="mt-1 text-sm font-semibold text-ink-strong space-y-0.5">
                  <div>🏥 {partners.filter((p) => p.type === "PRACTICE").length} Practices</div>
                  <div>💊 {partners.filter((p) => p.type === "PHARMACY").length} Pharmacies</div>
                  <div>🏢 {partners.filter((p) => p.type === "ENTERPRISE").length} Enterprises</div>
                </div>
              </div>
              <span className="msym text-[36px] text-pine bg-surface p-3 rounded-xl">analytics</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 rounded-2xl border border-hairline shadow-sm">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted">
                <span className="msym text-[20px]">search</span>
              </span>
              <input
                type="text"
                placeholder="Search partners by name or admin email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-hairline bg-surface p-1 text-xs font-semibold">
                {["ALL", "PRACTICE", "PHARMACY", "ENTERPRISE"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`rounded-md px-3 py-1.5 transition-colors ${
                      typeFilter === t ? "bg-white text-pine font-bold shadow-sm" : "text-muted hover:text-ink-strong"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex rounded-lg border border-hairline bg-surface p-1 text-xs font-semibold">
                {["ALL", "ACTIVE", "INACTIVE"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-md px-3 py-1.5 transition-colors ${
                      statusFilter === s ? "bg-white text-pine font-bold shadow-sm" : "text-muted hover:text-ink-strong"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-pine transition-colors shadow-md"
              >
                <span className="msym text-[18px]">add_circle</span>
                Onboard Partner
              </button>
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-sm text-muted">Loading partner profiles...</div>
            ) : filteredPartners.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted">No partners match filters.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-xs font-bold uppercase tracking-wider text-sage-950 border-b border-hairline">
                  <tr>
                    <th className="px-6 py-4">Partner Org</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Primary Admin</th>
                    <th className="px-6 py-4">Billing Plan</th>
                    <th className="px-6 py-4">License Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
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
                            <div className="text-[10px] text-muted mt-0.5 ml-6">Joined: {new Date(p.createdAt).toLocaleDateString()}</div>
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
                              <span className="text-xs text-muted">No admin configured</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-ink-strong">{sub?.plan?.name ?? "No Plan"}</div>
                            <div className="text-xs text-muted mt-0.5">
                              {sub?.plan?.monthlyPrice ? `€${sub.plan.monthlyPrice}.00 / Month` : "Plan Inactive"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                isActive ? "bg-brand/10 text-brand" : "bg-neutral-100 text-muted"
                              }`}
                            >
                              <span className="size-1.5 rounded-full bg-current" />
                              {isActive ? "ACTIVE" : "INACTIVE"}
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
                              {isActive ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-surface/30">
                            <td colSpan={6} className="px-8 py-5 border-t border-b border-hairline">
                              <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-pine uppercase tracking-wider">Organization Details</h4>
                                  <ul className="space-y-1.5 text-xs text-ink-strong">
                                    <li><strong>Organization ID:</strong> {p.id}</li>
                                    <li><strong>Created:</strong> {new Date(p.createdAt).toLocaleString()}</li>
                                    <li><strong>Subscription Active:</strong> {isActive ? "Yes" : "No"}</li>
                                    <li><strong>Plan Level:</strong> {sub?.plan?.tier ?? "None"}</li>
                                    <li className="flex items-center gap-1.5 mt-1">
                                      <strong>Enforce 2FA Security:</strong>
                                      <button
                                        type="button"
                                        onClick={() => handleToggle2FA(p.id)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider transition-colors ${
                                          (p.settings?.mandatory2fa ?? true)
                                            ? "bg-brand/10 text-brand border border-brand/20"
                                            : "bg-neutral-100 text-muted border border-neutral-200"
                                        }`}
                                      >
                                        {(p.settings?.mandatory2fa ?? true) ? "MANDATORY" : "OPTIONAL"}
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold text-pine uppercase tracking-wider">Associated Users</h4>
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
                                          {m.user.isActive ? "Active" : "Inactive"}
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
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Accounts</div>
                <div className="mt-1 text-3xl font-extrabold text-pine">{globalUsers.length}</div>
              </div>
              <span className="msym text-[36px] text-pine bg-surface p-3 rounded-xl">groups</span>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Active Users</div>
                <div className="mt-1 text-3xl font-extrabold text-brand">{globalUsersActive}</div>
              </div>
              <span className="msym text-[36px] text-brand bg-brand/10 p-3 rounded-xl">how_to_reg</span>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Suspended Accounts</div>
                <div className="mt-1 text-3xl font-extrabold text-red-600">{globalUsers.length - globalUsersActive}</div>
              </div>
              <span className="msym text-[36px] text-red-600 bg-red-50 p-3 rounded-xl">person_off</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 rounded-2xl border border-hairline shadow-sm">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted">
                <span className="msym text-[20px]">search</span>
              </span>
              <input
                type="text"
                placeholder="Search by first/last name or email address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-hairline bg-surface p-1 text-xs font-semibold">
                {["ALL", "PATIENT", "DOCTOR", "PHARMACY", "ENTERPRISE", "ADMIN"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTypeFilter(r)}
                    className={`rounded-md px-3 py-1.5 transition-colors ${
                      typeFilter === r ? "bg-white text-pine font-bold shadow-sm" : "text-muted hover:text-ink-strong"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex rounded-lg border border-hairline bg-surface p-1 text-xs font-semibold">
                {["ALL", "ACTIVE", "INACTIVE"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-md px-3 py-1.5 transition-colors ${
                      statusFilter === s ? "bg-white text-pine font-bold shadow-sm" : "text-muted hover:text-ink-strong"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Directory Table */}
          <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-sm text-muted">Loading user accounts directory...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted">No users found matching parameters.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-xs font-bold uppercase tracking-wider text-sage-950 border-b border-hairline">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Global Role</th>
                    <th className="px-6 py-4">Organization / Membership</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
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
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.memberships.length > 0 ? (
                          <div className="space-y-0.5">
                            {u.memberships.map((m, idx) => (
                              <div key={idx} className="text-xs font-semibold text-ink-strong">🏢 {m.org.name}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">Independent Account</span>
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
                          {u.isActive ? "ACTIVE" : "SUSPENDED"}
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
                          {u.isActive ? "Suspend" : "Activate"}
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
          <div className="bg-white p-5 rounded-2xl border border-hairline shadow-sm">
            <h3 className="font-display text-lg font-bold text-pine">Global Licensing Plans</h3>
            <p className="text-xs text-muted mt-0.5">Configure feature limits, caps, and base monthly pricing tiers.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {plans.map((p) => {
              const isEditing = editingPlanId === p.id;
              return (
                <div key={p.id} className="rounded-2xl border border-hairline bg-white p-6 shadow-sm flex flex-col justify-between">
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
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Monthly Cost</div>
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
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Included Medication Reviews</div>
                        <div className="text-sm font-semibold text-ink-strong mt-0.5">
                          {p.reviewCap ? `${p.reviewCap} per month` : "Unlimited Cap"}
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
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdatePlan(p.id)}
                          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-pine"
                        >
                          Save
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
                        Adjust Pricing
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 rounded-2xl border border-hairline shadow-sm">
            <div>
              <h3 className="font-display text-lg font-bold text-pine">Global Security Logs</h3>
              <p className="text-xs text-muted mt-0.5">Live platform auditable trace containing administrator actions and user logins.</p>
            </div>
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted">
                <span className="msym text-[20px]">search</span>
              </span>
              <input
                type="text"
                placeholder="Search event logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-sm text-muted">Loading global audit log stream...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted">No security events found.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-xs font-bold uppercase tracking-wider text-sage-950 border-b border-hairline">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Event Action</th>
                    <th className="px-6 py-4">Entity Context</th>
                    <th className="px-6 py-4 text-right">Access IP Address</th>
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
                          <span className="text-xs text-muted">System Guest</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-pine text-xs">
                        {l.action}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-ink-strong">
                        {l.entityType ? `${l.entityType} (${l.entityId})` : "Global Session"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pine-900/40 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white border border-hairline p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-display text-xl font-bold text-pine">Onboard Partner</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setOnboardSuccessData(null);
                }}
                className="text-muted hover:text-ink-strong"
              >
                <span className="msym text-[22px]">close</span>
              </button>
            </div>

            {onboardSuccessData ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-mint/10 p-4 border border-brand/20 text-center">
                  <span className="msym text-[48px] text-brand">check_circle</span>
                  <h4 className="mt-2 font-display text-lg font-bold text-pine">Partner Onboarded Successfully</h4>
                  <p className="text-xs text-muted mt-1">An automated activation email has been sent to the partner.</p>
                </div>
                <div className="rounded-xl bg-surface p-4 border border-hairline space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Organization:</span>
                    <span className="font-bold text-ink-strong">{onboardSuccessData.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Admin Email:</span>
                    <span className="font-bold text-ink-strong">{onboardSuccessData.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Temporary Password:</span>
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
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOnboard} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage-950">Organization Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Adler-Apotheke Berlin"
                    className="mt-1.5 w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-sage-950">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                    >
                      <option value="PRACTICE">Practice / Clinic</option>
                      <option value="PHARMACY">Pharmacy</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-sage-950">License Plan</label>
                    <select
                      value={formData.planTier}
                      onChange={(e) => setFormData({ ...formData, planTier: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                    >
                      <option value="BASIC">BASIC (Free Trial - €0 / Month)</option>
                      <option value="PLUS">PLUS Plan (FLEX - €449.00 / Month)</option>
                      <option value="PREMIUM">PREMIUM Plan (FLASHBACK S - €899.00 / Month)</option>
                      <option value="ENTERPRISE">ENTERPRISE Plan (FLASHBACK M - €1,599.00 / Month)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-hairline pt-3">
                  <span className="text-xs font-bold text-pine uppercase tracking-wider">Primary System Administrator</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-sage-950">First Name</label>
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-sage-950">Last Name</label>
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage-950">Admin Email Address</label>
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formBusy}
                    className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-pine disabled:opacity-65 transition-colors shadow-sm"
                  >
                    {formBusy ? "Onboarding..." : "Onboard Partner"}
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
