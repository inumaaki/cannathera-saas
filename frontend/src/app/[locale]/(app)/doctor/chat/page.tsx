"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/layout";
import Link from "next/link";
import { formatDistanceToNow, type Locale } from "date-fns";
import { ar, bg, de, enUS, pl, ro, ru, tr, uk } from "date-fns/locale";
import { useParams } from "next/navigation";

const LOCALE_MAP: Record<string, Locale> = {
  de, en: enUS, ar, bg, pl, ro, ru, tr, uk,
};

type Thread = {
  id: string;
  pharmacy: { id: string; name: string; city: string | null };
  messages: Array<{ content: string; createdAt: string; senderId: string }>;
  updatedAt: string;
};

export default function DoctorChatIndexPage() {
  const t = useTranslations("doctor.chat");
  const params = useParams();
  const dateFnsLocale = LOCALE_MAP[params.locale as string] ?? enUS;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<Thread[]>("/doctor/chat/threads");
        setThreads(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-strong">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-hairline bg-surface/50">
          <span className="msym animate-spin text-[32px] text-muted">refresh</span>
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-hairline bg-surface/50 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-pine/10 text-pine">
            <span className="msym text-[32px]">chat</span>
          </div>
          <div>
            <p className="font-semibold text-ink-strong">{t("noThreads")}</p>
            <p className="mt-1 text-sm text-muted">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="/doctor/pharmacies"
            className="inline-flex items-center gap-2 rounded-xl bg-pine px-5 py-2.5 text-sm font-bold text-white hover:bg-pine/90"
          >
            <span className="msym text-[18px]">local_pharmacy</span>
            {t("browsePharmacies")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {threads.map((thread) => {
            const lastMsg = thread.messages[0];
            return (
              <Link key={thread.id} href={`/doctor/chat/${thread.pharmacy.id}`}>
                <Card className="flex items-center gap-4 p-4 transition-all hover:border-pine/30 hover:shadow-md">
                  {/* Avatar */}
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
                    <span className="msym text-[24px]">local_pharmacy</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate font-bold text-ink-strong">
                        {thread.pharmacy.name}
                      </h3>
                      <span className="shrink-0 text-xs text-muted">
                        {formatDistanceToNow(new Date(thread.updatedAt), {
                          addSuffix: true,
                          locale: dateFnsLocale,
                        })}
                      </span>
                    </div>
                    {thread.pharmacy.city && (
                      <p className="text-xs text-muted">{thread.pharmacy.city}</p>
                    )}
                    <p className="mt-1 truncate text-sm text-muted">
                      {lastMsg ? lastMsg.content : "—"}
                    </p>
                  </div>

                  <span className="msym shrink-0 text-[18px] text-muted">chevron_right</span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
