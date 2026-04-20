"use client";

import { useEffect, useRef } from "react";
import { AssistantRuntimeProvider, ThreadPrimitive, useThreadRuntime, useAuiState, useAui } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface AssistantChatProps {
  chatId: string;
  onMessageSent?: () => void;
  sendRef?: React.MutableRefObject<((text: string) => void) | null>;
  onUpdateInfoClick?: () => void;
}

// Custom Markdown renderer with same styles as before
function MarkdownContent({ content }: { content: string }) {
  const buttonHtml = '<button class="update-info-btn rounded-lg bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 dark:text-black text-white px-4 py-2 text-sm font-medium transition-colors">현행화하기</button>';
  const converted = content.replace(/\[현행화하기\]/gi, buttonHtml);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
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
              <code className={className} {...props}>{children}</code>
            </pre>
          );
        },
        ul({ children, ...props }) {
          return <ul className="list-disc list-inside space-y-1 my-2" {...props}>{children}</ul>;
        },
        ol({ children, ...props }) {
          return <ol className="list-decimal list-inside space-y-1 my-2" {...props}>{children}</ol>;
        },
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
        strong({ children, ...props }) {
          return <strong className="font-semibold" {...props}>{children}</strong>;
        },
        em({ children, ...props }) {
          return <em className="italic" {...props}>{children}</em>;
        },
        blockquote({ children, ...props }) {
          return (
            <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 my-2 italic text-zinc-600 dark:text-zinc-400" {...props}>
              {children}
            </blockquote>
          );
        },
        hr({ ...props }) {
          return <hr className="my-4 border-zinc-300 dark:border-zinc-700" {...props} />;
        },
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
}

// Custom message component
function CustomMessage({ message }: { message: any }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  // 버튼 클릭 이벤트 바인딩
  useEffect(() => {
    const buttons = document.querySelectorAll(".update-info-btn");
    buttons.forEach(btn => {
      const newBtn = btn.cloneNode(true) as HTMLElement;
      btn.parentNode?.replaceChild(newBtn, btn);
      newBtn.addEventListener("click", () => {
        const onUpdateInfoClick = (window as any).__onUpdateInfoClick;
        onUpdateInfoClick?.();
      });
    });
  }, [message]);

  const isUser = message.role === "user";
  const textParts = message.parts.filter((p: any) => p.type === "text");
  const text = textParts.map((p: any) => "text" in p ? p.text : "").join("");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black whitespace-pre-wrap"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 prose prose-sm dark:prose-invert max-w-none"
        }`}
      >
        {isUser ? (
          text
        ) : (
          <MarkdownContent content={text} />
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

// Custom input component
function CustomInput({ 
  onSend, 
  isLoading, 
  onStop,
  sendRef 
}: { 
  onSend: (text: string) => void;
  isLoading: boolean;
  onStop: () => void;
  sendRef?: React.MutableRefObject<((text: string) => void) | null>;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRuntime = useThreadRuntime();

  useEffect(() => {
    if (sendRef) {
      sendRef.current = (text: string) => {
        onSend(text);
      };
    }
  }, [onSend, sendRef]);

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
    onSend(text);
  }

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
      <div className="flex gap-2 max-w-3xl mx-auto">
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="메시지를 입력하세요... (Shift+Enter 줄바꿈)"
          disabled={isLoading}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50 leading-relaxed"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
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
  );
}

// Main chat component
function ChatContent({ 
  onMessageSent, 
  sendRef, 
  onUpdateInfoClick 
}: Omit<AssistantChatProps, "chatId" | "initialMessages">) {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  const threadRuntime = useThreadRuntime();
  const isLoading = useAuiState((s) => s.thread.isRunning);
  const aui = useAui();

  // Global handler for update info button
  useEffect(() => {
    (window as any).__onUpdateInfoClick = onUpdateInfoClick;
  }, [onUpdateInfoClick]);

  function handleSend(text: string) {
    threadRuntime.append({
      role: "user",
      content: [{ type: "text", text }],
    });
    onMessageSent?.();
  }

  function handleStop() {
    aui.thread().cancelRun();
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto py-6 px-6 space-y-4">
        <ThreadPrimitive.Empty>
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-zinc-400 text-sm">무엇을 도와드릴까요?</p>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages>
          {({ message }) => <CustomMessage message={message} />}
        </ThreadPrimitive.Messages>
      </div>

      {/* 입력 영역 */}
      <CustomInput
        onSend={handleSend}
        isLoading={isLoading}
        onStop={handleStop}
        sendRef={sendRef}
      />
    </div>
  );
}

export default function AssistantChat({ 
  chatId, 
  onMessageSent, 
  sendRef, 
  onUpdateInfoClick 
}: AssistantChatProps) {
  return (
    <AssistantRuntimeProvider runtime={useChatRuntime({
      transport: new AssistantChatTransport({
        api: "/api/chat",
      }),
    })}>
      <ChatContent
        onMessageSent={onMessageSent}
        sendRef={sendRef}
        onUpdateInfoClick={onUpdateInfoClick}
      />
    </AssistantRuntimeProvider>
  );
}
