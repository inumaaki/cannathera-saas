"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/layout";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow, type Locale } from "date-fns";
import { ar, bg, de, enUS, pl, ro, ru, tr, uk } from "date-fns/locale";

const LOCALE_MAP: Record<string, Locale> = {
  de,
  en: enUS,
  ar,
  bg,
  pl,
  ro,
  ru,
  tr,
  uk,
};

type Thread = {
  id: string;
  practice: { id: string; name: string; city: string | null };
  messages: Array<{ content: string; createdAt: string }>;
  updatedAt: string;
};

type PracticeOption = {
  id: string;
  name: string;
  city: string | null;
};

export default function PharmacyChatIndexPage() {
  const t = useTranslations("pharmacy.chat");
  const router = useRouter();
  const params = useParams();
  const dateFnsLocale = LOCALE_MAP[params.locale as string] ?? de;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [practices, setPractices] = useState<PracticeOption[]>([]);
  const [loadingPractices, setLoadingPractices] = useState(false);
  const [selectedPracticeId, setSelectedPracticeId] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadThreads = async (isInitial = false) => {
    try {
      const data = await api<Thread[]>("/pharmacy/chat/threads");
      setThreads(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads(true);
    pollRef.current = setInterval(() => loadThreads(false), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const openNewModal = async () => {
    setShowNewModal(true);
    if (practices.length === 0) {
      setLoadingPractices(true);
      try {
        const list = await api<PracticeOption[]>("/pharmacy/network/physicians");
        setPractices(list);
        if (list.length > 0) setSelectedPracticeId(list[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPractices(false);
      }
    }
  };

  const handleStartChat = () => {
    if (!selectedPracticeId) return;
    router.push(`/pharmacy/chat/${selectedPracticeId}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-strong">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-pine transition-all"
        >
          <span className="msym text-[18px]">add_comment</span>
          <span>{t("newConversation")}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-hairline bg-surface/50">
          <span className="msym animate-spin text-[32px] text-muted">refresh</span>
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-hairline bg-surface/50 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-pine/10 text-pine">
            <span className="msym text-[32px]">chat</span>
          </div>
          <div>
            <p className="font-semibold text-ink-strong">{t("noThreads")}</p>
            <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-2 rounded-xl bg-pine px-5 py-2.5 text-sm font-bold text-white hover:bg-pine/90"
            >
              <span className="msym text-[18px]">add_comment</span>
              {t("newConversation")}
            </button>
            <Link
              href="/pharmacy/network"
              className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-white px-5 py-2.5 text-sm font-bold text-ink-strong hover:bg-surface"
            >
              <span className="msym text-[18px]">medical_services</span>
              {t("browsePractices")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {threads.map((thread) => {
            const lastMsg = thread.messages[0];
            return (
              <Link key={thread.id} href={`/pharmacy/chat/${thread.practice.id}`}>
                <Card className="flex items-center gap-4 p-4 transition-all hover:border-pine/30 hover:shadow-md">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
                    <span className="msym text-[24px]">medical_services</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate font-bold text-ink-strong">
                        {thread.practice.name}
                      </h3>
                      <span className="text-xs text-muted">
                        {formatDistanceToNow(new Date(thread.updatedAt), {
                          addSuffix: true,
                          locale: dateFnsLocale,
                        })}
                      </span>
                    </div>
                    {thread.practice.city && (
                      <p className="text-xs text-muted">{thread.practice.city}</p>
                    )}
                    <p className="truncate text-sm text-muted mt-1">
                      {lastMsg ? lastMsg.content : t("noMessages")}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setShowNewModal(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-hairline bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-hairline">
              <h2 className="font-bold text-lg text-ink-strong">
                {t("newConversation")}
              </h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="size-8 flex items-center justify-center rounded-lg text-muted hover:bg-surface"
              >
                <span className="msym text-[20px]">close</span>
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-strong mb-1.5">
                  {t("selectPractice")}
                </label>
                {loadingPractices ? (
                  <div className="flex h-11 items-center justify-center rounded-lg border border-hairline bg-surface/50 text-sm text-muted">
                    <span className="msym animate-spin mr-2">refresh</span>
                    Lade Praxen...
                  </div>
                ) : (
                  <select
                    value={selectedPracticeId}
                    onChange={(e) => setSelectedPracticeId(e.target.value)}
                    className="h-11 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-ink-strong outline-none focus:border-pine"
                  >
                    {practices.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.city ? `(${p.city})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-muted hover:bg-surface"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleStartChat}
                disabled={!selectedPracticeId || loadingPractices}
                className="flex items-center gap-2 rounded-lg bg-pine px-5 py-2 text-sm font-bold text-white hover:bg-pine/90 disabled:opacity-50"
              >
                <span className="msym text-[18px]">chat</span>
                {t("startChat")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
