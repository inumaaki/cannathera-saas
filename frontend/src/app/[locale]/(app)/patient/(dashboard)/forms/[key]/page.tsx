import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { FormRenderer, type Structure } from "./FormRenderer";

/* Dynamic questionnaire page — renders whatever the DB defines. */
export default async function QuestionnairePage({
  params,
}: Readonly<{ params: Promise<{ locale: string; key: string }> }>) {
  const { locale, key } = await params;
  setRequestLocale(locale);

  const structure = await apiServer<Structure>(
    `/questionnaires/${encodeURIComponent(key)}?locale=${locale}`,
  );
  if (!structure) notFound();

  return <FormRenderer structure={structure} />;
}
