"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface ChatProps {
  chatId: string;
  initialMessages?: UIMessage[];
  onMessageSent?: () => void;
  sendRef?: React.MutableRefObject<((text: string) => void) | null>;
  onUpdateInfoClick?: () => void;
}

export default function Chat({ chatId, initialMessages, onMessageSent, sendRef, onUpdateInfoClick }: ChatProps) {
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

  // 마크다운 패턴을 버튼으로 변환하고 마크다운 렌더링
  const renderAssistantMessage = useCallback((text: string) => {
    // [현행화하기] 패턴을 HTML 버튼으로 변환
    const buttonHtml = '<button class="update-info-btn rounded-lg bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 dark:text-black text-white px-4 py-2 text-sm font-medium transition-colors">현행화하기</button>';
    const converted = text.replace(/\[현행화하기\]/gi, buttonHtml);
    
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // 코드 블록 스타일
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-zinc-800 text-zinc-100 p-4 rounded-lg overflow-x-auto my-2">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          // 리스트 스타일
          ul({ children, ...props }) {
            return <ul className="list-disc list-inside space-y-1 my-2" {...props}>{children}</ul>;
          },
          ol({ children, ...props }) {
            return <ol className="list-decimal list-inside space-y-1 my-2" {...props}>{children}</ol>;
          },
          // 링크 스타일
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          // 테이블 스타일
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-700">
                  {children}
                </table>
              </div>
            );
          },
          th({ children, ...props }) {
            return (
              <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 font-semibold" {...props}>
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2" {...props}>
                {children}
              </td>
            );
          },
          // 강조 스타일
          strong({ children, ...props }) {
            return <strong className="font-semibold" {...props}>{children}</strong>;
          },
          em({ children, ...props }) {
            return <em className="italic" {...props}>{children}</em>;
          },
          // 인용구 스타일
          blockquote({ children, ...props }) {
            return (
              <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 my-2 italic text-zinc-600 dark:text-zinc-400" {...props}>
                {children}
              </blockquote>
            );
          },
          // 수평선 스타일
          hr({ ...props }) {
            return <hr className="my-4 border-zinc-300 dark:border-zinc-700" {...props} />;
          },
          // 제목 스타일
          h1({ children, ...props }) {
            return <h1 className="text-xl font-bold my-3" {...props}>{children}</h1>;
          },
          h2({ children, ...props }) {
            return <h2 className="text-lg font-bold my-2" {...props}>{children}</h2>;
          },
          h3({ children, ...props }) {
            return <h3 className="text-base font-semibold my-2" {...props}>{children}</h3>;
          },
          p({ children, ...props }) {
            return <p className="my-2" {...props}>{children}</p>;
          },
        }}
      >
        {converted}
      </ReactMarkdown>
    );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 버튼 클릭 이벤트 바인딩 (DOM 렌더링 후 실행)
  useEffect(() => {
    const buttons = document.querySelectorAll(".update-info-btn");
    buttons.forEach(btn => {
      // 기존 리스너 제거 (중복 방지)
      const newBtn = btn.cloneNode(true) as HTMLElement;
      btn.parentNode?.replaceChild(newBtn, btn);
      
      // 새 버튼에 이벤트 리스너 추가
      newBtn.addEventListener("click", () => {
        onUpdateInfoClick?.();
      });
    });
  }, [messages, onUpdateInfoClick]);

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

        {messages.map((m, index) => {
          const text = m.parts
            .filter((p) => p.type === "text")
            .map((p) => ("text" in p ? p.text : ""))
            .join("");

          // 마지막 메시지가 assistant 이고 스트리밍 중이면 로딩 표시
          const isLastAssistant = index === messages.length - 1 && m.role === "assistant";
          const isStreaming = isLastAssistant && status === "streaming";

          if (!text && m.role !== "assistant" && !isStreaming) return null;

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
                  renderAssistantMessage(text)
                ) : isStreaming ? (
                  <span className="flex gap-1 items-center py-1">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                ) : text ? (
                  text
                ) : null}
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
