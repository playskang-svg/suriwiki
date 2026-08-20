# SURIWIKI — CT·MOD 모듈형 콘텐츠 사이트

집수리 현장 사실(CASE)을 한 번 입력하면, AI가 검색 질문에 맞는 **Content Type(CT)** 와 **Module(M)** 을 조합해
CASE·WIKI·LANDING 페이지를 생성하는 사이트입니다.

> **운영 공식**
> 사람은 현장 사실과 원본 사진을 제공하고, AI는 검색 질문에 맞는 CT와 모듈을 조합해 CASE·WIKI·LANDING을 생성합니다.
> 글자 수를 맞추기 위해 없는 사실이나 반복 문장을 만들지 않습니다.

- 기준 문서: `Suriwiki CT·MOD 모듈형 콘텐츠 생성 가이드 v0.3`
- 스택: **Next.js (App Router) + Tailwind CSS + Supabase**
- 디자인 원본: Google **Stitch** export → `design/`
- 개발 에이전트: **Antigravity** (`AGENTS.md` 참조)

---

## 문서 인덱스

| # | 문서 | 내용 |
|---|---|---|
| 00 | [docs/00-overview.md](docs/00-overview.md) | 운영 공식, 생성 전 준비 자료 |
| 01 | [docs/01-content-type.md](docs/01-content-type.md) | CT1~CT6 정의 |
| 02 | [docs/02-module-dictionary.md](docs/02-module-dictionary.md) | M01~M24 모듈 사전 |
| 03 | [docs/03-ct-module-matrix.md](docs/03-ct-module-matrix.md) | CT별 필수·옵션 모듈 조합표 |
| 04 | [docs/04-image-rules.md](docs/04-image-rules.md) | 이미지 입력·분류·오버레이 규칙 |
| 05 | [docs/05-roles-human-ai.md](docs/05-roles-human-ai.md) | 사람과 AI의 업무 구분 |
| 06 | [docs/06-input-ui-flow.md](docs/06-input-ui-flow.md) | 입력 및 생성 화면 7단계 |
| 07 | [docs/07-composition-rules.md](docs/07-composition-rules.md) | 모듈 조합 규칙 |
| 08 | [docs/08-ai-selection-logic.md](docs/08-ai-selection-logic.md) | AI 모듈 선택 9단계 로직 |
| 09 | [docs/09-derivation-examples.md](docs/09-derivation-examples.md) | 한 CASE에서 파생 콘텐츠 만들기 |
| 10 | [docs/10-data-model.md](docs/10-data-model.md) | 최소 저장값 + 전체 데이터 모델 |
| 11 | [docs/11-site-architecture.md](docs/11-site-architecture.md) | Page Type·URL·라우팅 구조 |
| 12 | [docs/12-keyword-tree.md](docs/12-keyword-tree.md) | **키워드 트리 규격 (선점 전략)** |
| 13 | [docs/13-seo-rules.md](docs/13-seo-rules.md) | SEO·구조화 데이터·중복 방지 |
| 14 | [docs/14-design-system.md](docs/14-design-system.md) | Stitch 디자인 → 컴포넌트 매핑 |
| 15 | [docs/15-dev-spec.md](docs/15-dev-spec.md) | Next.js + Supabase 구현 사양 |
| 16 | [docs/16-quality-gate.md](docs/16-quality-gate.md) | 품질 게이트 / CREATE·UPDATE·MERGE·HOLD |

## 스킬

| 스킬 | 위치 | 역할 |
|---|---|---|
| `keyword-tree` | [.claude/skills/keyword-tree/](.claude/skills/keyword-tree/SKILL.md) | 집수리 키워드 트리 생성·확장·중복검사·우선순위 산출 |
| `ct-mod-composer` | [.claude/skills/ct-mod-composer/](.claude/skills/ct-mod-composer/SKILL.md) | CT 선택 → 필수/옵션 모듈 조립 → 원고 생성 |
| `case-intake` | [.claude/skills/case-intake/](.claude/skills/case-intake/SKILL.md) | 현장 사실·사진을 CASE 레코드로 구조화 |

## 기계 판독 데이터

| 파일 | 내용 |
|---|---|
| [data/content-types.json](data/content-types.json) | CT1~CT6 + 필수/옵션 모듈 |
| [data/modules.json](data/modules.json) | M01~M24 모듈 사전 |
| [data/keyword-tree.schema.json](data/keyword-tree.schema.json) | 키워드 트리 JSON Schema |
| [data/keyword-tree.seed.json](data/keyword-tree.seed.json) | 시드 택소노미 (욕실/주방/현관/베란다…) |
| [data/keyword-tree.json](data/keyword-tree.json) | 빌드 산출물 (build_tree.py 실행 결과) |

## 빠른 시작

```bash
# 1) 키워드 트리 빌드 + 검증
python3 .claude/skills/keyword-tree/scripts/build_tree.py \
  --seed data/keyword-tree.seed.json --out data/keyword-tree.json
python3 .claude/skills/keyword-tree/scripts/validate_tree.py data/keyword-tree.json

# 2) 페이지 생성 계획 뽑기 (우선순위 상위 50개)
python3 .claude/skills/keyword-tree/scripts/plan_pages.py data/keyword-tree.json --top 50

# 3) Next.js 앱 부트스트랩 (docs/15-dev-spec.md 참조)
```

## 절대 규칙 (사실성)

1. 실제 CASE에 없는 **지역·가격·후기·공정·결과**를 만들어내지 않는다.
2. 글자 수를 채우기 위해 일반론·유사 FAQ·동일 CTA를 반복하지 않는다.
3. 필수 모듈의 근거가 없으면 문장을 지어내지 말고 **CT 변경 또는 HOLD**.
4. 사진은 실제 내용을 변경하지 않는다(없던 손상·공정·재료·결과 생성 금지).
5. 지역 LANDING은 해당 지역의 **실제 CASE가 있을 때만** 생성한다.
