import { getCTMatrix, getModules } from './rules';
import { evidenceStrength } from './evidence';

// N-gram jaccard
export function ngramJaccard(strA: string, strB: string, n = 3): number {
  // basic normalization
  const normA = strA.replace(/[^가-힣a-zA-Z0-9]/g, '');
  const normB = strB.replace(/[^가-힣a-zA-Z0-9]/g, '');
  
  if (normA.length < n || normB.length < n) {
     if (normA === normB) return 1;
     return 0;
  }

  const getGrams = (str: string) => {
    const grams = new Set<string>();
    for (let i = 0; i <= str.length - n; i++) {
      grams.add(str.slice(i, i + n));
    }
    return grams;
  }
  
  const setA = getGrams(normA);
  const setB = getGrams(normB);
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

export function jaccardArray(arrA: string[], arrB: string[]): number {
  const setA = new Set(arrA);
  const setB = new Set(arrB);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

// BUG-2 fix diffScore
export function diffScore(
  intentA: string, intentB: string,
  m01A: string, m01B: string,
  modulesA: string[], modulesB: string[],
  imagesA: string[], imagesB: string[],
  simSearchIntent?: number,
  simM01Answer?: number
): number {
  const simIntent = simSearchIntent !== undefined ? simSearchIntent : ngramJaccard(intentA, intentB);
  const simM01 = simM01Answer !== undefined ? simM01Answer : ngramJaccard(m01A, m01B);
  const simModules = jaccardArray(modulesA, modulesB);
  const simImages = jaccardArray(imagesA, imagesB);

  return (
    0.30 * (1 - simIntent) +
    0.25 * (1 - simM01) +
    0.25 * (1 - simModules) +
    0.20 * (1 - simImages)
  );
}

import fs from 'fs';
import path from 'path';

// Helper for intent fit
let intentFitData: any = null;
function getIntentFit(moduleCode: string, searchIntent: string) {
  if (!intentFitData) {
      try {
          intentFitData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/intent-fit.json'), 'utf-8'));
      } catch(e) {
          intentFitData = {};
      }
  }
  for (const intentCategory of Object.keys(intentFitData)) {
      // In a real system, we'd map searchIntent string to one of the categories.
      // If searchIntent matches exactly or roughly:
      // The prompt says "질문 유형은 keyword_node.intent 에서 가져온다". 
      // I'll assume searchIntent argument is actually keyword_node.intent.
      if (searchIntent === intentCategory) {
          const m = intentFitData[intentCategory];
          if (m.high?.includes(moduleCode)) return 0.9;
          if (m.medium?.includes(moduleCode)) return 0.55;
          if (m.low?.includes(moduleCode)) return 0.15;
      }
  }
  return 0.4; // 표에 없음
}

function getUniqueness(moduleCode: string, existingPages: any[]) {
  if (existingPages.length === 0) return 1.0;
  let count = 0;
  for (const p of existingPages) {
      if (p.module_order && p.module_order.includes(moduleCode)) {
          count++;
      }
  }
  return 1 - (count / existingPages.length);
}

function getConversionValue(moduleCode: string, pageType: string) {
  if (pageType === 'LANDING') {
      if (moduleCode === 'M24') return 1.0;
      if (moduleCode === 'M23') return 0.8;
      if (moduleCode === 'M19') return 0.7;
  } else if (pageType === 'CASE') {
      if (moduleCode === 'M20') return 0.9;
      if (moduleCode === 'M18') return 0.8;
      if (moduleCode === 'M24') return 0.7;
  } else if (pageType === 'WIKI') {
      if (moduleCode === 'M22') return 0.8;
      if (moduleCode === 'M13') return 0.7;
      if (moduleCode === 'M21') return 0.6;
  } else if (pageType === 'TOPIC' || pageType === 'AREA') {
      if (moduleCode === 'M22' || moduleCode === 'M23') return 0.9;
  }
  return 0.3;
}

export function composePage(caseData: any, keywordNode: any, existingPages: any[]) {
  if (caseData.status !== 'approved') {
    return { decision: 'HOLD', reason: 'Case not approved' };
  }

  const searchIntent = keywordNode.query_ko;
  const intentCategory = keywordNode.intent;
  let pageType = keywordNode.suggested_page_type || 'LANDING';
  let ct = keywordNode.suggested_ct || 'CT1';

  return composePageWithCT(ct, caseData, keywordNode, existingPages, pageType, searchIntent, intentCategory);
}

function composePageWithCT(ct: string, caseData: any, keywordNode: any, existingPages: any[], pageType: string, searchIntent: string, intentCategory: string, isFallback = false): any {
  const matrix = getCTMatrix(ct);
  if (!matrix) {
    return { decision: 'HOLD', reason: `Unknown CT: ${ct}`, required_evidence: [] };
  }

  let required = [...matrix.required];
  
  if (caseData.safety_flags && caseData.safety_flags.length > 0) required.push('M16');
  if (pageType === 'AREA') required.push('M23');
  if (pageType === 'LANDING') required.push('M24');

  required = Array.from(new Set(required));

  let missing: string[] = [];
  for (const m of required) {
    const ev = evidenceStrength(m, caseData);
    if (!ev.isValid) {
      missing.push(m);
    }
  }

  if (missing.length > 0) {
    if (!isFallback && matrix.fallback_ct) {
      return composePageWithCT(matrix.fallback_ct, caseData, keywordNode, existingPages, pageType, searchIntent, intentCategory, true);
    }
    return { 
      decision: 'HOLD', 
      reason: `${missing.join(', ')} 근거 없음`, 
      required_evidence: missing,
      alternative: matrix.fallback_ct ? `CT 전환 실패` : `fallback 없음`
    };
  }

  let optionalList = [...matrix.optional];
  
  const scoredOptional = optionalList.map(m => {
    const ev = evidenceStrength(m, caseData);
    if (!ev.isValid) return { code: m, score: -1 };

    const score = 
      0.40 * ev.score +
      0.35 * getIntentFit(m, intentCategory) +
      0.15 * getUniqueness(m, existingPages) +
      0.10 * getConversionValue(m, pageType);

    return { code: m, score };
  }).filter(m => m.score >= 0).sort((a, b) => b.score - a.score);

  const selectedOptional = scoredOptional.slice(0, 4).map(m => m.code);
  const selectedModules = [...required, ...selectedOptional];
  
  // Sort by default_order, then by group order
  const moduleData = getModules().modules;
  const groupOrder = ['답변', '진단', '실행', '정보', '안전·사후', '근거', '연결'];
  const mInfo = (code: string) => moduleData.find((m: any) => m.code === code) || { group: '기타' };

  const moduleOrder = selectedModules.sort((a, b) => {
    const idxA = matrix.default_order.indexOf(a);
    const idxB = matrix.default_order.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    const gA = groupOrder.indexOf(mInfo(a).group);
    const gB = groupOrder.indexOf(mInfo(b).group);
    return gA - gB;
  });
  
  const imageSet = caseData.images?.slice(0, 6).map((img: any) => img.id) || [];

  // For R7: Since M01 is generated later by AI, we defer diffScore calculation.
  // We don't make the decision here. The caller (e.g., ai.ts) should compute diffScore and decide CREATE/MERGE/UPDATE.
  let dup = 1.0;
  let decision = 'PENDING_DIFF';

  return {
    page_type: pageType,
    content_type: ct,
    search_intent: searchIntent,
    required_modules: required,
    selected_modules: selectedOptional, // ACTUAL optional modules
    module_order: moduleOrder,
    image_set: imageSet,
    decision,
    diff_score_min: dup
  };
}
