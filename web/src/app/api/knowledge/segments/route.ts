const API_ENDPOINT = process.env.AIONU_API_ENDPOINT!;
const KNOWLEDGE_API_KEY = process.env.AIONU_KNOWLEDGE_API_KEY!;
const DATASET_ID = process.env.AIONU_DATASET_ID!;
const DOCUMENT_ID = process.env.AIONU_DOCUMENT_ID!;

export async function POST(req: Request) {
  const { name, team, work } = (await req.json()) as {
    name: string;
    team: string;
    work: string;
  };

  const content = `이름: ${name}\n팀: ${team}\n업무: ${work}`;

  const response = await fetch(
    `${API_ENDPOINT}/datasets/${DATASET_ID}/documents/${DOCUMENT_ID}/segments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KNOWLEDGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        segments: [
          {
            content,
            keywords: [name, team, "사용자정보"],
          },
        ],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return Response.json(data, { status: response.status });
  }

  return Response.json(data);
}
