import * as schemas from '../schemas/modules';

export async function generateModuleBody(moduleCode: keyof schemas.ModuleBodyMap, context: any) {
  let attempt = 0;
  
  while (attempt < 2) {
    try {
      const rawData = generateRealDataForModule(moduleCode, context);
      
      if (!rawData) {
        return null;
      }
      
      const schemaName = `${moduleCode}BodySchema`;
      const schema = (schemas as any)[schemaName];
      if (!schema) throw new Error(`Schema not found for ${moduleCode}`);

      const parsed = schema.safeParse(rawData);
      if (parsed.success) {
        return parsed.data;
      } else {
        throw new Error(`Zod parse failed: ${parsed.error.message}`);
      }
    } catch (e) {
      attempt++;
      if (attempt >= 2) {
        return null;
      }
    }
  }
  return null;
}

/**
 * CASE 필드에서 모듈 본문을 생성한다.
 * 매핑 규칙:
 *   - 각 모듈 필드는 정확히 하나의 CASE 필드에서 온다.
 *   - 한 CASE 필드를 서로 다른 의미의 모듈 필드에 복사하지 않는다.
 *   - 대응하는 CASE 필드가 없거나 비어 있으면 null을 반환하여 HOLD 시킨다.
 */
export function generateRealDataForModule(moduleCode: string, context: any) {
  const c = context.case;
  if (!c) return null;

  switch (moduleCode) {
    // M02: 4줄 요약. cases 에 work 필드가 없으므로 work_steps 를 한 줄로 합친다.
    case 'M02': {
      if (!c.problem || !c.judgement || !c.result) return null;
      const workSummary = c.work_steps?.length
        ? c.work_steps.map((s: any) => s.title).join(' → ')
        : null;
      if (!workSummary) return null;
      return { problem: c.problem, judgement: c.judgement, work: workSummary, result: c.result };
    }

    // M03: 현장 증상. text ← problem, detail 은 optional 이므로 생략.
    case 'M03':
      if (!c.problem) return null;
      return { items: [{ text: c.problem }] };

    // M04: 점검 단계. steps ← work_steps, observed ← cause_observed.
    case 'M04':
      if (!c.work_steps?.length) return null;
      return {
        steps: c.work_steps.map((s: any) => ({ n: s.order, text: s.title })),
        observed: !!c.cause_observed,
      };

    // M06: 원인 분석. observed ← cause (관찰 사실), conclusion ← judgement (판단 결론).
    // 두 필드는 의미가 다르므로 서로 다른 CASE 필드에서 가져온다.
    case 'M06':
      if (!c.cause || !c.judgement) return null;
      return { observed: [c.cause], conclusion: c.judgement };

    // M08: 시공 절차. title ← work_steps[].title, desc ← work_steps[].note.
    // note 가 없으면 desc 를 생략 (스키마를 optional 로 변경 필요).
    case 'M08':
      if (!c.work_steps?.length) return null;
      return {
        steps: c.work_steps.map((s: any) => ({
          n: s.order,
          title: s.title,
          ...(s.note ? { desc: s.note } : {}),
        })),
      };

    // M11: 자재. name ← materials[]. features/use/limit 는 CASE 에 없으므로 생략.
    // 스키마를 optional 로 변경해야 함.
    case 'M11':
      if (!c.materials?.length) return null;
      return {
        kind: 'material',
        items: c.materials.map((m: string) => ({ name: m })),
      };

    // M12: 공구. name ← tools[]. 나머지 optional.
    case 'M12':
      if (!c.tools?.length) return null;
      return {
        kind: 'tool',
        items: c.tools.map((t: string) => ({ name: t })),
      };

    // M18: 개선점/한계. improved ← result, limits ← limit_note.
    // limit_note 가 비어 있으면 limits 를 빈 배열로 둔다.
    case 'M18':
      if (!c.result) return null;
      return {
        improved: [c.result],
        limits: c.limit_note ? [c.limit_note] : [],
      };

    // 나머지 모듈은 LLM 연동이 필요하므로 null (HOLD).
    default:
      return null;
  }
}
