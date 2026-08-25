import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { PrescriptionUpload } from "./PrescriptionUpload";
import { PrescriptionHistoryBubble } from "./PrescriptionHistoryBubble";
import { format } from "date-fns";

type Profile = {
  favoritePharmacies: Array<{ id: string; name: string }>;
};

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

export default async function PatientPrescriptionsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, profile, prescriptions] = await Promise.all([
    getTranslations("patient.prescriptions"),
    apiServer<Profile>("/patient/profile"),
    apiServer<Prescription[]>("/patient/prescriptions"),
  ]);

  const statusColors: Record<string, string> = {
    RECEIVED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-amber-100 text-amber-800",
    READY: "bg-emerald-100 text-emerald-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <section className="cw-watermark rounded-2xl border border-hairline bg-white">
        <h1 className="rounded-t-2xl border-b border-hairline bg-[#f6f8fc] px-5 py-4 font-display text-xl font-bold text-pine">
          My Prescriptions
        </h1>
        <div className="p-5 max-w-4xl mx-auto space-y-12">
          
          <div className="w-full">
            {profile && <PrescriptionUpload favoritePharmacies={profile.favoritePharmacies} />}
          </div>

          <PrescriptionHistoryBubble prescriptions={prescriptions} />

        </div>
      </section>
    </div>
  );
}
