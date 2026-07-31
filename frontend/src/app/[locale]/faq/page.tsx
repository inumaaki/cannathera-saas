import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BackButton } from "@/components/ui/BackButton";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FaqContent />;
}

function FaqContent() {
  const t = useTranslations("faq");

  // Fetch the questions array from the translation file
  const questions = t.raw("questions") as Array<{ question: string; answer: string }>;

  return (
    <div className="min-h-dvh bg-surface px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-pine sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-sm text-muted sm:text-base max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="cw-watermark rounded-2xl border border-hairline bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-1">
            {questions && (Array.isArray(questions) ? questions : Object.values(questions as Record<string, { question: string; answer: string }>)).map((q, i) => (
              <details key={i} className="group border-b border-hairline last:border-0">
                <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-left text-base font-bold text-ink-strong transition-colors hover:text-pine-600 focus:outline-none">
                  {q.question}
                  <span className="msym shrink-0 text-[24px] text-muted transition-transform duration-300 group-open:rotate-180">
                    keyboard_arrow_down
                  </span>
                </summary>
                <div className="pb-5">
                  <p className="text-sm leading-relaxed text-muted">{q.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
