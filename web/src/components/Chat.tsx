"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";

interface ChatProps {
  chatId: string;
  initialMessages?: UIMessage[];
  onMessageSent?: () => void;
  sendRef?: React.MutableRefObject<((text: string) => void) | null>;
}

export default function Chat({ chatId, initialMessages, onMessageSent, sendRef }: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, stop, status, error } = useChat({
    id: chatId,
    messages: initialMessages,
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (sendRef) sendRef.current = (text: string) => { sendMessage({ text }); onMessageSent?.(); };
  }, [sendMessage, sendRef, onMessageSent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const text = inputRef.current?.value.trim();
    if (!text || isLoading) return;
    inputRef.current!.value = "";
    sendMessage({ text });
    onMessageSent?.();
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto py-6 px-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-zinc-400 text-sm">무엇을 도와드릴까요?</p>
          </div>
        )}

        {messages.map((m) => {
          const text = m.parts
            .filter((p) => p.type === "text")
            .map((p) => ("text" in p ? p.text : ""))
            .join("");

          if (!text && m.role !== "assistant") return null;

          return (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black whitespace-pre-wrap"
                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 prose prose-sm dark:prose-invert max-w-none"
                }`}
              >
                {m.role === "assistant" && text ? (
                  <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }} />
                ) : text ? (
                  text
                ) : (
                  <span className="flex gap-1 items-center py-1">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {error && (
          <div className="flex justify-center">
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              오류: {error.message}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="메시지를 입력하세요… (Shift+Enter 줄바꿈)"
            disabled={isLoading}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50 leading-relaxed"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white px-4 py-3 text-sm font-medium transition-colors shrink-0"
            >
              중단
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              className="rounded-xl bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 dark:text-black text-white px-4 py-3 text-sm font-medium transition-colors shrink-0"
            >
              전송
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
