---
name: api-guide
description: AI:ON-U 에이전트 빌더 API 가이드. 채팅 전송, 파일 업로드, 대화 관리, 피드백, 앱 설정 조회, 데이터셋 관리 등 전체 API 엔드포인트 레퍼런스. API 관련 질문이나 API 페이지 개발 시 참조.
---

# API 가이드

## 공통 사항

### 인증 (Authentication)

모든 API 요청에는 `Authorization` 헤더에 Bearer 토큰이 필요합니다.

```
Authorization: Bearer {API_KEY}
```

### User-Agent

요청 시 사용자를 식별하기 위한 User-Agent 헤더를 포함할 수 있습니다.

```
User-Agent: {사용자 식별 값}
```

### API Base URL

각 앱마다 고유한 API Base URL 이 제공됩니다. 에이전트 빌더의 API 가이드 페이지에서 확인할 수 있습니다.

### 에이전트 모드별 지원 기능

| 기능 | chat | agent-chat | advanced-chat | multi-agent-chat | analytics-chat |
|------|------|------------|---------------|------------------|----------------|
| 채팅 전송 | O | O | O | O | O |
| 파일 업로드 (이미지) | O | O | O | O | X |
| 파일 업로드 (document) | X | O | O | X | X |
| 채팅 중단 | O | O | O | O | O |
| 대화 관리 | O | O | O | O | O |
| 피드백/추천질문 | O | O | O | O | O |
| 앱 설정/메타 조회 | O | O | O | O | O |
| 데이터셋 관리 | X | X | X | X | O |
| blocking 응답 모드 | X (미지원) | O | O | O | O |
| streaming 응답 모드 | O | O | O | O | O |
| agent_thought 이벤트 | X | X | O | O | X |
| workflow 이벤트 | X | X | O | X | X |

---

## 1. 채팅

### 1-1. 채팅 전송

채팅 메시지를 전송합니다.

- **Method**: `POST`
- **Endpoint**: `/chat-messages`

#### Request Body

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| query | string | 사용자의 질문 |
| inputs | object | 앱에서 사전 정의한 변수의 key-value 값. 없으면 `{}` |
| response_mode | string | `streaming`: 스트리밍 모드 (타이핑처럼 연속 응답) / `blocking`: 블럭킹 모드 (한번에 완성된 응답). **chat 모드에서는 blocking 을 지원하지 않습니다.** |
| user | string | 사용자 이름 (Unique 한 값) |
| conversation_id | string | 대화 아이디. 값을 넣으면 대화를 이어가고, 비우면 새로운 대화 생성 |
| files | array[object] | 이미지/파일 리스트 (vision 지원 모델 필요). **analytics-chat 모드에서는 사용 불가** |
| files[].type | string | 파일타입. `image` 만 가능. **agent-chat, advanced-chat 모드에서는 `document`(pdf, ppt, pptx) 도 가능** |
| files[].transfer_method | string | 전송방식. `remote_url` 또는 `local_file`. **document 일 경우 `local_file` 만 가능** |
| files[].url | string | `remote_url` 선택 시 URL |
| files[].upload_file_id | string | 파일 업로드 API 응답의 id 값 |
| data_list | array[string] | **analytics-chat 모드 전용**. 분석할 파일 리스트. `/analytics/datasets` API 로 확인 가능 (한개만 입력) |
| auto_generate_name | bool | 대화 제목 자동 생성 여부 (기본값: false) |

#### Request Example

```bash
curl -X POST '{API_BASE_URL}/chat-messages' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "inputs": {},
    "query": "KT 통화비서에 대해 알려줘",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "test1234",
    "files": [
        {
        "type": "image",
        "transfer_method": "remote_url",
        "url": "{API_BASE_URL}/logo/logo.png"
        }
    ]
}'
```

#### Streaming Response

응답 메시지는 청크 단위 스트리밍으로 리턴됩니다.
- `Content-Type`: `text/event-stream`
- 각 청크는 `data:` 로 시작, `\n\n` 으로 구분

##### 이벤트 타입

| 이벤트 | 설명 | 지원 모드 | 필드 |
|--------|------|-----------|------|
| `message` | LLM 생성 메시지 (대화형 앱) | 전체 | event, task_id, message_id, conversation_id, answer, created_at |
| `agent_message` | LLM 생성 메시지 (대화형 앱) | 전체 | event, task_id, message_id, conversation_id, answer, created_at |
| `agent_thought` | AI 재처리 메시지 (Tools 호출 시) | **advanced-chat, multi-agent-chat 만** | event, id, task_id, message_id, position, thought, observation, tool, tool_input, created_at, message_files, conversation_id |
| `message_file` | Tools 로 새 파일 생성 시 | 전체 | event, id, type, belongs_to, url, conversation_id |
| `workflow_started` | 커스텀 에이전트 워크플로우 시작 | **advanced-chat 만** | event, task_id, workflow_run_id, created_at |
| `node_started` | 워크플로우 노드 실행 시작 | **advanced-chat 만** | event, task_id, workflow_run_id, node_id, node_type, node_data, created_at |
| `node_finished` | 워크플로우 노드 실행 완료 | **advanced-chat 만** | event, task_id, workflow_run_id, node_id, node_type, node_data, outputs, status(succeeded/failed/stopped), created_at |
| `workflow_finished` | 커스텀 에이전트 워크플로우 완료 | **advanced-chat 만** | event, task_id, workflow_run_id, status(succeeded/failed/stopped), outputs, created_at |
| `message_end` | 메시지 수신 완전 종료 | 전체 | event, task_id, message_id, conversation_id, metadata(usage, retriever_resources) |
| `message_replace` | moderation API 필터링 교체 | 전체 | event, task_id, message_id, conversation_id, answer, created_at |
| `ping` | 연결 유지 | 전체 | - |
| `error` | 에러 | 전체 | event, task_id, message_id, status, code, message |

#### Response Example

```
data: {"event": "message", "message_id": "2ac3ab98-b2c6-4031-b334-81d423be3295", "conversation_id": "55231984-6128-5bd1-8d91-34566b4215f1", "answer": "안녕", "created_at": 1679586595}
data: {"event": "message", "message_id": "2ac3ab98-b2c6-4031-b334-81d423be3295", "conversation_id": "55231984-6128-5bd1-8d91-34566b4215f1", "answer": "하세요", "created_at": 1679586595}
data: {
    "event": "message_end",
    "id": "5e52ce04-874b-4d27-9045-b3bc80def685",
    "conversation_id": "55231984-6128-5bd1-8d91-34566b4215f1",
    "metadata": {
        "usage": {
            "prompt_tokens": 1033,
            "prompt_unit_price": "0.001",
            "prompt_price_unit": "0.001",
            "prompt_price": "0.0010330",
            "completion_tokens": 135,
            "completion_unit_price": "0.002",
            "completion_price_unit": "0.001",
            "completion_price": "0.0002700",
            "total_tokens": 1168,
            "total_price": "0.0013030",
            "currency": "USD",
            "latency": 1.381760165997548
        },
        "retriever_resources": [
            {
                "position": 1,
                "dataset_id": "231a5c94-dc21-353c-9121-5361adc2cbdb",
                "dataset_name": "iPhone",
                "document_id": "4ss1aa71-2c3d-4071-c236-5d12aadd1e10",
                "document_name": "iPhone List",
                "segment_id": "1d492c7a-1221-3413-d1ds-13216b21271a",
                "score": 0.98457545,
                "content": "\"상품\",\"상품출시일\",\"가격\",\"요금제\",\"약정기간\""
            }
        ]
    }
}
```

#### 에러 코드

| 코드 | 에러 | 설명 |
|------|------|------|
| 404 | Conversation does not exists | 대화가 존재하지 않음 |
| 400 | invalid_param | 비정상적인 파라미터 입력 |
| 400 | app_unavailable | 앱 설정을 사용할 수 없음 |
| 400 | provider_not_initialize | 사용 가능한 모델 자격 증명 구성 없음 |
| 400 | provider_quota_exceeded | 모델 호출 할당량 부족 |
| 400 | model_currently_not_support | 현재 모델을 사용할 수 없음 |
| 400 | completion_request_error | 텍스트 생성 실패 |
| 400 | file_too_large | 파일 크기가 최대 제한 초과 |
| 400 | unsupported_file_type | 지원되지 않는 파일 유형 |
| 413 | file_upload_failed | 파일 업로드 실패 |
| 500 | internal server error | 내부 서버 오류 |

---

### 1-2. 파일 업로드

채팅 메시지에서 이미지 입력을 위한 파일을 업로드합니다.

- **Method**: `POST`
- **Endpoint**: `/files/upload`

#### Request Body (multipart/form-data)

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| file | File | 업로드할 파일 (지원 형식: png, jpg, jpeg, webp, gif) |
| user | string | 사용자 이름 (Unique 한 값) |

#### Request Example

```bash
curl -X POST '{API_BASE_URL}/files/upload' \
--header 'Authorization: Bearer {API_KEY}' \
--form 'file=@"path/to/image.jpg"' \
--form 'user="test1234"'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 파일 아이디 |
| name | string | 파일 이름 |
| size | int | 파일 크기 (bytes) |
| extension | string | 파일 확장자 |
| mime_type | string | MIME 타입 |
| created_by | string | 파일 업로드한 사용자 |
| created_at | int | 생성일시 |

#### Response Example

```json
{
    "id": "b555c987-65c4-4306-96fc-caa4df20f32c",
    "name": "example.jpg",
    "size": 256875,
    "extension": "jpg",
    "mime_type": "image/jpeg",
    "created_by": "test1234",
    "created_at": 1705591320
}
```

#### 에러 코드

| 코드 | 에러 | 설명 |
|------|------|------|
| 400 | no_file_uploaded | a file must be provided |
| 400 | too_many_files | currently only one file is accepted |
| 400 | unsupported_preview | the file does not support preview |
| 400 | unsupported_estimate | the file does not support estimation |
| 400 | file_too_large | File size exceeds maximum limit |
| 400 | unsupported_file_type | File type not supported |
| 413 | file_upload_failed | File upload failed |
| 415 | unsupported_file_type | unsupported extension |
| 503 | s3_connection_failed | unable to connect to S3 service |
| 503 | s3_permission_denied | no permission to upload files to S3 |
| 503 | s3_file_too_large | file exceeds S3 size limit |
| 500 | internal server error | 내부 서버 오류 |

---

### 1-3. 채팅 중단

진행 중인 채팅 작업을 중지합니다.

- **Method**: `POST`
- **Endpoint**: `/chat-messages/{task_id}/stop`

#### Request Body

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| user | string | 사용자 이름 |

#### Request Example

```bash
curl -X POST '{API_BASE_URL}/chat-messages/{task_id}/stop' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "user": "test1234"
}'
```

> Response 는 현재 미제공 상태입니다.

---

## 2. 대화 관리

### 2-1. 대화 제목 변경

대화의 제목을 변경합니다.

- **Method**: `POST`
- **Endpoint**: `/conversations/{conversation_id}/name`

#### Request Body

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| name | string | 대화의 제목. `auto_generate` 가 true 면 생략 가능 |
| auto_generate | bool | 자동으로 대화 제목 생성 여부 (기본값: false) |

#### Request Example

```bash
curl -X POST '{API_BASE_URL}/conversations/{conversation_id}/name' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "AI 통화비서",
    "auto_generate": false
}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 대화 아이디 |
| name | string | 대화 이름 |
| inputs | array[object] | 사용자 입력 파라미터 |
| introduction | string | 소개 |
| created_at | int | 생성일시 (Timestamp) |

#### Response Example

```json
{
    "id": "1c7b048a-8a30-46ff-b62d-d40906341af9",
    "name": "AI 통화비서",
    "inputs": {},
    "introduction": "",
    "created_at": 1705569238
}
```

---

### 2-2. 대화 목록 조회

현재 사용자의 대화 리스트를 조회합니다. 기본적으로 가장 최근의 20 건을 조회합니다.

- **Method**: `GET`
- **Endpoint**: `/conversations`

#### Query Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| user | string | 개발자가 지정한 Unique 한 최종사용자 아이디 |
| last_id | string (optional) | 현재 페이지에서 조회한 마지막 레코드 (기본값: null) |
| limit | int (optional) | 조회할 최대 레코드 개수 (기본값: 20) |
| pinned | bool (optional) | 즐겨찾기 (pinned) 지정된 대화만 조회 |

#### Request Example

```bash
curl -X GET '{API_BASE_URL}/conversations?user=test1234&last_id=&limit=20' \
--header 'Authorization: Bearer {API_KEY}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| data | array[object] | 대화 목록 |
| data[].id | string | 대화 아이디 |
| data[].name | string | 대화 이름 (미지정 시 첫 질문으로 처리) |
| data[].inputs | array[object] | 사용자 입력값 |
| data[].introduction | string | 소개 |
| data[].created_at | int | 생성일자 (Timestamp) |
| has_more | bool | 더 조회할 데이터 여부 |
| limit | int | 한번에 조회할 레코드 개수 |

#### Response Example

```json
{
    "limit": 20,
    "has_more": false,
    "data": [
        {
            "id": "10799fb8-64f7-4296-bbf7-b42bfbe0ae54",
            "name": "New chat",
            "inputs": {
                "book": "book",
                "myName": "Lucy"
            },
            "status": "normal",
            "created_at": 1679667915
        }
    ]
}
```

---

### 2-3. 메세지 히스토리 조회

대화의 메시지 히스토리를 조회합니다.

- **Method**: `GET`
- **Endpoint**: `/messages`

#### Query Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| conversation_id | string | 대화 아이디 |
| user | string | 사용자 이름 |
| first_id | string (optional) | 페이지네이션을 위한 시작 메시지 ID |
| limit | int (optional) | 한 번에 가져올 메시지 수 (기본값: 20) |

#### Request Example

```bash
curl -X GET '{API_BASE_URL}/messages?conversation_id=45701982-8118-4bc5-8e9b-64562b4555f2&user=test1234&limit=10' \
--header 'Authorization: Bearer {API_KEY}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| data | array[object] | 메시지 리스트 |
| data[].id | string | 메시지 아이디 |
| data[].conversation_id | string | 대화 아이디 |
| data[].inputs | array[object] | 사용자 입력값 |
| data[].query | string | 질문 |
| data[].message_files | array[object] | 메시지 파일 정보 |
| data[].agent_thoughts | array[object] | AI 의 처리 프로세스 |
| data[].answer | string | 답변 |
| data[].created_at | int | 생성일시 (timestamp) |
| data[].feedback | object | 피드백 정보 |
| data[].retriever_resources | array[RetrieverResource] | 인용, 기여 리스트 |
| has_more | bool | 다음 페이지 여부 |
| limit | int | 한번에 조회되는 아이템 개수 |

#### Response Example

```json
{
    "limit": 20,
    "has_more": false,
    "data": [
        {
            "id": "0b136982-3e21-4ce3-a143-6f7a32af9e7a",
            "conversation_id": "3002ae74-a2f0-4efa-b7e2-c7a7cf5fdbe2",
            "inputs": {},
            "query": "드래곤을 그려줘",
            "answer": "드래곤을 그리겠습니다. 메시지를 확인해주세요.",
            "message_files": [
                {
                    "id": "4e291085-c3ed-4cbb-a47e-ace64f0521b7",
                    "type": "image",
                    "url": "http://example.com/image.png",
                    "belongs_to": "assistant"
                }
            ],
            "feedback": null,
            "retriever_resources": [],
            "created_at": 1705988187,
            "agent_thoughts": [
                {
                    "id": "bcbb4342-7725-48bb-a325-7040e799878b",
                    "message_id": "9a3f9f02-fa20-47f5-b83b-dc1a39b2abba",
                    "position": 1,
                    "thought": "",
                    "tool": "dalle2",
                    "tool_input": "{\"dalle2\": {\"prompt\": \"cat\"}}",
                    "created_at": 1705988186,
                    "observation": "이미지가 만들어졌습니다.",
                    "message_files": ["adb6e07d-f762-4f04-b51c-95798106287d"]
                }
            ]
        }
    ]
}
```

---

### 2-4. 대화 삭제

대화를 삭제합니다.

- **Method**: `DELETE`
- **Endpoint**: `/conversations/{conversation_id}`

#### Request Body

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| user | string | 사용자 이름 |

#### Request Example

```bash
curl -X DELETE '{API_BASE_URL}/conversations/{conversation_id}' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "user": "test1234"
}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| result | string | 삭제 결과 (`success`) |

#### Response Example

```json
{
    "result": "success"
}
```

---

## 3. 대화 부가 기능

### 3-1. 메세지 피드백

메시지에 대한 피드백 (좋아요/싫어요) 을 제공합니다.

- **Method**: `POST`
- **Endpoint**: `/messages/{message_id}/feedbacks`

#### Request Body

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| rating | string | 피드백 값 (`"like"`, `"dislike"`, `null`) |
| user | string | 사용자 이름 |

#### Request Example

```bash
curl -X POST '{API_BASE_URL}/messages/{message_id}/feedbacks' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "rating": "like",
    "user": "test1234"
}'
```

> Response 는 현재 미제공 상태입니다.

---

### 3-2. 추천 질문 조회

메시지를 기반으로 추천 질문을 조회합니다.

- **Method**: `GET`
- **Endpoint**: `/messages/{message_id}/suggested`

#### Query Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| user | string | 사용자 이름 |

#### Request Example

```bash
curl -X GET '{API_BASE_URL}/messages/{message_id}/suggested?user=test1234' \
--header 'Authorization: Bearer {API_KEY}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| result | string | 성공여부 (`success` 만 반환) |
| data | array[string] | 추천 질문 리스트 |

#### Response Example

```json
{
    "result": "success",
    "data": [
        "추천 질문 1",
        "추천 질문 2",
        "추천 질문 3"
    ]
}
```

---

## 4. 앱 정보

### 4-1. 앱 설정 조회

앱의 설정 정보 (시작 문구, 제안 질문, 사용자 입력 양식 등) 를 조회합니다.

- **Method**: `GET`
- **Endpoint**: `/parameters`

#### Query Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| user | string | 사용자 이름 |

#### Request Example

```bash
curl -X GET '{API_BASE_URL}/parameters?user=test1234' \
--header 'Authorization: Bearer {API_KEY}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| opening_statement | string | 앱 시작 시 표시되는 문구 |
| suggested_questions | array[string] | 제안 질문 목록 |
| user_input_form | array | 사용자 입력 양식 설정 |
| file_upload | object | 파일 업로드 설정 |

#### Response Example

```json
{
    "opening_statement": "안녕하세요! 무엇을 도와드릴까요?",
    "suggested_questions": [
        "서비스에 대해 알려주세요",
        "가격 정보를 알고 싶습니다"
    ],
    "user_input_form": [],
    "file_upload": {
        "image": {
            "enabled": true,
            "number_limits": 3,
            "detail": "high",
            "transfer_methods": ["remote_url", "local_file"]
        }
    }
}
```

---

### 4-2. 앱 메타데이터 조회

앱의 메타데이터 (도구 아이콘, 이모지 등) 를 조회합니다.

- **Method**: `GET`
- **Endpoint**: `/meta`

#### Query Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| user | string | 사용자 이름 |

#### Request Example

```bash
curl -X GET '{API_BASE_URL}/meta?user=test1234' \
--header 'Authorization: Bearer {API_KEY}'
```

> Response 는 현재 미제공 상태입니다.

---

## 실제 API 호출 In/Out 포맷 상세

> 아래 내용은 `https://api.abclab.ktds.com/v1` 엔드포인트를 실제 호출하여 확인한 포맷입니다.

### blocking 모드 미지원 에러 (agent-chat 앱)

`agent-chat` 타입 앱에서 `response_mode: "blocking"` 으로 요청하면 400 에러가 반환됩니다.

```json
{
    "code": "invalid_param",
    "message": "Agent Chat App does not support blocking mode",
    "status": 400
}
```

> **주의**: 에이전트 모드별 지원 기능 표에서 `agent-chat` 의 blocking 모드가 "O" 로 표시되어 있으나, 실제 앱 설정에 따라 지원되지 않을 수 있습니다. **agent-chat 앱은 항상 `streaming` 모드를 사용**하세요.

---

### streaming 응답 이벤트 흐름 (실제 호출 기준)

#### 예시 1 — 단순 검색 쿼리

**Request**
```bash
curl -X POST 'https://api.abclab.ktds.com/v1/chat-messages' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "inputs": {},
    "query": "abclab 에 대해 관련 정보가 있는지 검색해줘",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "api-guide-tester",
    "auto_generate_name": false
}'
```

**Response Stream (이벤트 순서)**

```
// ① agent_thought — 처리 시작 알림 (tool 필드 비어있음)
data: {
  "event": "agent_thought",
  "conversation_id": "84da75a5-fdac-4139-99b8-7544acfd083f",
  "message_id": "2c0ee0ee-3f10-49f7-945c-147404a562de",
  "created_at": 1776284171,
  "task_id": "b436e194-d7c1-49c2-b263-12c05185831f",
  "id": "51efdd4e-824c-478d-9642-1783e4db0820",
  "position": 1,
  "thought": "",
  "observation": "",
  "tool": "",
  "tool_labels": {},
  "tool_input": "",
  "tool_meta": {},
  "message_files": []
}

// ② agent_message — 빈 청크 (응답 스트림 시작 알림)
data: {
  "event": "agent_message",
  "conversation_id": "84da75a5-fdac-4139-99b8-7544acfd083f",
  "message_id": "2c0ee0ee-3f10-49f7-945c-147404a562de",
  "created_at": 1776284171,
  "task_id": "b436e194-d7c1-49c2-b263-12c05185831f",
  "id": "2c0ee0ee-3f10-49f7-945c-147404a562de",
  "answer": ""
}

// ③ agent_thought — tool 선택 단계 (tool_input 에 검색 쿼리 포함)
data: {
  "event": "agent_thought",
  "conversation_id": "84da75a5-fdac-4139-99b8-7544acfd083f",
  "message_id": "2c0ee0ee-3f10-49f7-945c-147404a562de",
  "created_at": 1776284171,
  "task_id": "b436e194-d7c1-49c2-b263-12c05185831f",
  "id": "51efdd4e-824c-478d-9642-1783e4db0820",
  "position": 1,
  "thought": "",
  "observation": "",
  "tool": "tavily-search",
  "tool_labels": {
    "tavily-search": {
      "en_US": "tavily-search",
      "ko_KR": "tavily-search"
    }
  },
  "tool_input": "{\"tavily-search\": {\"query\": \"ABC Lab 서비스 가이드\", \"time_range\": \"year\"}}",
  "tool_meta": {},
  "message_files": []
}

// ④ ping — 연결 유지 (tool 실행 중 주기적으로 수신)
event: ping

// ⑤ agent_thought — tool 실행 완료 (observation 에 결과 포함, tool_meta 에 실행 메타 포함)
data: {
  "event": "agent_thought",
  "conversation_id": "84da75a5-fdac-4139-99b8-7544acfd083f",
  "message_id": "2c0ee0ee-3f10-49f7-945c-147404a562de",
  "created_at": 1776284171,
  "task_id": "b436e194-d7c1-49c2-b263-12c05185831f",
  "id": "51efdd4e-824c-478d-9642-1783e4db0820",
  "position": 1,
  "thought": "",
  "observation": "{\"tavily-search\": \"Detailed Results:\\n\\nTitle: ABC Lab eReports\\nURL: https://play.google.com/...\\nContent: ...\"}",
  "tool": "tavily-search",
  "tool_labels": {
    "tavily-search": {"en_US": "tavily-search", "ko_KR": "tavily-search"}
  },
  "tool_input": "{\"tavily-search\": {\"query\": \"ABC Lab 서비스 가이드\", \"time_range\": \"year\"}}",
  "tool_meta": {
    "tavily-search": {
      "time_cost": 5.14305,
      "error": null,
      "tool_config": {
        "tool_name": "tavily-search",
        "tool_provider": "Tavily MCP Server",
        "tool_provider_type": "mcp",
        "tool_parameters": {
          "search_depth": "basic",
          "topic": "general",
          "days": 3,
          "max_results": 10,
          "include_images": false,
          "include_image_descriptions": false,
          "include_raw_content": false,
          "include_domains": "[]",
          "exclude_domains": "[]",
          "country": "",
          "include_favicon": false
        },
        "tool_icon": "https://sacra.cdn.prismic.io/sacra/ZteA7Lzzk9ZrW8Z__tavilylogo.svg"
      }
    }
  },
  "message_files": []
}

// ⑥ agent_message — 실제 답변 청크 (글자 단위로 스트리밍)
data: {"event": "agent_message", ..., "answer": "검색"}
data: {"event": "agent_message", ..., "answer": "해본"}
data: {"event": "agent_message", ..., "answer": " 결과"}
// ... (answer 청크가 연속으로 수신됨)
```

---

#### 예시 2 — 검색 + 이메일 전송 (multi-tool 시나리오)

**Request**
```bash
curl -X POST 'https://api.abclab.ktds.com/v1/chat-messages' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "inputs": {},
    "query": "AI:ON-U 에 대한 정보가 있는지 검색한다음, corona.kim@kt.com 으로 보내줘.",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "api-guide-tester",
    "auto_generate_name": false
}'
```

**Response Stream (이벤트 순서)**

```
// ① agent_thought — position 1: tavily-search 실행
data: {
  "event": "agent_thought",
  "position": 1,
  "tool": "tavily-search",
  "tool_input": "{\"tavily-search\": {\"query\": \"ABC Lab AI:ON-U user guide\", \"time_range\": \"year\"}}",
  "observation": "{\"tavily-search\": \"Detailed Results: ...검색 결과...\"}",
  "tool_meta": {
    "tavily-search": {
      "time_cost": 4.97634,
      "error": null,
      "tool_config": {
        "tool_name": "tavily-search",
        "tool_provider": "Tavily MCP Server",
        "tool_provider_type": "mcp",
        ...
      }
    }
  }
}

// ② agent_thought — position 2: send_mail 실행
data: {
  "event": "agent_thought",
  "position": 2,
  "tool": "send_mail",
  "tool_input": "{\"send_mail\": {\"send_to\": \"corona.kim@kt.com\", \"subject\": \"AI:ON-U 정보 검색 결과\", \"email_content\": \"안녕하세요.\\n\\nAI:ON-U 관련 검색 결과를 전달드립니다...\"}}",
  "observation": "{\"send_mail\": \"send email success\"}",
  "tool_meta": {
    "send_mail": {
      "time_cost": 2.171594,
      "error": null,
      "tool_config": {
        "tool_name": "send_mail",
        "tool_provider": "email",
        "tool_provider_type": "builtin",
        "tool_parameters": {},
        "tool_icon": "icon.svg"
      }
    }
  }
}

// ③ agent_message — 최종 답변 청크 스트리밍
data: {"event": "agent_message", ..., "answer": "AI:ON-U 관련 정보를 검색해 보았으나"}
data: {"event": "agent_message", ..., "answer": "..."}
// ...

// ④ message_end — 수신 완료 + 사용량 정보
data: {
  "event": "message_end",
  "conversation_id": "00e9d2fb-27d1-4a02-9276-a0e3d6b2c878",
  "message_id": "cec8e74d-98f7-4146-bc9a-5027e242f3ca",
  "created_at": 1776284204,
  "task_id": "a20e822f-c338-4ae9-89d2-59297f9e1a27",
  "id": "cec8e74d-98f7-4146-bc9a-5027e242f3ca",
  "metadata": {
    "usage": {
      "prompt_tokens": 10552,
      "prompt_unit_price": "0.75",
      "prompt_price_unit": "0.000001",
      "prompt_price": "0.0079141",
      "completion_tokens": 334,
      "completion_unit_price": "4.5",
      "completion_price_unit": "0.000001",
      "completion_price": "0.0015030",
      "total_tokens": 10886,
      "total_price": "0.0094171",
      "aion_total_price": "0.0011123",
      "currency": "USD",
      "latency": 2.3704151380225085
    }
  }
}
```

---

### 이벤트 필드 상세 (실제 확인 기준)

#### agent_thought 이벤트 전체 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| event | string | `"agent_thought"` |
| conversation_id | string | 대화 아이디 |
| message_id | string | 메시지 아이디 |
| created_at | int | 생성 timestamp |
| task_id | string | 태스크 아이디 (채팅 중단 시 사용) |
| id | string | agent_thought 고유 아이디 |
| position | int | tool 호출 순서 (1 부터 시작, 동일 position 에서 시작→결과 2 번 수신) |
| thought | string | AI 의 내부 추론 텍스트 (현재는 대부분 빈 문자열) |
| tool | string | 호출된 tool 이름. 빈 문자열이면 처리 시작/종료 단계 |
| tool_labels | object | tool 의 다국어 표시명 `{"tool 명": {"en_US": "...", "ko_KR": "..."}}` |
| tool_input | string | tool 에 전달된 JSON 파라미터 (문자열로 직렬화됨) |
| observation | string | tool 실행 결과 (문자열로 직렬화된 JSON) |
| tool_meta | object | tool 실행 메타 정보 (아래 상세 참조) |
| message_files | array | tool 이 생성한 파일 목록 |

#### tool_meta 필드 상세

| 필드 | 타입 | 설명 |
|------|------|------|
| `{tool_name}`.time_cost | float | tool 실행 소요 시간 (초) |
| `{tool_name}`.error | string\|null | 에러 메시지. `null` 이면 정상 실행 |
| `{tool_name}`.tool_config.tool_name | string | tool 이름 |
| `{tool_name}`.tool_config.tool_provider | string | tool 제공자 (예: `"Tavily MCP Server"`, `"email"`) |
| `{tool_name}`.tool_config.tool_provider_type | string | 제공자 타입 (`"mcp"`, `"builtin"`, `"api"`) |
| `{tool_name}`.tool_config.tool_parameters | object | tool 별 기본 파라미터 설정 |
| `{tool_name}`.tool_config.tool_icon | string | tool 아이콘 URL |

#### message_end 이벤트 전체 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| event | string | `"message_end"` |
| conversation_id | string | 대화 아이디 |
| message_id | string | 메시지 아이디 |
| created_at | int | 생성 timestamp |
| task_id | string | 태스크 아이디 |
| id | string | 메시지 아이디 (message_id 와 동일) |
| metadata.usage.prompt_tokens | int | 입력 토큰 수 |
| metadata.usage.prompt_unit_price | string | 입력 토큰 단가 |
| metadata.usage.prompt_price_unit | string | 단가 기준 단위 (예: `"0.000001"` = 1M 토큰당) |
| metadata.usage.prompt_price | string | 입력 토큰 요금 합계 |
| metadata.usage.completion_tokens | int | 출력 토큰 수 |
| metadata.usage.completion_unit_price | string | 출력 토큰 단가 |
| metadata.usage.completion_price_unit | string | 단가 기준 단위 |
| metadata.usage.completion_price | string | 출력 토큰 요금 합계 |
| metadata.usage.total_tokens | int | 전체 토큰 수 |
| metadata.usage.total_price | string | 전체 요금 합계 (USD 원가 기준) |
| metadata.usage.aion_total_price | string | **AI:ON-U 청구 요금** (자체 단가 적용, 기존 문서에 미기재) |
| metadata.usage.currency | string | 통화 단위 (`"USD"`) |
| metadata.usage.latency | float | 응답 지연 시간 (초) |
| metadata.retriever_resources | array | RAG 검색 시 참조 문서 목록 (없으면 미포함) |

---

### agent_thought 이벤트 흐름 패턴

동일한 `position` 값에서 `agent_thought` 는 최소 2 회 수신됩니다.

```
[처리 시작]  agent_thought (position=N, tool="",     tool_input="", observation="")
[tool 선택]  agent_thought (position=N, tool="이름",  tool_input="...", observation="")
[ping...]    event: ping  (tool 실행 중 유지)
[결과 수신]  agent_thought (position=N, tool="이름",  tool_input="...", observation="결과", tool_meta={time_cost, ...})
```

tool 을 여러 개 순차 호출하면 `position` 이 1, 2, 3... 순서로 증가합니다.

---

### 주요 내장 Tool 목록 (실제 확인)

| tool 이름 | tool_provider_type | 설명 | observation 예시 |
|-----------|-------------------|------|-----------------|
| `tavily-search` | `mcp` | 웹 검색 (Tavily MCP Server) | `{"tavily-search": "Detailed Results:\n\nTitle: ...\nURL: ..."}` |
| `send_mail` | `builtin` | 이메일 전송 | `{"send_mail": "send email success"}` |

---

## 5. 데이터셋 관리 (analytics-chat 모드 전용)

### 5-1. 데이터셋 업로드

분석을 위한 CSV, XLSX 파일을 업로드합니다.

- **Method**: `POST`
- **Endpoint**: `/analytics/datasets/upload`

#### Request Body (multipart/form-data)

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| file | File | 업로드할 데이터 파일 (지원 형식: csv, xlsx) |
| user | string | 사용자 이름 |

#### Request Example

```bash
curl -X POST '{API_BASE_URL}/analytics/datasets/upload' \
--header 'Authorization: Bearer {API_KEY}' \
--form 'file=@"data.csv"' \
--form 'user="test1234"'
```

---

### 5-2. 데이터셋 목록 조회

업로드된 데이터셋 파일 목록을 조회합니다.

- **Method**: `GET`
- **Endpoint**: `/analytics/datasets`

#### Query Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| user | string | 사용자 이름 |

#### Request Example

```bash
curl -X GET '{API_BASE_URL}/analytics/datasets?user=test1234' \
--header 'Authorization: Bearer {API_KEY}'
```

---

## 6. HITL 노드 사용

HITL(Human-In-The-Loop) 노드는 워크플로우 실행 중 사람의 개입 (검토·승인·재생성) 이 필요한 지점을 정의하는 노드입니다. `/chat-messages` 엔드포인트를 통해 HITL 노드가 포함된 에이전트를 호출하고, 중간 검토 단계에서 `node_paused` 이벤트를 처리하여 최종 응답 (`message_end`) 까지 받습니다.

### 전체 흐름

1. 에이전트 호출 (`/chat-messages` — 최초 요청)
2. `node_paused` 이벤트 수신 (검토 대상 데이터 확인)
3. 검토 결과 전달 (`/chat-messages` — `conversation_id` 포함 재요청)
4. `message_end` 이벤트 수신 (최종 결과 확인)

---

### 6-1. 에이전트 호출 (STEP 1 — INPUT)

HITL 노드가 포함된 에이전트를 호출합니다. 최초 호출 시 `conversation_id` 는 빈 문자열로 전달합니다.

- **Method**: `POST`
- **Endpoint**: `/chat-messages`
- **Response Mode**: `streaming` (HITL 흐름은 스트리밍 이벤트 기반)

#### Request Body

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| query | string | 사용자 질문 |
| inputs | object | 앱에서 사전 정의한 변수의 key-value 값. 없으면 `{}` |
| response_mode | string | `streaming` 사용 |
| conversation_id | string | 최초 호출 시 빈 문자열 `""` |
| user | string | 사용자 식별자 (Unique 값) |

#### Request Example

```json
{
  "inputs": {},
  "query": "리눅스 개발한 사람은?",
  "response_mode": "streaming",
  "conversation_id": "",
  "user": "test999"
}
```

---

### 6-2. `node_paused` 이벤트 수신 (STEP 2 — OUTPUT)

워크플로우 실행 중 HITL 노드에 도달하면 `node_paused` 이벤트가 발생하며 워크플로우가 일시 중단됩니다. 이 이벤트에는 사용자가 검토해야 할 데이터 (`review_data`) 와 이후 재호출에 필요한 `conversation_id` 가 포함됩니다.

#### Response Example

```json
{
    "event": "node_paused",
    "conversation_id": "7c476b43-6fe7-4b7e-a4ab-32a2d6c0cb16",
    "message_id": "cb1e72bc-7ead-4f9b-a869-7dfc7753dbf1",
    "created_at": 1776375223,
    "task_id": "01eb4177-729b-4640-812a-6461752644fd",
    "workflow_run_id": "01eb4177-729b-4640-812a-6461752644fd",
    "data": {
        "node_id": "1776334527638",
        "node_execution_id": "7dbbcefa-ea71-4845-9aef-20ff8f90cc1c",
        "title": "맞는 답변을 했는지 확인해주세요",
        "description": "LLM 이 답변한 답이 맞는지 확인합니다",
        "review_data": "리눅스를 만든 사람은 **리누스 토르발스 (Linus Torvalds)** 입니다.  \n1991 년에 리눅스 커널을 처음 만들었어요.\n\n원하시면 **리눅스와 유닉스의 차이**도 간단히 설명해드릴게요.",
        "max_regenerations": 3,
        "regeneration_count": 0,
        "review_variable_selector": [
            "llm",
            "text"
        ],
        "remaining_paused_count": 0
    }
}
```

#### 주요 필드

| 필드 | 설명 |
|------|------|
| `conversation_id` | 다음 요청 (검토 결과 전달) 에 **반드시 포함**해야 하는 대화 ID |
| `data.title` | HITL 노드에 설정된 검토 요청 제목 |
| `data.description` | 검토 요청 설명 |
| `data.review_data` | 검토 대상 데이터 (예: LLM 이 생성한 답변 본문) |
| `data.max_regenerations` | 최대 재생성 (regenerate) 가능 횟수 |
| `data.regeneration_count` | 현재까지 재생성된 횟수 |
| `data.review_variable_selector` | 검토 대상이 되는 변수의 노드 경로 |
| `data.remaining_paused_count` | 남아있는 일시중지 횟수 |

---

### 6-3. 검토 결과 전달 (STEP 3 — INPUT)

`review_data` 를 확인한 후, 검토 결과 (승인 / 반려 / 재생성) 를 다시 `/chat-messages` 로 전달합니다. 이때 **6-2 단계에서 받은 `conversation_id` 를 반드시 포함**해야 워크플로우가 이어집니다.

#### Request Body

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| query | string | 검토 결과 선택지 (`approve` / `reject` / `regenerate` 중 하나) |
| inputs | object | `review_data` 등 다음 노드로 전달할 추가 정보 |
| inputs.review_data | string | 검토 결과 메모 (다음 노드에서 참고할 데이터) |
| response_mode | string | `streaming` |
| conversation_id | string | 6-2 단계 응답에서 받은 값 |
| user | string | 6-1 단계와 동일한 사용자 식별자 |

#### query 선택지

| 값 | 의미 |
|----|------|
| `approve` | 검토 결과 승인 — 다음 노드로 진행 |
| `reject` | 검토 결과 반려 — 워크플로우 종료 또는 분기 처리 |
| `regenerate` | 재생성 요청 — LLM 답변을 다시 생성 (최대 `max_regenerations` 횟수까지) |

#### Request Example

```json
{
  "inputs": {
    "review_data": "잘 작동합니다"
  },
  "query": "approve",
  "response_mode": "streaming",
  "conversation_id": "7c476b43-6fe7-4b7e-a4ab-32a2d6c0cb16",
  "user": "test999"
}
```

---

### 6-4. `message_end` 이벤트 수신 (STEP 4 — OUTPUT)

검토 결과 전달 후 다음 노드가 정상적으로 작동되며, 최종적으로 `message_end` 이벤트에서 전체 실행 결과 (토큰 사용량, 비용, 노드별 응답 등) 를 확인할 수 있습니다.

#### Response Example

```json
{
    "event": "message_end",
    "conversation_id": "7c476b43-6fe7-4b7e-a4ab-32a2d6c0cb16",
    "message_id": "cb1e72bc-7ead-4f9b-a869-7dfc7753dbf1",
    "created_at": 1776375223,
    "task_id": "ae98f565-cbd9-4974-b13e-9aa05257f75b",
    "id": "cb1e72bc-7ead-4f9b-a869-7dfc7753dbf1",
    "metadata": {
        "usage": {
            "prompt_tokens": 21,
            "prompt_unit_price": "0.75",
            "prompt_price_unit": "0.000001",
            "prompt_price": "0.0000158",
            "completion_tokens": 70,
            "completion_unit_price": "4.5",
            "completion_price_unit": "0.000001",
            "completion_price": "0.0003150",
            "total_tokens": 91,
            "total_price": "0.0003308",
            "aion_total_price": "0.0003308",
            "currency": "USD",
            "latency": 3.041951066988986
        },
        "node_answers": {
            "answer": "리눅스를 만든 사람은 **리누스 토르발스 (Linus Torvalds)** 입니다.  \n1991 년에 리눅스 커널을 처음 만들었어요.\n\n원하시면 **리눅스와 유닉스의 차이**도 간단히 설명해드릴게요."
        },
        "answer_node_order": [
            "answer",
            "1776334541996"
        ]
    }
}
```

#### 주요 필드

| 필드 | 설명 |
|------|------|
| `metadata.usage` | 토큰 사용량 및 과금 정보 |
| `metadata.node_answers` | 노드별 최종 응답 (key: 노드명 또는 ID) |
| `metadata.answer_node_order` | 응답이 생성된 노드의 실행 순서 |

---

### 6-5. 핵심 체크포인트

- 최초 호출 시 `conversation_id` 는 빈 문자열 (`""`) 로 전달합니다.
- 검토 결과 전달 시 6-2 단계에서 받은 `conversation_id` 를 **반드시** 포함해야 합니다.
- `query` 값은 `approve` / `reject` / `regenerate` 중 하나여야 합니다.
- `inputs.review_data` 에는 다음 노드에서 참고할 검토 메모를 넣을 수 있습니다.
- `regenerate` 는 `max_regenerations` 횟수를 초과할 수 없습니다.
- HITL 흐름은 반드시 `response_mode: streaming` 으로 호출해야 합니다.
