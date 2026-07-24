import { getTranslations, setRequestLocale } from "next-intl/server";
import { BrandMark } from "@/components/auth/BrandMark";
import { Link } from "@/i18n/navigation";

export default async function PendingApprovalPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.pendingApproval");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-8 sm:px-6">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-hairline bg-white shadow-xl">
        <div className="bg-brand px-6 py-8 text-center text-white sm:px-10">
          <div className="inline-flex rounded-2xl bg-white p-3 shadow-lg">
            <BrandMark size={44} />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-mint-bright">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        <div className="px-5 py-7 sm:px-10 sm:py-9">
          <div className="space-y-4">
            <Step icon="mark_email_read" title={t("verifiedTitle")} text={t("verifiedText")} complete />
            <Step icon="manage_accounts" title={t("reviewTitle")} text={t("reviewText")} />
            <Step icon="forward_to_inbox" title={t("emailTitle")} text={t("emailText")} />
          </div>

          <div className="mt-7 rounded-2xl border border-mint/50 bg-mint/15 p-4 text-center">
            <span aria-hidden className="msym text-[25px] text-brand">schedule</span>
            <p className="mt-1 text-sm font-bold text-pine">{t("noticeTitle")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{t("noticeText")}</p>
          </div>

          <Link
            href="/"
            className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-pine-600 text-sm font-bold text-white transition hover:bg-pine"
          >
            {t("backHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}

function Step({
  icon,
  title,
  text,
  complete = false,
}: Readonly<{
  icon: string;
  title: string;
  text: string;
  complete?: boolean;
}>) {
  return (
    <div className="flex gap-3 rounded-2xl border border-hairline p-4">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
          complete ? "bg-brand text-white" : "bg-surface text-brand"
        }`}
      >
        <span aria-hidden className="msym text-[22px]">{icon}</span>
      </span>
      <div className="min-w-0">
        <h2 className="font-bold text-ink-strong">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
      </div>
    </div>
  );
}
