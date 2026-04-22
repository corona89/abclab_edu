---
name: knowledge-api-guide
description: AI:ON-U Knowledge(지식) API 가이드. 지식 CRUD, 문서 생성/교체/삭제, 청크 관리, 임베딩 상태 체크 등 Knowledge 관련 전체 API 엔드포인트 레퍼런스. Knowledge API 관련 질문이나 페이지 개발 시 참조.
---

# Knowledge API 가이드

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

Knowledge API의 Base URL은 시스템에서 제공됩니다. Knowledge API 페이지에서 확인할 수 있습니다.

---

## 1. 지식 관리

### 1-1. 지식 생성

지식을 생성합니다.

- **Method**: `POST`
- **Endpoint**: `/datasets`

#### Request Body

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| name | string | 지식 이름 |
| description | string | 지식 설명 |
| permission | string | 접근권한 |
| retrieval_model | object | 조회 설정 |
| retrieval_model.search_method | string | 검색 설정 |
| retrieval_model.reranking_enable | bool | 리랭크 모델 사용 여부 |
| retrieval_model.reranking_model | object | 리랭크 모델 |
| retrieval_model.reranking_model.reranking_provider_name | string | 리랭크 모델 공급자 명 |
| retrieval_model.reranking_model.reranking_model_name | string | 리랭크 모델 명 |
| retrieval_model.top_k | int | 청크 필터링 토큰 사이즈 설정 |
| retrieval_model.score_threshold_enabled | bool | 청크 필터링 임계값 사용 여부 |
| retrieval_model.score_threshold | float | 청크 필터링 임계값 |

#### Request Example

```bash
curl --location --request POST '{API_BASE_URL}/datasets' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "name": "신규 지식 생성",
  "description": "신규 지식 API 생성 테스트",
  "permission": "all_team_members",
  "retrieval_model": {
    "search_method": "hybrid_search",
    "reranking_enable": true,
    "reranking_model": {
      "reranking_provider_name": "aion",
      "reranking_model_name": "AI:ON-U Rerank"
    },
    "top_k": 15,
    "score_threshold_enabled": true,
    "score_threshold": 0.7
  }
}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 지식 아이디 |
| name | string | 지식 이름 |
| description | string | 지식 설명 |
| provider | string | 공급자 |
| permission | string | 접근권한 |
| data_source_type | string | 데이터 소스 유형 |
| indexing_technique | string | 인덱싱 방식 |
| app_count | int | 참조한 앱 개수 |
| document_count | int | 참조한 문서 개수 |
| word_count | int | 단어수 |
| created_by | string | 생성자 |
| created_at | timestamp | 생성시간 |
| updated_by | string | 수정자 |
| updated_at | timestamp | 수정시간 |
| embedding_model | string | 임베딩 모델 |
| embedding_model_provider | string | 임베딩 모델 공급자 |
| embedding_available | bool | 임베딩 가능 여부 |
| retrieval_model_dict | object | 조회 설정 (search_method, reranking_enable, reranking_model, top_k, score_threshold_enabled, score_threshold, keyword_extraction_method) |

#### Response Example

```json
{
    "id": "a5431b8e-f438-418a-9935-e39b63a791c3",
    "name": "신규 지식 생성",
    "description": "신규 지식 API 생성 테스트",
    "provider": "vendor",
    "permission": "all_team_members",
    "data_source_type": null,
    "indexing_technique": null,
    "app_count": 0,
    "document_count": 0,
    "word_count": 0,
    "created_by": "7e9f48c0-09c4-496c-bbe7-6b73b537e15f",
    "created_at": 1764794081,
    "updated_by": "7e9f48c0-09c4-496c-bbe7-6b73b537e15f",
    "updated_at": 1764794081,
    "embedding_model": null,
    "embedding_model_provider": null,
    "embedding_available": null,
    "retrieval_model_dict": {
        "search_method": "hybrid_search",
        "reranking_enable": true,
        "reranking_model": {
            "reranking_provider_name": "aion",
            "reranking_model_name": "AI:ON-U Rerank"
        },
        "top_k": 15,
        "score_threshold_enabled": true,
        "score_threshold": 0.7,
        "keyword_extraction_method": null
    }
}
```

---

### 1-2. 지식 리스트 조회

지식 리스트를 가져옵니다.

- **Method**: `GET`
- **Endpoint**: `/datasets`

#### Query Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| page | string | 페이지 번호 |
| limit | string | 한 페이지당 조회 |
| dataset_name | string | 데이터셋 이름(선택값)|

#### Request Example

```bash
curl --location --request GET '{API_BASE_URL}/datasets?page=1&limit=20' \
--header 'Authorization: Bearer {API_KEY}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| data | array[object] | 지식 목록 (각 항목은 지식 생성 Response와 동일한 필드) |
| has_more | bool | 더 있는지 여부 |
| limit | int | 페이지당 조회 개수 |
| total | int | 총 개수 |
| page | int | 페이지 번호 |

#### Response Example

```json
{
  "data": [
    {
      "id": "",
      "name": "name",
      "description": "desc",
      "permission": "only_me",
      "data_source_type": "upload_file",
      "indexing_technique": "",
      "app_count": 1,
      "document_count": 1,
      "word_count": 326,
      "created_by": "",
      "created_at": "",
      "updated_by": "",
      "updated_at": "",
      "embedding_model": "",
      "embedding_model_provider": "",
      "embedding_available": true,
      "retrieval_model_dict": {
          "search_method": "hybrid_search",
          "reranking_enable": true,
          "reranking_model": {
              "reranking_provider_name": "",
              "reranking_model_name": ""
          },
          "top_k": 15,
          "score_threshold_enabled": true,
          "score_threshold": 0.7,
          "keyword_extraction_method": ""
      }
    }
  ],
  "has_more": true,
  "limit": 20,
  "total": 60,
  "page": 1
}
```

---

### 1-3. 지식 정보 조회

지식 정보를 조회합니다.

- **Method**: `POST`
- **Endpoint**: `/datasets/retrieve`

#### Request Body

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| dataset_id | string | 지식 아이디 |
| query | string | 검색어 |
| retrieval_model | object (optional) | 조회 설정 (미입력시 지식 설정 사용) |
| retrieval_model.search_method | string | 검색 설정 |
| retrieval_model.reranking_enable | bool | 리랭크 모델 사용 여부 |
| retrieval_model.reranking_model | object | 리랭크 모델 |
| retrieval_model.top_k | int | 청크 필터링 토큰 사이즈 설정 |
| retrieval_model.score_threshold_enabled | bool | 청크 필터링 임계값 사용 여부 |
| retrieval_model.score_threshold | float | 청크 필터링 임계값 |

#### Request Example

```bash
curl --location --request POST '{API_BASE_URL}/datasets/retrieve' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "dataset_id": "{dataset_id}",
    "query": "검색어",
    "retrieval_model": {
        "search_method": "hybrid_search",
        "reranking_enable": true,
        "reranking_model": {
            "reranking_provider_name": "aion",
            "reranking_model_name": "AI:ON-U Rerank"
        },
        "top_k": 15,
        "score_threshold_enabled": true,
        "score_threshold": 0.7
    }
}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| query | object | 검색 쿼리 정보 |
| query.content | string | 검색어 |
| query.tsne_position | object | t-SNE 좌표 (x, y) |
| records | array[object] | 검색 결과 리스트 |
| records[].segment | object | 세그먼트 정보 (id, position, document_id, content, answer, word_count, tokens, keywords, index_node_id, index_node_hash, hit_count, enabled, status, created_by, created_at, indexing_at, completed_at, error, stopped_at, document) |
| records[].segment.document | object | 문서 정보 (id, data_source_type, name, doc_type) |
| records[].score | float | 유사도 점수 |
| records[].tsne_position | object | t-SNE 좌표 (x, y) |

#### Response Example

```json
{
    "query": {
        "content": "오늘 뭐먹지",
        "tsne_position": { "x": 99.75, "y": 267.86 }
    },
    "records": [
        {
            "segment": {
                "id": "d2eab418-4489-41f2-9fd5-7343e68a5cad",
                "position": 1,
                "document_id": "b99ed6a7-6063-4f1a-a7dc-91041170df10",
                "content": "오늘 날씨가 너무 좋아서 근처 공원으로 산책을 다녀왔습니다.",
                "answer": null,
                "word_count": 43,
                "tokens": 50,
                "keywords": ["일상", "산책"],
                "hit_count": 23,
                "enabled": true,
                "status": "completed",
                "created_at": 1768776516,
                "document": {
                    "id": "b99ed6a7-6063-4f1a-a7dc-91041170df10",
                    "data_source_type": "upload_file",
                    "name": "filename.txt",
                    "doc_type": null
                }
            },
            "score": 0.8013,
            "tsne_position": { "x": 206.47, "y": 109.16 }
        }
    ]
}
```

---

### 1-4. 지식 조회 설정 업데이트

지식의 조회 설정을 업데이트 합니다.

- **Method**: `PATCH`
- **Endpoint**: `/datasets/{dataset_id}/retrieval-model`

#### Request

**Path Parameter**: `dataset_id` (string) — 지식 아이디 (지식 페이지 URL에서 확인 가능)

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| retrieval_model | object | 조회 설정 |
| retrieval_model.search_method | string | 검색 설정 |
| retrieval_model.reranking_enable | bool | 리랭크 모델 사용 여부 |
| retrieval_model.reranking_model | object | 리랭크 모델 |
| retrieval_model.top_k | int | 청크 필터링 토큰 사이즈 설정 |
| retrieval_model.score_threshold_enabled | bool | 청크 필터링 임계값 사용 여부 |
| retrieval_model.score_threshold | float | 청크 필터링 임계값 |

#### Request Example

```bash
curl --location --request PATCH '{API_BASE_URL}/datasets/{dataset_id}/retrieval-model' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "retrieval_model": {
    "search_method": "semantic_search",
    "reranking_enable": false,
    "reranking_model": {
      "reranking_provider_name": "aion",
      "reranking_model_name": "AI:ON-U Rerank"
    },
    "top_k": 22,
    "score_threshold_enabled": true,
    "score_threshold": 0.5
  }
}'
```

#### Response

지식 생성 Response와 동일한 형식 (업데이트된 retrieval_model_dict 포함)

---

### 1-5. 지식 삭제

지식을 삭제합니다. **복구가 불가능하니 주의하세요.**

- **Method**: `DELETE`
- **Endpoint**: `/datasets/{dataset_id}`

#### Request

**Path Parameter**: `dataset_id` (string) — 지식 아이디 (지식 페이지 URL에서 확인 가능)

#### Request Example

```bash
curl --location --request DELETE '{API_BASE_URL}/datasets/{dataset_id}' \
--header 'Authorization: Bearer {API_KEY}'
```

#### Response Example

```json
{
    "result": "success"
}
```

---

## 2. 문서 관리

### 2-1. 문서 생성 (by Text)

텍스트를 사용하여 문서를 생성합니다.

- **Method**: `POST`
- **Endpoint**: `/datasets/{dataset_id}/document/create_by_text`

#### Request

**Path Parameter**: `dataset_id` (string) — 지식 아이디

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| name | string | 문서 이름 |
| text | string | 컨텐츠 |
| indexing_technique | string | 인덱싱 방법 (`high_quality` / `economy`) |
| process_rule | object | 임베딩 방식 설정 |
| process_rule.mode | string | 모드 (`automatic` / `custom`) |
| process_rule.rules | object | 규칙 (custom 모드 시) |
| process_rule.rules.pre_processing_rules | array[object] | 전처리 규칙 (id: `remove_extra_spaces` / `remove_urls_emails`, enabled: bool) |
| process_rule.rules.segmentation | object | 세그멘테이션 (separator: string, max_tokens: int — 기본값 1000) |

#### Request Example

```bash
curl --location --request POST '{API_BASE_URL}/datasets/{dataset_id}/document/create_by_text' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "text",
    "text": "text",
    "indexing_technique": "high_quality",
    "process_rule": {
        "mode": "automatic"
    }
}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| document | object | 문서 정보 |
| document.id | string | 문서 아이디 |
| document.position | int | 문서 순서 |
| document.data_source_type | string | 데이터 업로드 방식 |
| document.data_source_info | object | 파일 업로드 정보 (upload_file_id) |
| document.dataset_process_rule_id | string | 지식 프로세싱 규칙 |
| document.name | string | 이름 |
| document.created_from | string | 생성방법 |
| document.created_by | string | 생성자 |
| document.created_at | timestamp | 생성시간 |
| document.tokens | int | 토큰수 |
| document.indexing_status | string | 프로세싱 상태 |
| document.error | string | 에러 |
| document.enabled | bool | 활성화 여부 |
| document.disabled_at | timestamp | 비활성화 시간 |
| document.disabled_by | string | 비활성화 한 사람 |
| document.archived | bool | 아카이브 상태 |
| document.display_status | string | 상태 |
| document.word_count | int | 단어 개수 |
| document.hit_count | int | 참조 개수 |
| document.doc_form | string | 문서 형식 |
| batch | string | 배치아이디 |

#### Response Example

```json
{
  "document": {
    "id": "",
    "position": 1,
    "data_source_type": "upload_file",
    "data_source_info": { "upload_file_id": "" },
    "dataset_process_rule_id": "",
    "name": "text.txt",
    "created_from": "api",
    "created_by": "",
    "created_at": 1592520280,
    "tokens": 0,
    "indexing_status": "waiting",
    "error": null,
    "enabled": true,
    "disabled_at": null,
    "disabled_by": null,
    "archived": false,
    "display_status": "queuing",
    "word_count": 0,
    "hit_count": 0,
    "doc_form": "text_model"
  },
  "batch": ""
}
```

---

### 2-2. 문서 생성 (by File)

파일을 이용하여 문서를 생성합니다.

- **Method**: `POST`
- **Endpoint**: `/datasets/{dataset_id}/document/create_by_file`

#### Request

**Path Parameter**: `dataset_id` (string) — 지식 아이디

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| data | multipart/form-data (JSON string) | 문서 설정 |
| data.original_document_id | string (optional) | 원본 문서 아이디. 있으면 기존 document 재업로드 후 재프로세싱, 없으면 새로 생성 |
| data.indexing_technique | string | 인덱싱 방법 (`high_quality` / `economy`) |
| data.process_rule | object | 임베딩 방식 설정 (문서 생성 by Text와 동일) |
| file | multipart/form-data | 업로드할 파일 데이터 |

#### Request Example

```bash
curl --location --request POST '{API_BASE_URL}/datasets/{dataset_id}/document/create_by_file' \
--header 'Authorization: Bearer {API_KEY}' \
--form 'data="{
  "indexing_technique": "high_quality",
  "process_rule": {
    "mode": "custom",
    "rules": {
      "pre_processing_rules": [
        { "id": "remove_extra_spaces", "enabled": true },
        { "id": "remove_urls_emails", "enabled": true }
      ],
      "segmentation": {
        "separator": "###",
        "max_tokens": 500
      }
    }
  }
}";type=text/plain' \
--form 'file=@"/path/to/file"'
```

#### Response

문서 생성 (by Text) Response와 동일한 형식

---

### 2-3. 문서 교체 (by Text)

존재하는 지식의 문서를 텍스트를 사용하여 교체합니다.

- **Method**: `POST`
- **Endpoint**: `/datasets/{dataset_id}/documents/{document_id}/update_by_text`

#### Request

**Path Parameters**:
- `dataset_id` (string) — 지식 아이디
- `document_id` (string) — 문서 아이디 (문서 상세 페이지 URL에서 확인 가능)

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| name | string | 문서 이름 (수정이 필요할 경우) |
| text | string | 문서 컨텐츠 (수정이 필요할 경우) |
| process_rule | object | 임베딩 방식 설정 (문서 생성 by Text와 동일) |

#### Request Example

```bash
curl --location --request POST '{API_BASE_URL}/datasets/{dataset_id}/documents/{document_id}/update_by_text' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "name": "name",
  "text": "text"
}'
```

#### Response

문서 생성 (by Text) Response와 동일한 형식

---

### 2-4. 문서 교체 (by File)

존재하는 지식의 문서를 파일을 이용하여 교체합니다.

- **Method**: `POST`
- **Endpoint**: `/datasets/{dataset_id}/documents/{document_id}/update_by_file`

#### Request

**Path Parameters**:
- `dataset_id` (string) — 지식 아이디
- `document_id` (string) — 문서 아이디 (문서 상세 페이지 URL에서 확인 가능)

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| data | multipart/form-data (JSON string) | 문서 설정 (name, indexing_technique, process_rule) |
| file | multipart/form-data | 파일 |

#### Request Example

```bash
curl --location --request POST '{API_BASE_URL}/datasets/{dataset_id}/documents/{document_id}/update_by_file' \
--header 'Authorization: Bearer {API_KEY}' \
--form 'data="{
  "name": "test",
  "indexing_technique": "high_quality",
  "process_rule": {
    "mode": "custom",
    "rules": {
      "pre_processing_rules": [
        { "id": "remove_extra_spaces", "enabled": true },
        { "id": "remove_urls_emails", "enabled": true }
      ],
      "segmentation": {
        "separator": "###",
        "max_tokens": 500
      }
    }
  }
}";type=text/plain' \
--form 'file=@"/path/to/file"'
```

#### Response

문서 생성 (by Text) Response와 동일한 형식

---

### 2-5. 문서 리스트 조회

지식에서 문서 리스트를 조회합니다.

- **Method**: `GET`
- **Endpoint**: `/datasets/{dataset_id}/documents`

#### Request

**Path Parameter**: `dataset_id` (string) — 지식 아이디

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| keyword | string | 조회 키워드 |
| page | string | 페이지 번호 |
| limit | string | 페이지당 조회 개수 |

#### Request Example

```bash
curl --location --request GET '{API_BASE_URL}/datasets/{dataset_id}/documents' \
--header 'Authorization: Bearer {API_KEY}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| data | array[object] | 문서 목록 (문서 생성 Response의 document 필드와 동일) |
| has_more | bool | 더 있는지 여부 |
| limit | int | 페이지당 조회 개수 |
| total | int | 총 개수 |
| page | int | 페이지 번호 |

#### Response Example

```json
{
  "data": [
    {
      "id": "",
      "position": 1,
      "data_source_type": "file_upload",
      "data_source_info": null,
      "dataset_process_rule_id": null,
      "name": "test",
      "created_from": "",
      "created_by": "",
      "created_at": 1681623639,
      "tokens": 0,
      "indexing_status": "waiting",
      "error": null,
      "enabled": true,
      "disabled_at": null,
      "disabled_by": null,
      "archived": false,
      "display_status": "",
      "word_count": 24,
      "hit_count": 0,
      "doc_form": ""
    }
  ],
  "has_more": false,
  "limit": 20,
  "total": 9,
  "page": 1
}
```

---

### 2-6. 문서 삭제

문서를 삭제합니다.

- **Method**: `DELETE`
- **Endpoint**: `/datasets/{dataset_id}/documents/{document_id}`

#### Request

**Path Parameters**:
- `dataset_id` (string) — 지식 아이디
- `document_id` (string) — 문서 아이디

#### Request Example

```bash
curl --location --request DELETE '{API_BASE_URL}/datasets/{dataset_id}/documents/{document_id}' \
--header 'Authorization: Bearer {API_KEY}'
```

#### Response Example

```json
{
  "result": "success"
}
```

---

## 3. 청크 관리

### 3-1. 청크 추가

청크를 추가합니다.

- **Method**: `POST`
- **Endpoint**: `/datasets/{dataset_id}/documents/{document_id}/segments`

#### Request

**Path Parameters**:
- `dataset_id` (string) — 지식 아이디
- `document_id` (string) — 문서 아이디

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| segments | array[object] | 청크 리스트 |
| segments[].content | string | 컨텐츠 |
| segments[].answer | string | 응답 |
| segments[].keywords | array[string] | 키워드 리스트 |

#### Request Example

```bash
curl --location --request POST '{API_BASE_URL}/datasets/{dataset_id}/documents/{document_id}/segments' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "segments": [
    {
      "content": "1",
      "answer": "1",
      "keywords": ["a"]
    }
  ]
}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| data | array[object] | 청크 데이터 |
| data[].id | string | 청크 아이디 |
| data[].position | int | 순서 |
| data[].document_id | string | 문서 아이디 |
| data[].content | string | 컨텐츠 |
| data[].answer | string | 응답 |
| data[].word_count | int | 단어개수 |
| data[].tokens | int | 토큰개수 |
| data[].keywords | array[string] | 키워드 리스트 |
| data[].index_node_id | string | 노드 아이디 |
| data[].index_node_hash | string | 노드 해시 |
| data[].hit_count | int | 사용 횟수 |
| data[].enabled | bool | 활성화 여부 |
| data[].disabled_at | timestamp | 비활성화 시간 |
| data[].disabled_by | string | 비활성화 사용자 |
| data[].status | string | 상태 |
| data[].created_by | string | 생성자 |
| data[].created_at | timestamp | 생성시간 |
| data[].indexing_at | timestamp | 임베딩시간 |
| data[].completed_at | timestamp | 완료시간 |
| data[].error | string | 에러 |
| data[].stopped_at | timestamp | 정지시간 |
| doc_form | string | 문서 양식 |

#### Response Example

```json
{
  "data": [{
    "id": "",
    "position": 1,
    "document_id": "",
    "content": "1",
    "answer": "1",
    "word_count": 25,
    "tokens": 0,
    "keywords": ["a"],
    "index_node_id": "",
    "index_node_hash": "",
    "hit_count": 0,
    "enabled": true,
    "disabled_at": null,
    "disabled_by": null,
    "status": "completed",
    "created_by": "",
    "created_at": 1695312007,
    "indexing_at": 1695312007,
    "completed_at": 1695312007,
    "error": null,
    "stopped_at": null
  }],
  "doc_form": "text_model"
}
```

---

### 3-2. 청크 업데이트

문서의 청크를 업데이트 합니다.

- **Method**: `POST`
- **Endpoint**: `/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}`

#### Request

**Path Parameters**:
- `dataset_id` (string) — 지식 아이디
- `document_id` (string) — 문서 아이디
- `segment_id` (string) — 청크 아이디

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| segments | object | 청크 |
| segments.content | string | 컨텐츠 (필수) |
| segments.answer | string | 응답 (옵션) |
| segments.keywords | array[string] | 키워드 (옵션) |
| segments.enabled | bool | 활성화 여부 (옵션) |

#### Request Example

```bash
curl --location --request POST '{API_BASE_URL}/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "segments": {
    "content": "동해물과백두산이",
    "answer": "마르고닳도록",
    "keywords": ["애국가"],
    "enabled": false
  }
}'
```

#### Response

청크 추가 Response와 동일한 형식

---

### 3-3. 청크 리스트 조회

문서의 청크 리스트를 가져옵니다.

- **Method**: `GET`
- **Endpoint**: `/datasets/{dataset_id}/documents/{document_id}/segments`

#### Request

**Path Parameters**:
- `dataset_id` (string) — 지식 아이디
- `document_id` (string) — 문서 아이디

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| keyword | string | 키워드 |
| status | string | 상태 |

#### Request Example

```bash
curl --location --request GET '{API_BASE_URL}/datasets/{dataset_id}/documents/{document_id}/segments' \
--header 'Authorization: Bearer {API_KEY}' \
--header 'Content-Type: application/json'
```

#### Response Body

청크 추가 Response와 동일 + `total` (int) 필드 추가

---

### 3-4. 청크 삭제

문서의 청크를 삭제합니다.

- **Method**: `DELETE`
- **Endpoint**: `/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}`

#### Request

**Path Parameters**:
- `dataset_id` (string) — 지식 아이디
- `document_id` (string) — 문서 아이디
- `segment_id` (string) — 청크 아이디

#### Request Example

```bash
curl --location --request DELETE '{API_BASE_URL}/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}' \
--header 'Authorization: Bearer {API_KEY}'
```

#### Response Example

```json
{
  "result": "success"
}
```

---

## 4. 임베딩 상태 체크

임베딩 상태를 체크합니다.

- **Method**: `GET`
- **Endpoint**: `/datasets/{dataset_id}/documents/{batch}/indexing-status`

#### Request

**Path Parameters**:
- `dataset_id` (string) — 지식 아이디
- `batch` (string) — 배치 아이디

#### Request Example

```bash
curl --location --request GET '{API_BASE_URL}/datasets/{dataset_id}/documents/{batch}/indexing-status' \
--header 'Authorization: Bearer {API_KEY}'
```

#### Response Body

| 필드 | 타입 | 설명 |
|------|------|------|
| data | array[object] | 데이터 |
| data[].id | string | 아이디 |
| data[].indexing_status | string | 프로세싱 상태 |
| data[].processing_started_at | timestamp | 프로세싱 시작 시간 |
| data[].parsing_completed_at | timestamp | 파싱 완료 시간 |
| data[].cleaning_completed_at | timestamp | cleaning 완료 시간 |
| data[].splitting_completed_at | timestamp | splitting 완료 시간 |
| data[].completed_at | timestamp | 완료시간 |
| data[].paused_at | timestamp | 일시정지 시간 |
| data[].error | string | 에러 |
| data[].stopped_at | timestamp | 정지시간 |
| data[].completed_segments | int | 완료된 청크 개수 |
| data[].total_segments | int | 총 청크 개수 |

#### Response Example

```json
{
  "data": [{
    "id": "",
    "indexing_status": "indexing",
    "processing_started_at": 1681623462.0,
    "parsing_completed_at": 1681623462.0,
    "cleaning_completed_at": 1681623462.0,
    "splitting_completed_at": 1681623462.0,
    "completed_at": null,
    "paused_at": null,
    "error": null,
    "stopped_at": null,
    "completed_segments": 24,
    "total_segments": 100
  }]
}
```

---

## 에러 코드

| 코드 | 에러 | 설명 |
|------|------|------|
| 400 | no_file_uploaded | 업로드된 파일이 없습니다 |
| 400 | too_many_files | 하나의 파일만 업로드 가능합니다 |
| 413 | file_too_large | 파일 사이즈가 너무 큽니다 |
| 415 | unsupported_file_type | 파일 타입이 허용되지 않습니다 |
| 400 | high_quality_dataset_only | 인덱스 모드가 '높은 성능' 일때만 처리 가능합니다 |
| 400 | dataset_not_initialized | 지식이 생성 중 입니다 |
| 403 | archived_document_immutable | 아카이브된 문서는 수정이 불가능 합니다 |
| 409 | dataset_name_duplicate | 지식 이름이 이미 존재합니다 |
| 400 | invalid_action | 잘못된 액션 입니다 |
| 400 | document_already_finished | 문서가 이미 프로세싱 완료되었습니다 |
| 400 | document_indexing | 문서가 프로세싱 중 입니다. 수정이 불가능합니다 |
| 400 | invalid_metadata | 잘못된 메타데이터 입니다 |
