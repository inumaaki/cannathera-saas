"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

export function AcknowledgeButton({
  flagId,
  label,
}: Readonly<{ flagId: string; label: string }>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await api(`/doctor/red-flags/${flagId}/acknowledge`, { method: "POST" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-pine-600 px-4 py-2.5 text-xs font-bold uppercase
                 tracking-wide text-pine-600 hover:bg-mint/20 disabled:opacity-50"
    >
      {label}
    </button>
  );
}
