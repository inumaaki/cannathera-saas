import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { ProfileForm } from "./ProfileForm";

type Profile = {
  fullName: string;
  patientRef: string;
  email: string;
  pharmacyOrgId: string | null;
  pharmacies: Array<{ id: string; name: string }>;
};

/* Patient profile (Figma 6-1168). */
export default async function PatientProfilePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, profile] = await Promise.all([
    getTranslations("patient.profile"),
    apiServer<Profile>("/patient/profile"),
  ]);

  return (
    <>
      <section className="cw-watermark overflow-hidden rounded-2xl border border-hairline bg-white">
        <h1 className="border-b border-hairline bg-[#f6f8fc] px-5 py-4 font-display text-xl font-bold text-pine">
          {t("title")}
        </h1>
        <div className="p-5">
          {profile ? <ProfileForm profile={profile} /> : null}
        </div>
      </section>

      <section className="mt-5 rounded-2xl bg-[#e8ece9] p-6 text-center">
        <span
          aria-hidden
          className="msym mx-auto flex size-12 items-center justify-center rounded-xl text-[34px] text-pine-600"
        >
          verified_user
        </span>
        <p className="mt-2 font-bold text-ink-strong">{t("gdprTitle")}</p>
        <p className="mx-auto mt-2 max-w-xs leading-relaxed text-muted">{t("gdprText")}</p>
      </section>
    </>
  );
}
