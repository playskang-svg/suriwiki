const HINT_W: Record<string, number> = { high: 1.0, mid: 0.6, low: 0.3 };
const COMP_W: Record<string, number> = { low: 1.0, mid: 0.55, high: 0.2 };
const INTENT_VALUE: Record<string, number> = {
  judge: 1.0, compare: 1.0,
  cause: 0.8, cost: 0.75, case: 0.7, area: 0.7,
  howto: 0.5, spec: 0.5,
};

function evidence_w(n: number): number {
  if (n === 0) return 0.0;
  if (n === 1) return 0.6;
  if (n === 2) return 0.85;
  return 1.0;
}

export function priorityScore(
  volume: 'high' | 'mid' | 'low',
  nCases: number,
  competition: 'high' | 'mid' | 'low',
  intent: string,
  hasAreaBonus: boolean
): number {
  const vScore = 35 * (HINT_W[volume] ?? 0.3);
  const eScore = 25 * evidence_w(nCases);
  const cScore = 20 * (COMP_W[competition] ?? 0.55);
  const iScore = 12 * (INTENT_VALUE[intent] ?? 0.5);
  const aScore = 8 * (hasAreaBonus ? 1.0 : 0.0);
  
  const score = vScore + eScore + cScore + iScore + aScore;
  return Math.round(score * 10) / 10;
}

// Jaccard similarity for arrays
function jaccard<T>(setA: Set<T>, setB: Set<T>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 1.0; // Both empty means they are identical
  return intersection.size / union.size;
}

// Text similarity (3-gram Jaccard as per scoring.md)
function getNgrams(text: string, n: number = 3): Set<string> {
  const ngrams = new Set<string>();
  for (let i = 0; i <= text.length - n; i++) {
    ngrams.add(text.substring(i, i + n));
  }
  return ngrams;
}

export function simText(textA: string, textB: string): number {
  // If too short, just do exact match
  if (textA.length < 3 || textB.length < 3) {
    return textA === textB ? 1.0 : 0.0;
  }
  return jaccard(getNgrams(textA), getNgrams(textB));
}

export function diffScore(
  intentA: string, intentB: string,
  m01A: string, m01B: string,
  modulesA: string[], modulesB: string[],
  imagesA: string[], imagesB: string[]
): number {
  const dIntent = 1 - simText(intentA, intentB);
  const dM01 = 1 - simText(m01A, m01B);
  const dModules = 1 - jaccard(new Set(modulesA), new Set(modulesB));
  const dImages = 1 - jaccard(new Set(imagesA), new Set(imagesB));

  return (
    0.30 * dIntent +
    0.25 * dM01 +
    0.25 * dModules +
    0.20 * dImages
  );
}

export function canExpandArea(node: { area_expandable: boolean, target: string }, areaSlug: string, cases: any[]): { canExpand: boolean, type: 'AREA-CASE' | 'AREA-SERVICE', reason: string | null } {
  if (!node.area_expandable) {
    return { canExpand: false, type: 'AREA-SERVICE', reason: '노드가 지역 확장 대상 아님' };
  }
  
  const targetCases = cases.filter(c => c.area === areaSlug && c.target === node.target);
  
  if (targetCases.length === 0) {
    return { canExpand: true, type: 'AREA-SERVICE', reason: '해당 지역 실제 CASE 없음 (안내형 페이지로 확장)' };
  }
  
  return { canExpand: true, type: 'AREA-CASE', reason: null };
}
