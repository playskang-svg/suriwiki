# AGENTS.md — 이 저장소에서 AI 에이전트가 지켜야 할 규칙

이 파일은 Antigravity · Claude · Cursor 등 모든 코딩 에이전트의 공통 규칙입니다.
작업을 시작하기 전에 **반드시 아래 순서로 읽으세요.**

## 0. 읽는 순서

```
1. README.md                    프로젝트 개요와 문서 인덱스
2. docs/00-overview.md          운영 공식
3. docs/01 ~ docs/03            CT·모듈 규격 (핵심)
4. docs/10-data-model.md        데이터 모델
5. docs/11-site-architecture.md 라우팅
6. docs/14-design-system.md     Stitch 토큰
7. docs/15-dev-spec.md          구현 사양
8. docs/16-quality-gate.md      발행 차단 규칙 (반드시)
```

## 1. 단일 소스 (Single Source of Truth)

| 대상 | 단일 소스 | 하지 말 것 |
|---|---|---|
| CT별 필수·옵션 모듈 | `data/content-types.json` | 코드에 표 하드코딩 |
| 모듈 정의 | `data/modules.json` | 컴포넌트에 이름 하드코딩 |
| 키워드 | `data/keyword-tree.seed.json` → `keyword-tree.json` (빌드 산출물) | 산출물을 손으로 편집 |
| **지역** | **DB `areas` 테이블** → `data/areas.json` (빌드 산출물) | 시드·산출물에 지역을 적기 |
| 디자인 토큰 | `tailwind.config.ts` (Stitch에서 이식) | 임의 hex 값 사용 |
| 사이트 정보 | `config/site.ts` | 컴포넌트에 전화번호·브랜드명 하드코딩 |

**`data/keyword-tree.json` · `data/areas.json` 을 직접 수정하지 마세요.**
`npm run tree:build` 로 재생성하거나 `update_status.py` 로 상태만 바꿉니다.
키워드는 `keyword-tree.seed.json`, 지역은 DB `areas` 테이블에서만 고칩니다
(docs/17-swappable-config.md §4-1).

## 2. 절대 규칙 (사실성)

이 규칙은 코드 컨벤션이 아니라 **제품의 존재 이유**입니다. 어떤 이유로도 우회하지 마세요.

1. 실제 CASE에 없는 **지역·가격·후기·공정·결과**를 만들어내지 않는다.
2. 글자 수를 채우기 위해 일반론·유사 FAQ·동일 CTA를 반복하지 않는다.
3. 필수 모듈의 근거가 없으면 → **CT 변경 또는 HOLD**. 문장을 지어내지 않는다.
4. `is_private = true` 사진은 어떤 경로로도 공개되지 않는다.
5. 지역 LANDING은 해당 지역 CASE가 있을 때만 생성한다.
6. Stitch 더미 수치(`10,000+`, `4.9`, `99%`)를 실제 지표처럼 렌더하지 않는다.

전체: `docs/16-quality-gate.md`

## 3. 스킬 사용

| 상황 | 스킬 |
|---|---|
| 현장 메모·사진을 CASE로 정리 | `.claude/skills/case-intake/` |
| 키워드 후보·우선순위·중복 판정 | `.claude/skills/keyword-tree/` |
| CT 선택 + 모듈 조립 + 원고 생성 | `.claude/skills/ct-mod-composer/` |

Antigravity/Cursor 등 Claude 스킬 시스템이 없는 도구에서는 해당 `SKILL.md` 를 **컨텍스트로 직접 읽어** 절차를 따르세요.

## 4. 코드 규칙

- TypeScript strict. `any` 금지 (외부 JSON 파싱 직후 zod로 좁힐 때만 예외).
- 서버 컴포넌트 우선. `"use client"` 는 갤러리·아코디언·폼에만.
- 모듈 컴포넌트는 `components/modules/M**.tsx` 1파일 1모듈, `registry.ts` 에 등록.
- 모든 AI 출력은 zod `safeParse`. 실패 시 저장하지 않고 재시도 1회 → HOLD.
- 색상은 Tailwind 토큰 이름으로만 (`bg-primary`, `text-on-surface`). 임의 hex 금지.
- 한국어 UI 문자열은 컴포넌트에 인라인해도 되지만, CTA 문구는 `config/cta.ts` 로 분리(로테이션 규칙 D6).

## 5. 작업 순서 (마일스톤)

`docs/15-dev-spec.md` §7 을 따릅니다.
**M3(모듈 컴포넌트 24종 + PageRenderer) 전에 콘텐츠를 대량 생성하지 마세요.**
렌더러가 확정돼야 모듈 body 스키마가 고정됩니다.

## 6. 커밋

```
feat(modules): M05 GradeCards 구현
fix(gate): 지역 CASE 없을 때 M23 렌더 차단
docs(keyword-tree): 동의어 사전에 플로어힌지 변형 추가
```

## 7. 막혔을 때

- 규격이 모호하면 **추측해서 구현하지 말고** `docs/` 의 해당 문서를 인용해 질문하세요.
- 원문 가이드(`Suriwiki_CT_MOD_..._v0.3.docx`)와 `docs/` 가 충돌하면 **원문이 우선**입니다.
