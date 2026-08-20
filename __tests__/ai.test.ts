import { describe, it, expect } from 'vitest';
import { generateModuleBody } from '../lib/compose/ai';
import * as schemas from '../lib/schemas/modules';

/**
 * 테스트 전용 픽스처 데이터.
 * 프로덕션 코드(lib/)에서는 절대 import 하지 않는다.
 */
function generateTestFixture(moduleCode: string, context: any) {
  switch (moduleCode) {
    case 'M01': return { answer: "Mock Answer", qualifier: "Mock Qualifier" };
    case 'M02': return { problem: "문제 설명", judgement: "판단 내용", work: "작업 과정", result: "결과 설명" };
    case 'M03': return { items: [{ text: context.case?.problem || "증상 텍스트" }] };
    case 'M04': return { steps: [{ n: 1, text: "점검 단계" }], observed: true };
    case 'M05': return { grades: [{ level: "경미", desc: "설명", action: "조치" }], case_grade: "경미" };
    case 'M06': return { observed: ["관찰한 원인"], conclusion: "판단 결론" };
    case 'M07': return { repair_when: ["수리 조건"], replace_when: ["교체 조건"] };
    case 'M08': return { steps: [{ n: 1, title: "시공 단계" }] };
    case 'M09': return { items: [{ icon: "build", title: "서비스명", desc: "설명 텍스트" }] };
    case 'M10': return { prepare: ["준비물"], steps: [{ n: 1, title: "단계명", desc: "설명" }], stop_if: ["중단 조건"] };
    case 'M11': return { kind: "material", items: [{ name: "자재명" }] };
    case 'M12': return { kind: "tool", items: [{ name: "공구명" }] };
    case 'M13': return { axes: ["비교 기준"], items: [{ name: "항목명", values: ["값"] }], recommendation: "추천 사항" };
    case 'M14': return { factors: [{ name: "요소", effect: "영향" }], disclaimer: "면책 조항 텍스트", amounts: null };
    case 'M15': return { items: [{ text: "안전 수칙" }], safe: true };
    case 'M16': return { level: "warning", stop_conditions: ["중단 조건"], message: "경고 메시지" };
    case 'M17': return { items: [{ text: "유지보수 항목" }] };
    case 'M18': return { improved: ["개선된 점"], limits: ["한계 사항"] };
    case 'M19': return { case_id: "case_id_1", area_label: "지역명", one_line: "한 줄 요약", url: "/case/example" };
    case 'M20': return { focus: "포커스 설명", items: [{ image_variant_id: "img_1", role: "BEFORE", caption: "캡션 설명" }] };
    case 'M21': return { items: [{ q: "자주 묻는 질문", a: "답변 텍스트" }] };
    case 'M22': return { items: [{ url: "/related", title: "관련 링크", relation: "관련성 설명" }] };
    case 'M23': return { area_slug: "area_1", area_label: "지역 라벨", case_count: 1, cases: [{ url: "/case/1", title: "사례 제목" }], coverage_note: "커버리지 노트" };
    case 'M24': return { headline: "헤드라인 문구", primary: { type: "photo_upload" }, secondary: [], rotation_key: "rotation_1" };
    default: return null;
  }
}

describe('AI Zod Parsing', () => {
  const allModules = [
    'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08',
    'M09', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16',
    'M17', 'M18', 'M19', 'M20', 'M21', 'M22', 'M23', 'M24'
  ];

  it('should pass Zod schema validation for all test fixtures (M01~M24)', () => {
    for (const code of allModules) {
      const fixture = generateTestFixture(code, {});
      if (!fixture) continue;
      
      const schemaName = `${code}BodySchema`;
      const schema = (schemas as any)[schemaName];
      expect(schema, `Schema for ${code} should exist`).toBeDefined();
      
      const result = schema.safeParse(fixture);
      expect(result.success, `${code} fixture should pass schema: ${result.success ? '' : result.error?.message}`).toBe(true);
    }
  });

  it('should return real data from case context for M02', async () => {
    const context = {
      case: {
        problem: '욕조 배수 트랩이 빠져 배수가 불가능함',
        judgement: '점검구 타공 후 트랩 교체',
        work_steps: [{ order: 1, title: '점검구 타공' }, { order: 2, title: '트랩 교체 및 고정' }],
        result: '배수 정상화',
      }
    };
    const result = await generateModuleBody('M02', context);
    expect(result).not.toBeNull();
    expect(result!.problem).toBe('욕조 배수 트랩이 빠져 배수가 불가능함');
    expect(result!.work).toBe('점검구 타공 → 트랩 교체 및 고정');
    expect(result!.result).toBe('배수 정상화');
  });

  it('should return null (HOLD) when case data is insufficient for M02', async () => {
    const context = { case: { problem: '문제만 있음' } };
    const result = await generateModuleBody('M02', context);
    expect(result).toBeNull();
  });

  it('M06: observed and conclusion should come from different case fields', async () => {
    const context = {
      case: {
        cause: '개구부에 방조망이 없어 새가 유입됨',
        judgement: '개구부 전체에 프레임 고정형 방조망 설치',
      }
    };
    const result = await generateModuleBody('M06', context);
    expect(result).not.toBeNull();
    expect(result!.observed[0]).toBe('개구부에 방조망이 없어 새가 유입됨');
    expect(result!.conclusion).toBe('개구부 전체에 프레임 고정형 방조망 설치');
    // observed와 conclusion이 달라야 한다
    expect(result!.observed[0]).not.toBe(result!.conclusion);
  });

  it('M18: improved and limits should come from different case fields', async () => {
    const context = {
      case: {
        result: '비둘기 유입 완전 차단',
        limit_note: '기존 그릴 손상 부위 잔존',
      }
    };
    const result = await generateModuleBody('M18', context);
    expect(result).not.toBeNull();
    expect(result!.improved[0]).toBe('비둘기 유입 완전 차단');
    expect(result!.limits[0]).toBe('기존 그릴 손상 부위 잔존');
  });

  it('M18: limits should be empty array when limit_note is null', async () => {
    const context = {
      case: {
        result: '비둘기 유입 완전 차단',
        limit_note: null,
      }
    };
    const result = await generateModuleBody('M18', context);
    expect(result).not.toBeNull();
    expect(result!.improved[0]).toBe('비둘기 유입 완전 차단');
    expect(result!.limits).toEqual([]);
  });
});
