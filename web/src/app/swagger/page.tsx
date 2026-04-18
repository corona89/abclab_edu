"use client";

import "swagger-ui-react/swagger-ui.css";
import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function SwaggerPage() {
  return (
    <div className="h-screen w-full">
      <SwaggerUI
        spec={{
          openapi: "3.0.3",
          info: {
            title: "AI:ON-U API 테스트 가이드",
            description: `
# AI:ON-U API 테스트 가이드

## 사용 방법
1. 상단 **Authorize** 버튼 클릭
2. **Bearer Token** 입력 (API 키 입력)
3. API 엔드포인트 선택 후 **Try it out** 클릭
4. 파라미터 입력 후 **Execute** 클릭

## 환경 변수
- Agent API Base URL: \`https://api.abclab.ktds.com/v1\`
- Knowledge API Base URL: \`https://api.abclab.ktds.com/v1\`

## 주요 API 카테고리

### Agent API - 채팅
- \`POST /chat-messages\`: 채팅 메시지 전송 (스트리밍 응답)
- \`POST /chat-messages/{task_id}/stop\`: 채팅 중단
- \`GET /conversations\`: 대화 목록 조회
- \`GET /conversations/{conversation_id}/messages\`: 메시지 히스토리 조회

### Knowledge API - 지식 관리
- \`GET /datasets\`: 지식 목록 조회
- \`GET /datasets/{dataset_id}/documents\`: 문서 목록 조회
- \`GET /datasets/{dataset_id}/documents/{document_id}/segments\`: 세그먼트 목록 조회
- \`POST /datasets/{dataset_id}/documents/{document_id}/segments\`: 세그먼트 생성
- \`DELETE /datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}\`: 세그먼트 삭제

## 주의사항
- chat 모드에서는 \`blocking\` 응답 모드를 지원하지 않습니다
- 모든 API 요청에는 Bearer 토큰이 필요합니다
            `,
            version: "1.0.0",
          },
          servers: [
            {
              url: "https://api.abclab.ktds.com/v1",
              description: "AI:ON-U API 서버",
            },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: `
API 키를 입력하세요.

- **Agent API**: ` + "`app-...`" + ` 형식의 키
- **Knowledge API**: ` + "`dataset-...`" + ` 형식의 키

환경 변수에서 확인 가능한 키를 입력하세요.
                `,
              },
            },
          },
          security: [{ bearerAuth: [] }],
          paths: {
            "/chat-messages": {
              post: {
                tags: ["Agent API - 채팅"],
                summary: "채팅 메시지 전송",
                description: `
사용자의 질문을 전송하고 AI 의 응답을 받습니다.

**주의**: chat 모드에서는 \`blocking\` 모드를 지원하지 않습니다. 반드시 \`streaming\` 모드를 사용하세요.

## 예시 요청
\`\`\`json
{
  "inputs": {},
  "query": "KT 통화비서에 대해 알려줘",
  "response_mode": "streaming",
  "conversation_id": "",
  "user": "web-user",
  "auto_generate_name": false
}
\`\`\`

## 응답 형식
스트리밍 응답 (Server-Sent Events):
\`\`\`
event: message
data: {"event": "message", "answer": "안녕"}

event: message
data: {"event": "message", "answer": "하세요"}

event: message_end
data: {"event": "message_end", "metadata": {...}}
\`\`\`
                `,
                requestBody: {
                  required: true,
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        required: ["query", "user", "response_mode"],
                        properties: {
                          query: {
                            type: "string",
                            description: "사용자의 질문",
                            example: "KT 통화비서에 대해 알려줘",
                          },
                          inputs: {
                            type: "object",
                            description: "앱에서 사전 정의한 변수",
                            example: {},
                          },
                          response_mode: {
                            type: "string",
                            enum: ["streaming", "blocking"],
                            description:
                              "응답 모드 (chat 모드에서는 streaming 만 지원)",
                            example: "streaming",
                          },
                          conversation_id: {
                            type: "string",
                            description: "대화 ID (비우면 새 대화 생성)",
                            example: "",
                          },
                          user: {
                            type: "string",
                            description: "사용자 ID (고유 값)",
                            example: "web-user",
                          },
                          auto_generate_name: {
                            type: "boolean",
                            description: "대화 제목 자동 생성",
                            example: false,
                          },
                        },
                      },
                    },
                  },
                },
                responses: {
                  "200": {
                    description: "스트리밍 응답 성공",
                  },
                },
              },
            },
            "/chat-messages/{task_id}/stop": {
              post: {
                tags: ["Agent API - 채팅"],
                summary: "진행 중인 채팅 중단",
                parameters: [
                  {
                    name: "task_id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "중단할 태스크 ID (message_end 이벤트 전까지 사용 가능)",
                  },
                ],
                requestBody: {
                  required: true,
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          user: { type: "string", example: "web-user" },
                        },
                      },
                    },
                  },
                },
                responses: {
                  "200": { description: "중단 성공" },
                },
              },
            },
            "/conversations": {
              get: {
                tags: ["Agent API - 대화 관리"],
                summary: "대화 목록 조회",
                parameters: [
                  {
                    name: "user",
                    in: "query",
                    required: true,
                    schema: { type: "string" },
                    example: "web-user",
                  },
                  {
                    name: "last_id",
                    in: "query",
                    schema: { type: "string" },
                    description: "페이지네이션용 마지막 ID",
                  },
                  {
                    name: "limit",
                    in: "query",
                    schema: { type: "integer", default: 20 },
                  },
                ],
                responses: {
                  "200": {
                    description: "대화 목록",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            data: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  id: { type: "string" },
                                  name: { type: "string" },
                                  created_at: { type: "integer" },
                                },
                              },
                            },
                            has_more: { type: "boolean" },
                            limit: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "/conversations/{conversation_id}/messages": {
              get: {
                tags: ["Agent API - 대화 관리"],
                summary: "대화 메시지 히스토리 조회",
                parameters: [
                  {
                    name: "conversation_id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                  },
                  {
                    name: "user",
                    in: "query",
                    required: true,
                    schema: { type: "string" },
                  },
                  {
                    name: "limit",
                    in: "query",
                    schema: { type: "integer", default: 20 },
                  },
                ],
                responses: {
                  "200": {
                    description: "메시지 히스토리",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            data: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  id: { type: "string" },
                                  query: { type: "string" },
                                  answer: { type: "string" },
                                  created_at: { type: "integer" },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "/datasets": {
              get: {
                tags: ["Knowledge API - 지식 관리"],
                summary: "지식 (Dataset) 목록 조회",
                parameters: [
                  {
                    name: "page",
                    in: "query",
                    schema: { type: "integer", default: 1 },
                  },
                  {
                    name: "limit",
                    in: "query",
                    schema: { type: "integer", default: 20 },
                  },
                  {
                    name: "dataset_name",
                    in: "query",
                    schema: { type: "string" },
                  },
                ],
                responses: {
                  "200": {
                    description: "지식 목록",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            data: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  id: { type: "string" },
                                  name: { type: "string" },
                                  description: { type: "string" },
                                  document_count: { type: "integer" },
                                },
                              },
                            },
                            total: { type: "integer" },
                            page: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "/datasets/{dataset_id}/documents": {
              get: {
                tags: ["Knowledge API - 문서 관리"],
                summary: "문서 목록 조회",
                parameters: [
                  {
                    name: "dataset_id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    example: "5abdc475-ee52-42b6-82d8-3b0f94cfcf82",
                  },
                  {
                    name: "keyword",
                    in: "query",
                    schema: { type: "string" },
                  },
                ],
                responses: {
                  "200": { description: "문서 목록" },
                },
              },
            },
            "/datasets/{dataset_id}/documents/{document_id}/segments": {
              get: {
                tags: ["Knowledge API - 세그먼트"],
                summary: "세그먼트 목록 조회",
                parameters: [
                  {
                    name: "dataset_id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                  },
                  {
                    name: "document_id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    example: "580bd971-42b4-4ed2-abfd-ca416ee73763",
                  },
                  {
                    name: "keyword",
                    in: "query",
                    schema: { type: "string" },
                  },
                ],
                responses: {
                  "200": {
                    description: "세그먼트 목록",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            data: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  id: { type: "string" },
                                  content: { type: "string" },
                                  keywords: {
                                    type: "array",
                                    items: { type: "string" },
                                  },
                                },
                              },
                            },
                            total: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
              post: {
                tags: ["Knowledge API - 세그먼트"],
                summary: "세그먼트 생성",
                description: `
새로운 세그먼트 (chunk) 를 생성합니다.

## 예시
\`\`\`json
{
  "segments": [
    {
      "content": "이름: 홍길동\\n팀: AI 혁신팀\\n업무: AI 서비스 기획",
      "keywords": ["홍길동", "AI 혁신팀", "사용자정보"]
    }
  ]
}
\`\`\`

**중복 처리**: 같은 이름의 세그먼트가 있으면 먼저 삭제하고 생성합니다.
                `,
                parameters: [
                  {
                    name: "dataset_id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                  },
                  {
                    name: "document_id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                  },
                ],
                requestBody: {
                  required: true,
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        required: ["segments"],
                        properties: {
                          segments: {
                            type: "array",
                            items: {
                              type: "object",
                              required: ["content"],
                              properties: {
                                content: {
                                  type: "string",
                                  example:
                                    "이름: 홍길동\n팀: AI 혁신팀\n업무: AI 서비스 기획",
                                },
                                keywords: {
                                  type: "array",
                                  items: { type: "string" },
                                  example: ["홍길동", "AI 혁신팀"],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                responses: {
                  "200": { description: "세그먼트 생성 성공" },
                },
              },
            },
            "/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}": {
              delete: {
                tags: ["Knowledge API - 세그먼트"],
                summary: "세그먼트 삭제",
                parameters: [
                  {
                    name: "dataset_id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                  },
                  {
                    name: "document_id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                  },
                  {
                    name: "segment_id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                  },
                ],
                responses: {
                  "200": {
                    description: "삭제 성공",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            result: { type: "string", example: "success" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "/parameters": {
              get: {
                tags: ["Agent API - 앱 정보"],
                summary: "앱 설정 조회",
                parameters: [
                  {
                    name: "user",
                    in: "query",
                    required: true,
                    schema: { type: "string" },
                  },
                ],
                responses: {
                  "200": {
                    description: "앱 설정",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            opening_statement: { type: "string" },
                            suggested_questions: {
                              type: "array",
                              items: { type: "string" },
                            },
                            user_input_form: { type: "array" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }}
        url=""
        docExpansion="list"
        deepLinking={false}
        displayOperationId={false}
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
        defaultModelRendering="example"
        displayRequestDuration={true}
        filter={true}
        showExtensions={false}
        showCommonExtensions={false}
        requestInterceptor={(req: any) => {
          req.headers["Content-Type"] = "application/json";
          return req;
        }}
      />
    </div>
  );
}
