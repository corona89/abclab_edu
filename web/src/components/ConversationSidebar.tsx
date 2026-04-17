"use client";

import { useEffect, useState, useCallback } from "react";

interface Conversation {
  id: string;
  name: string;
  created_at: number;
}

interface Props {
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
  refreshTrigger: number;
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function ConversationSidebar({
  activeChatId,
  onNewChat,
  onSelectConversation,
  refreshTrigger,
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations?user=web-user&limit=50");
      const data = await res.json();
      setConversations(data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, refreshTrigger]);

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-zinc-950 text-zinc-100 border-r border-zinc-800">
      {/* 헤더 */}
      <div className="px-4 py-4 border-b border-zinc-800">
        <span className="text-sm font-semibold tracking-wide text-zinc-300">
          AI:ON-U Chat
        </span>
      </div>

      {/* 새 대화 버튼 */}
      <div className="px-3 pt-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          <span>대화 시작</span>
        </button>
      </div>

      {/* 대화 목록 */}
      <div className="flex-1 overflow-y-auto mt-3 px-2 pb-4">
        {loading && conversations.length === 0 ? (
          <p className="text-xs text-zinc-500 px-2 py-3">불러오는 중...</p>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-zinc-500 px-2 py-3">대화 내역이 없습니다</p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors group ${
                    activeChatId === conv.id
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  }`}
                >
                  <p className="text-sm truncate leading-snug">
                    {conv.name || "새 대화"}
                  </p>
                  <p className="text-xs text-zinc-600 group-hover:text-zinc-500 mt-0.5">
                    {formatDate(conv.created_at)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
