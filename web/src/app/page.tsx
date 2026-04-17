"use client";

import { useState, useCallback, useRef } from "react";
import { generateId, type UIMessage } from "ai";
import Chat from "@/components/Chat";
import ConversationSidebar from "@/components/ConversationSidebar";
import UpdateInfoModal from "@/components/UpdateInfoModal";

interface ChatSession {
  chatId: string;
  conversationId: string | null;
  initialMessages: UIMessage[];
}

export default function Home() {
  const [session, setSession] = useState<ChatSession>(() => ({
    chatId: generateId(),
    conversationId: null,
    initialMessages: [],
  }));
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const chatSendRef = useRef<((text: string) => void) | null>(null);

  const startNewChat = useCallback(() => {
    setSession({ chatId: generateId(), conversationId: null, initialMessages: [] });
  }, []);

  const selectConversation = useCallback(async (conversationId: string) => {
    // 서버에 chatId ↔ conversationId 매핑 등록
    const initRes = await fetch("/api/chat/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    });
    const { chatId } = await initRes.json() as { chatId: string };

    // 기존 대화 메시지 로드
    const msgRes = await fetch(`/api/conversations/${conversationId}/messages?user=web-user`);
    const msgData = await msgRes.json() as {
      data: Array<{ id: string; query: string; answer: string }>;
    };

    const initialMessages: UIMessage[] = [];
    for (const msg of (msgData.data ?? []).reverse()) {
      initialMessages.push({
        id: `${msg.id}_user`,
        role: "user",
        parts: [{ type: "text", text: msg.query }],
      });
      if (msg.answer) {
        initialMessages.push({
          id: `${msg.id}_assistant`,
          role: "assistant",
          parts: [{ type: "text", text: msg.answer }],
        });
      }
    }

    setSession({ chatId, conversationId, initialMessages });
  }, []);

  // 메시지 전송 후 사이드바 새로고침
  const handleMessageSent = useCallback(() => {
    setTimeout(() => setSidebarRefresh((n) => n + 1), 3000);
  }, []);

  return (
    <div className="flex h-full bg-white dark:bg-zinc-950">
      <ConversationSidebar
        activeChatId={session.conversationId}
        onNewChat={startNewChat}
        onSelectConversation={selectConversation}
        refreshTrigger={sidebarRefresh}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => chatSendRef.current?.("내 정보를 아직 현행화 하지 않았나요? 현행화 해주세요.")}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            내 정보를 아직 현행화 하지 않았나요?
          </button>
          <button
            onClick={() => setShowUpdateModal(true)}
            className="rounded-lg bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 dark:text-black text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            현행화하기
          </button>
        </div>
        <Chat
          key={session.chatId}
          chatId={session.chatId}
          initialMessages={session.initialMessages}
          onMessageSent={handleMessageSent}
          sendRef={chatSendRef}
        />
      </div>

      {showUpdateModal && (
        <UpdateInfoModal onClose={() => setShowUpdateModal(false)} />
      )}
    </div>
  );
}
