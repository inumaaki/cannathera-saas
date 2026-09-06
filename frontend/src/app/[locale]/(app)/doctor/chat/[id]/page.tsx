"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/layout";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; firstName: string | null; lastName: string | null };
};

type PharmacyInfo = {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
};

type Me = { id: string; firstName: string | null; lastName: string | null };

export default function DoctorChatThreadPage() {
  const t = useTranslations("doctor.chat");
  const params = useParams();
  const router = useRouter();
  const pharmacyId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [pharmacy, setPharmacy] = useState<PharmacyInfo | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Fetch current user + pharmacy info once
  useEffect(() => {
    async function init() {
      try {
        const [meData, pharmacyData] = await Promise.all([
          api<Me>("/auth/me"),
          api<PharmacyInfo[]>("/doctor/pharmacies").catch(() => [] as PharmacyInfo[]),
        ]);
        setMe(meData);
        // Find pharmacy by id from the list, or fall back to just the id
        const found = (pharmacyData as PharmacyInfo[]).find((p) => p.id === pharmacyId);
        if (found) setPharmacy(found);
      } catch (err) {
        console.error(err);
      }
    }
    if (pharmacyId) init();
  }, [pharmacyId]);

  // Load messages
  const loadMessages = useCallback(async (initial = false) => {
    try {
      const data = await api<Message[]>(`/doctor/chat/${pharmacyId}/messages`);
      setMessages((prev) => {
        // Only update if something changed (avoid unnecessary re-renders)
        if (JSON.stringify(prev.map((m) => m.id)) === JSON.stringify(data.map((m) => m.id))) return prev;
        return data;
      });
      if (initial) scrollToBottom(false);
    } catch (err) {
      console.error(err);
    } finally {
      if (initial) setLoading(false);
    }
  }, [pharmacyId, scrollToBottom]);

  useEffect(() => {
    if (!pharmacyId) return;
    loadMessages(true);
    // Poll every 5 seconds for new messages
    pollRef.current = setInterval(() => loadMessages(false), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pharmacyId, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = content.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const msg = await api<Message>(`/doctor/chat/${pharmacyId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });
      setMessages((prev) => [...prev, msg]);
      setContent("");
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const pharmacyName = pharmacy?.name ?? t("chatWith");

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/doctor/chat")}
          className="flex size-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface hover:text-ink-strong"
          aria-label={t("backToList")}
        >
          <span className="msym text-[22px]">arrow_back</span>
        </button>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
          <span className="msym text-[20px]">local_pharmacy</span>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-ink-strong">{pharmacyName}</h1>
          {pharmacy?.city && (
            <p className="text-xs text-muted">{pharmacy.city}</p>
          )}
        </div>

        {pharmacy?.phone && (
          <a
            href={`tel:${pharmacy.phone}`}
            className="flex size-9 items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-pine"
            title={pharmacy.phone}
          >
            <span className="msym text-[20px]">phone</span>
          </a>
        )}

        <Link
          href={`/doctor/pharmacies`}
          className="flex size-9 items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-pine"
          title="Pharmacy info"
        >
          <span className="msym text-[20px]">info</span>
        </Link>
      </div>

      {/* Message area */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-surface/30 px-4 py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <span className="msym animate-spin text-[32px] text-muted">refresh</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-pine/10 text-pine">
                <span className="msym text-[28px]">chat</span>
              </div>
              <p className="max-w-xs text-sm text-muted">{t("noMessages")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => {
                const isMe = me ? msg.senderId === me.id : false;
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const showSender =
                  !prevMsg || prevMsg.senderId !== msg.senderId;
                const showDate =
                  !prevMsg ||
                  new Date(msg.createdAt).toDateString() !==
                    new Date(prevMsg.createdAt).toDateString();

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="my-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-hairline" />
                        <span className="text-xs font-semibold text-muted">
                          {format(new Date(msg.createdAt), "EEEE, d. MMM yyyy")}
                        </span>
                        <div className="h-px flex-1 bg-hairline" />
                      </div>
                    )}

                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {showSender && (
                        <span className="mb-1 px-1 text-xs text-muted">
                          {isMe
                            ? t("you")
                            : `${msg.sender.firstName ?? ""} ${msg.sender.lastName ?? ""}`.trim()}
                        </span>
                      )}
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                          isMe
                            ? "bg-pine text-white rounded-tr-sm"
                            : "border border-hairline bg-white text-ink-strong rounded-tl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                      <span className="mt-1 px-1 text-[10px] text-muted">
                        {format(new Date(msg.createdAt), "HH:mm")}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-hairline bg-white px-4 py-3">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder={t("messagePlaceholder")}
              className="flex-1 rounded-xl border border-hairline bg-surface/50 px-4 py-2.5 text-sm text-ink-strong transition-colors focus:border-pine focus:bg-white focus:outline-none focus:ring-1 focus:ring-pine disabled:opacity-60"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!content.trim() || sending}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pine text-white transition-all hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
            >
              {sending ? (
                <span className="msym animate-spin text-[18px]">refresh</span>
              ) : (
                <span className="msym text-[18px]">send</span>
              )}
            </button>
          </form>
          <p className="mt-1.5 text-[10px] text-muted">Enter ↵ zum Senden</p>
        </div>
      </Card>
    </div>
  );
}
