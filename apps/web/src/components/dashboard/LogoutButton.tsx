"use client";

import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

export function LogoutButton({ label }: Readonly<{ label: string }>) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      // Hard navigation clears any cached RSC payload from the old session.
      window.location.assign("/login");
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5
                 font-semibold hover:bg-white/10"
    >
      <span aria-hidden className="msym text-[18px]">
        logout
      </span>
      {label}
    </button>
  );
}
