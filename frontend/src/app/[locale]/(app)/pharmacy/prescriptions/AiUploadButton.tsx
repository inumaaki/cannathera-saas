"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function AiUploadButton() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload() {
    setIsUploading(true);
    try {
      // Simulate file upload and AI processing
      await api("/pharmacy/prescriptions/upload", {
        method: "POST",
        body: JSON.stringify({
          fileUrl: "https://example.com/mock-prescription.pdf",
        }),
      });
      router.refresh();
      alert("Prescription successfully processed and matched by AI!");
    } catch (err) {
          const error = err as Error;
      alert(error.message || "AI matching failed. Red flag raised.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <button
      onClick={handleUpload}
      disabled={isUploading}
      className="flex items-center gap-2 rounded-lg bg-pine-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-pine-700 disabled:opacity-50"
    >
      <span aria-hidden className="msym text-[18px]">document_scanner</span>
      {isUploading ? "Scanning..." : "Upload (AI Scan)"}
    </button>
  );
}
