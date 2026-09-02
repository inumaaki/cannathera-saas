"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/layout";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useParams } from "next/navigation";

type Thread = {
  id: string;
  practice: { id: string; name: string; city: string | null };
  messages: Array<{ content: string; createdAt: string }>;
  updatedAt: string;
};

export default function PharmacyChatIndexPage() {
  const t = useTranslations("pharmacy.chat");
  const params = useParams();
  const locale = params.locale === "en" ? enUS : de;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<Thread[]>("/pharmacy/chat/threads");
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-strong">{t("title") || "Nachrichten"}</h1>
          <p className="mt-1 text-sm text-muted">
            {t("subtitle") || "Sicherer Austausch mit Arztpraxen."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-hairline bg-surface/50">
          <span className="msym animate-spin text-[32px] text-muted">refresh</span>
        </div>
      ) : threads.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-hairline bg-surface/50">
          <p className="text-sm font-semibold text-muted">{t("noThreads") || "Keine Nachrichten vorhanden."}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {threads.map((thread) => (
            <Link key={thread.id} href={`/pharmacy/chat/${thread.practice.id}`}>
              <Card className="flex items-center gap-4 p-4 hover:border-pine/30 hover:shadow-md transition-all">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
                  <span className="msym text-[24px]">medical_services</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate font-bold text-ink-strong">
                      {thread.practice.name}
                    </h3>
                    <span className="text-xs text-muted">
                      {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true, locale })}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted mt-1">
                    {thread.messages.length > 0 ? thread.messages[0].content : "Noch keine Nachrichten"}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
