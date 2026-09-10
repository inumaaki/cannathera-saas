"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

export default function PatientDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Patient Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="size-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
        <span aria-hidden className="msym text-3xl">warning</span>
      </div>
      <h2 className="font-display text-2xl font-bold text-pine-900">
        Inhalt konnte nicht geladen werden
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        Es ist ein vorübergehender Darstellungsfehler aufgetreten. Ihre Daten und Sitzung sind sicher.
      </p>
      {error?.message && (
        <pre className="mt-4 max-w-lg overflow-x-auto rounded-lg bg-slate-50 border border-slate-200 p-3 text-left font-mono text-xs text-slate-700">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-pine-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-pine-700 transition-colors"
        >
          Erneut versuchen
        </button>
        <Link
          href="/patient"
          className="rounded-xl border border-hairline bg-white px-5 py-2.5 text-xs font-bold text-ink-strong hover:bg-slate-50 transition-colors shadow-sm"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
