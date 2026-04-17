const API_ENDPOINT = process.env.AIONU_API_ENDPOINT!;
const API_KEY = process.env.AIONU_API_KEY!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user") ?? "web-user";
  const limit = searchParams.get("limit") ?? "50";

  const response = await fetch(
    `${API_ENDPOINT}/conversations?user=${encodeURIComponent(user)}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );

  const data = await response.json();
  return Response.json(data);
}
