import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { conversationStore } from "@/lib/conversationStore";

const API_ENDPOINT = process.env.AIONU_API_ENDPOINT!;
const API_KEY = process.env.AIONU_API_KEY!;

export async function POST(req: Request) {
  const body = await req.json();
  const { id: chatId, messages, user } = body as {
    id: string;
    messages: Array<{ role: string; parts: Array<{ type: string; text?: string }> }>;
    user?: string;
  };

  const lastMessage = messages[messages.length - 1];
  const queryText = lastMessage.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");

  const conversationId = conversationStore.get(chatId) ?? "";

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const response = await fetch(`${API_ENDPOINT}/chat-messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {},
          query: queryText,
          response_mode: "streaming",
          conversation_id: conversationId,
          user: user ?? "web-user",
          auto_generate_name: false,
        }),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(err.message ?? `API error ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const textPartId = "text-0";
      let textStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(raw);
          } catch {
            continue;
          }

          if (
            (event.event === "agent_message" || event.event === "message") &&
            typeof event.answer === "string" &&
            event.answer
          ) {
            if (!textStarted) {
              writer.write({ type: "text-start", id: textPartId });
              textStarted = true;
            }
            writer.write({
              type: "text-delta",
              id: textPartId,
              delta: event.answer,
            });
          }

          if (event.event === "message_end") {
            if (typeof event.conversation_id === "string") {
              conversationStore.set(chatId, event.conversation_id);
            }
          }
        }
      }

      if (textStarted) {
        writer.write({ type: "text-end", id: textPartId });
      }
    },
    onError: (error) =>
      error instanceof Error ? error.message : "스트리밍 오류가 발생했습니다.",
  });

  return createUIMessageStreamResponse({ stream });
}

export async function DELETE(req: Request) {
  const { chatId } = (await req.json()) as { chatId: string };
  conversationStore.delete(chatId);
  return Response.json({ ok: true });
}
