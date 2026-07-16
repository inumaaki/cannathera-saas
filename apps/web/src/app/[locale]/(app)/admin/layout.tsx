import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/auth/BrandMark";

export default async function AdminLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect({ href: "/login", locale });
  }

  const name =
    [user!.firstName, user!.lastName].filter(Boolean).join(" ") || user!.email;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-64 border-e border-hairline bg-white flex flex-col">
        <div className="p-6 border-b border-hairline flex flex-col gap-2">
          <BrandMark size={32} />
          <span className="self-start text-[10px] font-bold text-pine bg-mint/20 rounded px-1.5 py-0.5 uppercase tracking-wider">
            System Control
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-pine bg-mint/20 border-s-4 border-brand"
          >
            <span className="msym text-[20px]">admin_panel_settings</span>
            Partners Overview
          </Link>
        </nav>
        <div className="p-4 border-t border-hairline">
          <div className="text-xs font-bold text-ink-strong">{name}</div>
          <div className="text-[10px] text-muted uppercase tracking-wider mt-0.5">System Admin</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-hairline bg-white flex items-center justify-between px-8 shadow-sm">
          <h1 className="font-display text-lg font-bold text-pine">Control Center</h1>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink-strong"
          >
            <span className="msym text-[18px]">logout</span>
            Exit
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
