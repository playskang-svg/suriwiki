import { GateResult } from './facts';
import { PageContext } from '../schemas/page-context';
import { getCTMatrix } from '../compose/rules';
import { evidenceStrength } from '../compose/evidence';

export function checkStructure(pageContext: PageContext): GateResult {
  const violations: { code: string, message: string, hint: string }[] = [];
  const notes: { code: string, message: string }[] = [];
  
  // S1: 중심 CT 1개
  if (!pageContext.content_type) {
    violations.push({ code: 'S1', message: '중심 CT 없음', hint: 'CT 지정 필요' });
  }

  // S2: 필수 모듈 존재 및 증거 (R8 포함)
  if (pageContext.content_type) {
     const matrix = getCTMatrix(pageContext.content_type);
     if (matrix) {
       for (const m of matrix.required) {
         if (!pageContext.module_order?.includes(m)) {
           violations.push({ code: 'S2', message: `필수 모듈 ${m} 누락`, hint: `CT ${pageContext.content_type}의 필수 모듈` });
         } else {
           const ev = evidenceStrength(m, pageContext.case || {});
           if (!ev.isValid) {
             violations.push({ code: 'S2', message: `필수 모듈 ${m} 증거 부족`, hint: `점수: ${ev.score}` });
           }
         }
       }
       if (matrix.required_alternatives) {
           for (const group of matrix.required_alternatives) {
               const hasAlt = group.some((m: string) => pageContext.module_order?.includes(m));
               if (!hasAlt) {
                   violations.push({ code: 'S2', message: `대체 필수 모듈 누락`, hint: `(${group.join('|')}) 중 최소 1개 필요` });
               } else {
                   // Check evidence for the ones that exist
                   const existingAlts = group.filter((m: string) => pageContext.module_order?.includes(m));
                   let anyValid = false;
                   for (const m of existingAlts) {
                       const ev = evidenceStrength(m, pageContext.case || {});
                       if (ev.isValid) anyValid = true;
                   }
                   if (!anyValid) {
                       violations.push({ code: 'S2', message: `대체 필수 모듈 증거 부족`, hint: `(${group.join('|')}) 증거 불충분` });
                   }
               }
           }
       }
     }
  }

  // S3: 옵션 모듈 2~4개
  const optCount = pageContext.module_order ? pageContext.module_order.filter(m => {
     if (!pageContext.content_type) return false;
     const matrix = getCTMatrix(pageContext.content_type);
     return matrix?.optional.includes(m);
  }).length : 0;
  
  if (optCount > 4) {
    violations.push({ code: 'S3', message: '옵션 모듈 초과', hint: '2~4개만 선택' });
  } else if (optCount < 2) {
    notes.push({ code: 'S3', message: `옵션 모듈 ${optCount}개 — 근거 있는 모듈만 사용함(정상)` });
  }

  // S4: 위험 플래그 시 M16
  if (pageContext.case?.safety_flags && pageContext.case.safety_flags.length > 0) {
    if (!pageContext.module_order?.includes('M16')) {
      violations.push({ code: 'S4', message: '안전 M16 누락', hint: '위험 플래그 시 M16 필수' });
    }
  }
  
  // S5: 지역 언급 시 M23
  if (pageContext.page_type === 'AREA' && !pageContext.module_order?.includes('M23')) {
      violations.push({ code: 'S5', message: '지역 언급 시 M23 누락', hint: 'M23 추가' });
  }

  // S6: M08 steps === case.work_steps (if CT6)
  if (pageContext.content_type === 'CT6') {
      if (!pageContext.m08?.steps || !Array.isArray(pageContext.m08.steps)) {
          violations.push({ code: 'S6', message: 'M08 누락', hint: 'CT6는 M08 필수' });
      } else if (pageContext.case?.work_steps) {
          const caseSteps = pageContext.case.work_steps;
          if (pageContext.m08.steps.length !== caseSteps.length) {
              violations.push({ code: 'S6', message: 'M08 단계 불일치', hint: `case.work_steps 개수(${caseSteps.length})와 M08.steps 다름` });
          } else {
              for (let i=0; i<caseSteps.length; i++) {
                  if (pageContext.m08.steps[i].title !== caseSteps[i].title) {
                      violations.push({ code: 'S6', message: 'M08 내용 불일치', hint: `${i+1}번째 단계 불일치` });
                      break;
                  }
              }
          }
      }
  }

  // S7: CT4 -> M13 items >= min_compare_items
  if (pageContext.content_type === 'CT4') {
      const min = getCTMatrix('CT4')?.min_compare_items || 2;
      if (!pageContext.m13?.items) {
          violations.push({ code: 'S7', message: 'M13 누락', hint: 'CT4는 M13 필수' });
      } else if (pageContext.m13.items.length < min) {
          violations.push({ code: 'S7', message: 'M13 비교 항목 부족', hint: `최소 ${min}개 필요` });
      }
  }

  // S8: CT1 -> case.cause && cause_observed === true
  if (pageContext.content_type === 'CT1') {
      if (!pageContext.case?.cause || pageContext.case.cause_observed !== true) {
          violations.push({ code: 'S8', message: '원인 관찰 기록 없음', hint: 'CT1은 cause_observed=true 여야 함' });
      }
  }

  return { pass: violations.length === 0, violations, notes };
}
