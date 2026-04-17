import { generateId } from "ai";
import { conversationStore } from "@/lib/conversationStore";

export async function POST(req: Request) {
  const { conversationId } = (await req.json()) as { conversationId: string };
  const chatId = generateId();
  conversationStore.set(chatId, conversationId);
  return Response.json({ chatId });
}
