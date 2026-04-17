const API_ENDPOINT = process.env.AIONU_API_ENDPOINT!;
const API_KEY = process.env.AIONU_API_KEY!;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user") ?? "web-user";

  const response = await fetch(
    `${API_ENDPOINT}/messages?conversation_id=${encodeURIComponent(id)}&user=${encodeURIComponent(user)}&limit=50`,
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );

  const data = await response.json();
  return Response.json(data);
}
