"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";

export function LogoUpload({
  currentLogoUrl,
}: Readonly<{ currentLogoUrl: string | null }>) {
  const t = useTranslations("doctor.settings");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    currentLogoUrl ? `${API_URL}${currentLogoUrl}` : null,
  );

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError(false);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${API_URL}/doctor/practice/logo`, {
        method: "POST",
        credentials: "include",
        body,
      });
      if (!res.ok) throw new Error();
      const { logoUrl } = (await res.json()) as { logoUrl: string };
      setPreview(`${API_URL}${logoUrl}`);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="flex h-36 w-44 flex-col items-center justify-center gap-2 overflow-hidden
                   rounded-xl border-2 border-dashed border-hairline text-muted
                   hover:border-pine-600 hover:text-pine-600 disabled:opacity-60"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- external API origin, dev upload preview
          <img src={preview} alt={t("currentLogo")} className="max-h-full max-w-full object-contain p-2" />
        ) : (
          <>
            <span aria-hidden className="msym text-[30px]">
              add_photo_alternate
            </span>
            <span className="text-xs font-bold uppercase tracking-wide">
              {pending ? t("logoUploading") : t("uploadLogo")}
            </span>
          </>
        )}
      </button>
      {preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="mt-2 text-xs font-bold text-pine-600 hover:underline"
        >
          {pending ? t("logoUploading") : t("uploadLogo")}
        </button>
      ) : null}
      {error ? <p className="mt-2 text-xs text-accent-print">{t("logoError")}</p> : null}
    </div>
  );
}
