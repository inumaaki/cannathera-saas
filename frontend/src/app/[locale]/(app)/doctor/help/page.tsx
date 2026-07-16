import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const FAQ_GROUPS = [
  { key: "patients", items: ["q1", "q2"] },
  { key: "compliance", items: ["q3", "q4"] },
  { key: "telemedicine", items: ["q5", "q6"] },
] as const;

/* Figma 5.8 — Help & Support. */
export default async function DoctorHelp({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("doctor.help");
  const tc = await getTranslations("common");

  const card = (icon: string, tint: string, title: string, text: string) => (
    <div className="rounded-xl border border-hairline bg-white p-6">
      <span aria-hidden className={`msym flex size-12 items-center justify-center rounded-xl text-[24px] ${tint}`}>
        {icon}
      </span>
      <h2 className="mt-4 font-bold text-pine-600">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  );

  return (
    <>
      <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
      <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {card("menu_book", "bg-mint/30 text-pine-600", t("docs"), t("docsText"))}
        {card("play_circle", "bg-[#eef2fe] text-info", t("videos"), t("videosText"))}
        {card("support_agent", "bg-[#fdf3d7] text-gold", t("contact"), t("contactText"))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[8fr_4fr]">
        {/* FAQ */}
        <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
          <h2 className="font-display text-2xl font-bold text-pine">{t("faq")}</h2>
          {FAQ_GROUPS.map((g) => (
            <div key={g.key} className="mt-5">
              <h3 className="border-b border-hairline pb-2 font-bold text-pine-600">
                {t(`faqGroups.${g.key}`)}
              </h3>
              <div className="mt-3 space-y-3">
                {g.items.map((q) => (
                  <details
                    key={q}
                    className="group rounded-xl border border-hairline px-5 py-4 open:bg-surface/50"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-ink-strong">
                      {t(`questions.${q}`)}
                      <span
                        aria-hidden
                        className="msym text-[20px] text-muted transition-transform group-open:rotate-90 rtl:-scale-x-100"
                      >
                        chevron_right
                      </span>
                    </summary>
                    <p className="mt-3 leading-relaxed text-muted">
                      {t(`questions.a${q.slice(1)}`)}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Tickets */}
        <section className="self-start rounded-xl border border-hairline bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink-strong">{t("ticketStatus")}</h2>
            <button type="button" className="text-sm font-bold text-pine-600 hover:underline">
              {t("newTicket")}
            </button>
          </div>
          <p className="mt-4 rounded-xl bg-surface px-4 py-6 text-center text-sm text-muted">
            {t("noTickets")}
          </p>
          <button
            type="button"
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-bold text-white hover:bg-pine"
          >
            <span aria-hidden className="msym text-[20px]">
              forum
            </span>
            {t("liveChat")}
          </button>
        </section>
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5 text-sm text-muted">
        <div className="flex gap-5">
          <Link href="/imprint" className="hover:text-ink-strong">
            {tc("imprint")}
          </Link>
          <Link href="/privacy" className="hover:text-ink-strong">
            {tc("privacy")}
          </Link>
        </div>
        <p>{tc("poweredBy")}</p>
      </footer>
    </>
  );
}
