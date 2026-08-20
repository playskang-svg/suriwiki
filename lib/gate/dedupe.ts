import { GateResult } from './facts';
import { PageContext } from '../schemas/page-context';
import { jaccardArray } from '../compose/compose';
import fs from 'fs';
import path from 'path';

// Helper for Kendall Tau distance
function kendallTauDistance(arr1: string[], arr2: string[]): number {
  const common = arr1.filter(x => arr2.includes(x));
  if (common.length < 3) return 0; // Skip if less than 3 common modules
  
  let concordant = 0;
  let discordant = 0;
  
  for (let i = 0; i < common.length; i++) {
    for (let j = i + 1; j < common.length; j++) {
      const a = common[i];
      const b = common[j];
      const pos1_a = arr1.indexOf(a);
      const pos1_b = arr1.indexOf(b);
      const pos2_a = arr2.indexOf(a);
      const pos2_b = arr2.indexOf(b);
      
      const sign1 = Math.sign(pos1_a - pos1_b);
      const sign2 = Math.sign(pos2_a - pos2_b);
      
      if (sign1 === sign2) concordant++;
      else discordant++;
    }
  }
  
  const totalPairs = (common.length * (common.length - 1)) / 2;
  return (concordant - discordant) / totalPairs;
}

export function checkDedupe(pageContext: PageContext & { diff_score_min?: number, faq_similarity_max?: number, existing_pages?: any[] }): GateResult {
  const violations: { code: string, message: string, hint: string }[] = [];
  const notes: { code: string, message: string }[] = [];
  
  // D1: dedupe_key 충돌
  if (pageContext.dedupe_key && pageContext.existing_pages) {
     const collision = pageContext.existing_pages.some(p => p.dedupe_key === pageContext.dedupe_key && p.id !== pageContext.id);
     if (collision) {
         violations.push({ code: 'D1', message: 'dedupe_key 충돌', hint: '이미 존재하는 키워드/조합' });
     }
  }

  // D2: 파생 페이지 간 diff_score >= 0.45
  if (pageContext.diff_score_min !== undefined && pageContext.diff_score_min < 0.45) { // removed && pageContext.decision === 'CREATE' to make it just check the score
    violations.push({ code: 'D2', message: '유사도 높음', hint: 'MERGE 하거나 내용을 차별화하세요' });
  }

  // D3: 같은 CT 다른 페이지와 module_order 유사도 < 0.85 (Kendall tau)
  if (pageContext.existing_pages && pageContext.module_order) {
     const sameCT = pageContext.existing_pages.filter(p => p.content_type === pageContext.content_type && p.id !== pageContext.id);
     for (const p of sameCT) {
         if (p.module_order) {
             const tau = kendallTauDistance(pageContext.module_order, p.module_order);
             if (tau >= 0.85) {
                 violations.push({ code: 'D3', message: '모듈 순서 유사도 높음', hint: `페이지 ${p.id}와 유사도 ${tau.toFixed(2)}` });
                 break;
             }
         }
     }
  }

  // D4: FAQ 유사도 < 0.85
  if (pageContext.faq_similarity_max !== undefined && pageContext.faq_similarity_max >= 0.85) {
    violations.push({ code: 'D4', message: 'FAQ 유사도 높음', hint: '중복 FAQ 제거' });
  }

  // D5: 이미지 세트 Jaccard < 0.6 (image_variants.image_id 비교)
  if (pageContext.existing_pages && pageContext.image_variants && pageContext.image_variants.length > 0) {
      const origIds = pageContext.image_variants.map(v => v.image_id).filter(Boolean);
      
      for (const p of pageContext.existing_pages) {
          if (p.image_variants && p.image_variants.length > 0 && p.id !== pageContext.id) {
              const pOrigIds = p.image_variants.map((v:any) => v.image_id).filter(Boolean);
              if (origIds.length > 0 && pOrigIds.length > 0) {
                  const j = jaccardArray(origIds, pOrigIds);
                  if (j >= 0.6) {
                      violations.push({ code: 'D5', message: '이미지 세트 중복', hint: `페이지 ${p.id}와 Jaccard ${j.toFixed(2)}` });
                      break;
                  }
              }
          }
      }
  }

  // D6: CTA rotation_key 반복
  if (pageContext.cta_rotation_key && pageContext.existing_pages) {
     // Checking if CTA rotation key is same as a recent page in the same group
     const sameGroup = pageContext.existing_pages.filter(p => p.content_type === pageContext.content_type && p.id !== pageContext.id);
     if (sameGroup.length > 0) {
         const lastPage = sameGroup[sameGroup.length - 1]; // Selecting most recent
         if (lastPage.cta_rotation_key === pageContext.cta_rotation_key) {
             violations.push({ code: 'D6', message: 'CTA 반복', hint: 'rotation_key 변경' });
         }
     }
  }

  return { pass: violations.length === 0, violations, notes };
}
