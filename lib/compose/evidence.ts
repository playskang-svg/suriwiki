export function evidenceStrength(moduleCode: string, caseData: any): { score: number, isValid: boolean, field: string | null } {
  // According to checklist.md:
  // 비어 있음: 0.0
  // 한 문장 이하 단편: 0.3
  // 구체적 서술 (수치, 부위, 조건 포함): 0.7
  // 서술 + 사진 근거: 1.0
  // For implementation, we will use length and keywords as a simple heuristic 

  const map: Record<string, string[]> = {
    'M01': ['problem', 'judgement'],
    'M03': ['problem'],
    'M04': ['cause'],
    'M05': ['judgement'],
    'M06': ['judgement'],
    'M07': ['judgement'],
    'M08': ['work_steps'],
    'M09': ['cause', 'judgement'],
    'M10': ['work_steps'],
    'M11': ['materials'],
    'M12': ['tools'],
    'M13': ['materials'],
    'M14': ['duration_note'], // proxy for cost/duration
    'M15': ['work_steps'],
    'M16': ['safety_flags'],
    'M17': ['maintenance'],
    'M18': ['result', 'limit_note'],
    'M19': ['problem', 'result'],
    'M20': ['problem', 'result'], // images are checked separately
    'M23': ['area'],
  };

  const fields = map[moduleCode] || [];
  if (fields.length === 0) return { score: 1.0, isValid: true, field: null }; // Default for generic modules

  let bestScore = 0.0;
  let bestField = null;

  for (const f of fields) {
    const val = caseData[f];
    let s = 0.0;
    if (!val || (Array.isArray(val) && val.length === 0)) {
      s = 0.0;
    } else if (typeof val === 'string' && val.length < 15) {
      s = 0.3;
    } else if (Array.isArray(val) && val.length > 0) {
      s = 0.7; // array like work_steps
    } else if (typeof val === 'string' && val.length >= 15) {
      s = 0.7;
    } else if (typeof val === 'object' && val !== null) {
       s = 0.7; // area object
    }
    
    // Simplification for photos: if there are case images, assume 1.0 if score was 0.7
    if (s === 0.7 && caseData.images && caseData.images.length > 0) {
      s = 1.0;
    }

    if (s > bestScore) {
      bestScore = s;
      bestField = f;
    }
  }

  return { score: bestScore, isValid: bestScore >= 0.3, field: bestField };
}
