const API_ENDPOINT = process.env.AIONU_API_ENDPOINT!;
const KNOWLEDGE_API_KEY = process.env.AIONU_KNOWLEDGE_API_KEY!;
const DATASET_ID = process.env.AIONU_DATASET_ID!;
const DOCUMENT_ID = process.env.AIONU_DOCUMENT_ID!;

// 세그먼트 목록 조회
async function getSegments(): Promise<any[]> {
  const response = await fetch(
    `${API_ENDPOINT}/datasets/${DATASET_ID}/documents/${DOCUMENT_ID}/segments`,
    {
      headers: {
        Authorization: `Bearer ${KNOWLEDGE_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    console.error("세그먼트 목록 조회 실패:", response.status);
    return [];
  }

  const data = await response.json();
  return data.data || [];
}

// 이름으로 세그먼트 찾기
async function findSegmentByName(name: string): Promise<string | null> {
  const segments = await getSegments();
  
  // 세그먼트 내용에서 이름 찾기 (예: "이름: 홍길동")
  const found = segments.find((seg) => 
    seg.content?.includes(`이름: ${name}`)
  );
  
  return found?.id || null;
}

// 세그먼트 삭제
async function deleteSegment(segmentId: string): Promise<boolean> {
  const response = await fetch(
    `${API_ENDPOINT}/datasets/${DATASET_ID}/documents/${DOCUMENT_ID}/segments/${segmentId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${KNOWLEDGE_API_KEY}`,
      },
    }
  );

  return response.ok;
}

// 새 세그먼트 생성
async function createSegment(name: string, team: string, work: string): Promise<any> {
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

  return response.json();
}

export async function POST(req: Request) {
  const { name, team, work } = (await req.json()) as {
    name: string;
    team: string;
    work: string;
  };

  try {
    // 1. 중복된 세그먼트 찾기 (이름 기반)
    const existingSegmentId = await findSegmentByName(name);

    // 2. 중복 세그먼트가 있으면 삭제
    if (existingSegmentId) {
      console.log(`중복 세그먼트 발견: ${existingSegmentId}, 삭제 중...`);
      await deleteSegment(existingSegmentId);
      console.log("중복 세그먼트 삭제 완료");
    }

    // 3. 새 세그먼트 생성
    console.log("새 세그먼트 생성 중...");
    const result = await createSegment(name, team, work);

    return Response.json(result);
  } catch (error) {
    console.error("지식 업데이트 실패:", error);
    return Response.json(
      { message: "지식 업데이트 실패", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return Response.json(
      { message: "삭제할 담당자 이름이 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 1. 이름으로 세그먼트 찾기
    const segmentId = await findSegmentByName(name);

    if (!segmentId) {
      return Response.json(
        { message: `이름 "${name}" 의 담당자를 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    // 2. 세그먼트 삭제
    console.log(`세그먼트 삭제 중: ${segmentId} (이름: ${name})`);
    const success = await deleteSegment(segmentId);

    if (!success) {
      return Response.json(
        { message: "세그먼트 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    console.log(`세그먼트 삭제 완료: ${name}`);
    return Response.json({ 
      message: "삭제되었습니다.",
      deletedName: name 
    });
  } catch (error) {
    console.error("세그먼트 삭제 실패:", error);
    return Response.json(
      { message: "삭제에 실패했습니다.", error: String(error) },
      { status: 500 }
    );
  }
}
