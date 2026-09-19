"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

export function AiUploadButton() {
  const router = useRouter();
  const t = useTranslations("pharmacy.prescriptions");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      await api("/pharmacy/prescriptions/upload", {
        method: "POST",
        body: {
          fileUrl: base64,
        },
      });

      router.refresh();
      alert(t("scanSuccess"));
    } catch (err) {
      const error = err as Error;
      alert(error.message || t("scanError"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 rounded-lg bg-pine-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-pine-700 disabled:opacity-50 transition-colors"
      >
        <span aria-hidden className="msym text-[18px]">document_scanner</span>
        {isUploading ? t("scanning") : t("scanButton")}
      </button>
    </div>
  );
}
