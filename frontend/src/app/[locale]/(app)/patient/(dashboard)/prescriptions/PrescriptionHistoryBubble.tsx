"use client";

import { useState } from "react";
import { format } from "date-fns";

type Prescription = {
  id: string;
  status: string;
  note: string | null;
  rejectionReason: string | null;
  createdAt: string;
  pharmacy: {
    name: string;
  };
};

export function PrescriptionHistoryBubble({
  prescriptions,
}: Readonly<{
  prescriptions: Prescription[] | null;
}>) {
  const [isOpen, setIsOpen] = useState(false);

  const statusColors: Record<string, string> = {
    RECEIVED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-amber-100 text-amber-800",
    READY: "bg-emerald-100 text-emerald-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-pine-600 text-white shadow-xl hover:bg-pine-700 transition-all z-40 hover:scale-105 active:scale-95"
        aria-label="View Prescription History"
      >
        <span aria-hidden className="msym text-[28px]">receipt_long</span>
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#f6f8fc] shadow-2xl z-50 flex flex-col border-l border-hairline animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between p-5 border-b border-hairline bg-white">
            <h2 className="font-bold text-ink-strong text-lg">Prescription History</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-muted transition-colors"
              aria-label="Close History"
            >
              <span aria-hidden className="msym text-[24px]">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {!prescriptions || prescriptions.length === 0 ? (
              <div className="rounded-xl border border-hairline bg-white p-8 text-center text-muted">
                <span aria-hidden className="msym text-[48px] mb-2 opacity-50">receipt_long</span>
                <p>No prescriptions found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((p) => (
                  <div key={p.id} className="rounded-xl border border-hairline bg-white p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-pine-900 text-lg">{p.pharmacy.name}</p>
                        <p className="text-sm text-muted">
                          {format(new Date(p.createdAt), "PPP p")}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[p.status] || "bg-gray-100 text-gray-800"}`}>
                        {p.status}
                      </span>
                    </div>

                    {p.note && (
                      <div className="mt-4 text-sm text-ink-strong bg-[#f6f8fc] p-4 rounded-lg border border-hairline">
                        <span className="font-semibold block mb-1 text-muted uppercase tracking-wider text-xs">Your Note:</span>
                        {p.note}
                      </div>
                    )}

                    {p.status === 'CANCELLED' && p.rejectionReason && (
                      <div className="mt-4 flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-900 border border-red-100">
                        <span aria-hidden className="msym text-[20px] text-red-600">error</span>
                        <div>
                          <span className="font-semibold block mb-1">Reason for cancellation:</span>
                          <p>{p.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Backdrop for mobile to click-out */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
