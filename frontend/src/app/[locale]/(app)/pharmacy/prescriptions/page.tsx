import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { PrescriptionStatusEditor } from "./PrescriptionStatusEditor";
import { AiUploadButton } from "./AiUploadButton";
import { format } from "date-fns";

type Prescription = {
  id: string;
  status: string;
  note: string | null;
  rejectionReason: string | null;
  createdAt: string;
  patient: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    dateOfBirth: string | null;
  } | null;
};

export default async function PharmacyPrescriptionsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, prescriptions] = await Promise.all([
    getTranslations("pharmacy.prescriptions"),
    apiServer<Prescription[]>("/pharmacy/prescriptions").catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-pine-900">
          Prescriptions Inbox
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-muted">
            {(prescriptions || []).length} Total Prescriptions
          </div>
          <AiUploadButton />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-hairline bg-white shadow-sm">
        {(!prescriptions || prescriptions.length === 0) ? (
          <div className="p-12 text-center text-muted">
            <span aria-hidden className="msym text-[48px] mb-2 opacity-30">inbox</span>
            <p>No prescriptions received yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f6f8fc] text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Date Received</th>
                  <th className="px-6 py-4 font-semibold">Note</th>
                  <th className="px-6 py-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {(prescriptions || []).map((p) => {
                  const isUnmatched = p.status === 'UNMATCHED' || !p.patient;

                  return (
                    <tr key={p.id} className={`transition-colors ${isUnmatched ? 'bg-red-50 hover:bg-red-100/50' : 'hover:bg-black/[0.02]'}`}>
                      <td className="px-6 py-4 align-top">
                        {isUnmatched ? (
                          <div className="font-bold text-red-600 flex items-center gap-2">
                            <span className="msym text-[18px]">error</span>
                            Unknown Patient
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-ink-strong">
                              {p.patient?.user.firstName} {p.patient?.user.lastName}
                            </div>
                            <div className="text-muted text-xs mt-0.5">
                              {p.patient?.user.email}
                            </div>
                            {p.patient?.dateOfBirth && (
                              <div className="text-muted text-xs mt-0.5">
                                DOB: {format(new Date(p.patient.dateOfBirth), "PP")}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      
                      <td className={`px-6 py-4 align-top ${isUnmatched ? 'text-red-900 font-medium' : 'text-ink-strong'}`}>
                        {format(new Date(p.createdAt), "PPP p")}
                      </td>

                      <td className="px-6 py-4 align-top max-w-xs">
                        {p.note ? (
                          <p className={`line-clamp-3 ${isUnmatched ? 'text-red-800 font-medium' : 'text-ink-strong'}`}>{p.note}</p>
                        ) : (
                          <span className="text-muted italic">No note provided.</span>
                        )}
                        
                        {p.status === 'CANCELLED' && p.rejectionReason && (
                          <div className="mt-2 text-xs font-medium text-red-600 bg-white p-2 rounded border border-red-200">
                            <strong>Rejection Reason:</strong> {p.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex justify-end items-center gap-3">
                          {isUnmatched ? (
                            <button className="text-xs font-bold bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50">
                              Assign Patient
                            </button>
                          ) : (
                            <PrescriptionStatusEditor id={p.id} currentStatus={p.status} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
