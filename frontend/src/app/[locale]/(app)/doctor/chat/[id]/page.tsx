"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/layout";
import { useParams, useRouter } from "next/navigation";
import { TextField } from "@/components/ui/fields";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; firstName: string | null; lastName: string | null };
};

export default function DoctorChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const pharmacyId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('__user') : null;
  const currentUserId = userStr ? JSON.parse(userStr).id : null;

  useEffect(() => {
    async function load() {
      try {
        const data = await api<Message[]>(`/doctor/chat/${pharmacyId}/messages`);
        setMessages(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (pharmacyId) load();
  }, [pharmacyId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      const msg = await api<Message>(`/doctor/chat/${pharmacyId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      setMessages((prev) => [...prev, msg]);
      setContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/doctor/chat')}
          className="flex items-center justify-center rounded-xl hover:bg-surface/50 p-2"
        >
          <span className="msym text-[20px]">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-ink-strong">Chat mit Apotheke</h1>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface/50">
          {loading ? (
             <div className="flex h-full items-center justify-center">
               <span className="msym animate-spin text-[32px] text-muted">refresh</span>
             </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted">Starten Sie die Konversation.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-muted mb-1 px-1">
                    {msg.sender.firstName} {msg.sender.lastName}
                  </span>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe ? 'bg-pine text-white rounded-tr-sm' : 'bg-white border border-hairline text-ink-strong rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        
        <div className="p-4 bg-white border-t border-hairline">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              placeholder="Schreiben Sie eine Nachricht..."
              className="flex-1 rounded-xl border border-hairline bg-surface/50 px-4 py-2 text-sm text-ink-strong focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={sending}
            />
            <button 
              type="submit" 
              disabled={!content.trim() || sending}
              className="flex items-center justify-center rounded-xl bg-pine px-4 text-white disabled:opacity-50"
            >
              <span className="msym">send</span>
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
