import { PageContext } from '../schemas/page-context';
import fs from 'fs';
import path from 'path';

export type GateResult = { 
  pass: boolean; 
  violations: { code: string, message: string, hint: string }[];
  notes?: { code: string, message: string }[];
};

export function checkFacts(pageContext: PageContext): GateResult {
  const violations: { code: string, message: string, hint: string }[] = [];
  const notes: { code: string, message: string }[] = [];
  
  // F1: AREA-CASE 와 AREA-SERVICE 구분 로직
  if (pageContext.page_type === 'AREA-CASE' || pageContext.page_type === 'AREA-SERVICE' || pageContext.page_type === 'AREA') {
    const cases = pageContext.all_cases || [];
    const areas = pageContext.all_areas || [];
    
    // Check if the area matches exactly or is a parent of the case's area
    const checkAreaMatch = (caseAreaSlug: string, targetAreaSlug: string): boolean => {
        if (caseAreaSlug === targetAreaSlug) return true;
        const caseAreaObj = areas.find(a => a.slug === caseAreaSlug);
        if (caseAreaObj && caseAreaObj.parent_slug) {
            return checkAreaMatch(caseAreaObj.parent_slug, targetAreaSlug);
        }
        return false;
    };

    const hasCase = cases.some((c: any) => {
        if (!c.area_slug) {
            if (c.area && c.area.slug) return checkAreaMatch(c.area.slug, pageContext.keyword_node!.area_slug!);
            return false;
        }
        return checkAreaMatch(c.area_slug, pageContext.keyword_node!.area_slug!);
    });
    
    if (pageContext.page_type === 'AREA-CASE') {
        if (!hasCase) {
           violations.push({ code: 'F1', message: 'CASE 없는 지역에 AREA-CASE 생성', hint: 'CASE가 없으므로 AREA-SERVICE로 생성해야 함' });
        }
    } else if (pageContext.page_type === 'AREA-SERVICE' || (pageContext.page_type === 'AREA' && !hasCase)) {
        // AREA-SERVICE 인데 사진/전후비교(M08, M11 등) 모듈이 쓰였거나 텍스트 주장
        if (pageContext.m08 || pageContext.m11) {
           violations.push({ code: 'F1', message: 'AREA-SERVICE 에 사례/전후 비교 노출', hint: 'CASE 사진 모듈(M08 등) 사용 금지' });
        }
        const bodyText = pageContext.html_body || '';
        if (bodyText.includes('시공 사례') || bodyText.includes('전후 비교')) {
           violations.push({ code: 'F1', message: 'AREA-SERVICE 에 시공 사례 문구 포함', hint: '사례 주장 금지' });
        }
    }
  }

  // F2: M14.amounts 단정 (disclaimer 없음), 본문 숫자 단정
  if (pageContext.m14?.amounts) {
    if (!pageContext.m14.disclaimer) {
      violations.push({ code: 'F2', message: '비용(M14) 면책 조항(disclaimer) 누락', hint: 'disclaimer 추가 필수' });
    }
  }
  const bodyText = pageContext.html_body || '';
  if (/[0-9,]+\s*(원|만원)/.test(bodyText) && !pageContext.m14?.amounts) {
      violations.push({ code: 'F2', message: '근거 없는 비용 명시', hint: '숫자+원/만원 패턴 발견. 본문 비용 단정 금지' });
  }

  // F3: AggregateRating/Review 가짜 생성
  const jsonLd = pageContext.json_ld || '';
  if (jsonLd.includes('AggregateRating') || jsonLd.includes('Review') || jsonLd.includes('reviewCount')) {
    violations.push({ code: 'F3', message: '가짜 리뷰/평점 마크업', hint: 'Review/AggregateRating 마크업 제거' });
  }
  if (bodyText.includes('AggregateRating') || bodyText.includes('Review')) {
    violations.push({ code: 'F3', message: '가짜 리뷰/평점 노출', hint: '화면에 리뷰/평점 표시 금지' });
  }
  if (!pageContext.siteConfig?.stats || pageContext.siteConfig.stats.length === 0) {
      // If stats is empty but we see numbers like "건의 시공"
      if (/[0-9,]+건의 시공/.test(bodyText)) {
          violations.push({ code: 'F3', message: '근거 없는 수치(stats) 렌더', hint: 'siteConfig.stats 없이 통계 렌더 금지' });
      }
  }

  // F4: 항목 대응 (M08, M11, M12, M18)
  if (pageContext.m08?.steps && pageContext.case?.work_steps) {
      // length check is S6, here we just check if m08 exists without case field
      // covered by S2 mostly, but instruction says "대응하는 case 필드에 없으면 위반"
      if (!pageContext.case.work_steps) violations.push({ code: 'F4', message: 'M08 근거 없음', hint: 'case.work_steps 필요' });
  }
  if (pageContext.m11 && !pageContext.case?.problem) violations.push({ code: 'F4', message: 'M11 근거 없음', hint: 'case.problem 필요' });
  if (pageContext.m12 && !pageContext.case?.judgement) violations.push({ code: 'F4', message: 'M12 근거 없음', hint: 'case.judgement 필요' });
  if (pageContext.m18 && !pageContext.case?.result) violations.push({ code: 'F4', message: 'M18 근거 없음', hint: 'case.result 필요' });

  // F5: overlays type 허용 목록 밖
  if (pageContext.image_variants && pageContext.image_variants.length > 0) {
    const allowed = ['arrow', 'box', 'dashed', 'callout', 'compare', 'steps'];
    let hasInvalid = false;
    for (const variant of pageContext.image_variants) {
        if (variant.overlays && Array.isArray(variant.overlays)) {
            if (variant.overlays.some(o => !allowed.includes(o.type))) {
                hasInvalid = true;
                break;
            }
        }
    }
    if (hasInvalid) {
        violations.push({ code: 'F5', message: '허용되지 않은 오버레이 타입', hint: `허용: ${allowed.join(', ')}` });
    }
  }

  // F6: 비공개 사진 체크
  if (pageContext.image_set) {
    const hasPrivate = pageContext.image_set.some((img: any) => img.is_private === true);
    if (hasPrivate) {
      violations.push({ code: 'F6', message: 'is_private=true 사진 사용됨', hint: '이미지 세트에서 제외' });
    }
  }

  // F7: 자격/면허 단정
  const certs = pageContext.siteConfig?.certifications || [];
  const certKeywords = ['국가기술자격', '기능사', '면허보유', '정식등록'];
  for (const kw of certKeywords) {
      if (bodyText.includes(kw) && !certs.some(c => c.includes(kw))) {
          violations.push({ code: 'F7', message: `자격/면허 단정 위반 (${kw})`, hint: `siteConfig.certifications 에 없는 자격 단정` });
      }
  }

  // F8: 자리표시자 + 복사 붙여넣기 탐지
  // 길이로 판정하지 않는다. 한국어는 "홀소"·"방조망"처럼 2~3자 단어가 정상이다.
  // 실제 자리표시자는 ASCII 소문자 토막("w", "p", "o1", "desc")으로 나타난다.
  const PLACEHOLDER_TOKENS = new Set([
      'desc', 'text', 'title', 'name', 'todo', 'tbd', 'n/a', 'na',
      'lorem', 'ipsum', 'string', 'value', 'sample', 'test', 'foo', 'bar',
  ]);
  const isPlaceholder = (val: string) => {
      const v = val.trim();
      if (v.length === 0) return false;      // 빈 값은 근거 없음(HOLD) 문제이지 자리표시자가 아니다
      if (/[가-힣]/.test(v)) return false;    // 한글이 있으면 실제 내용으로 본다
      if (/^[a-z]{1,3}[0-9]?$/.test(v)) return true;  // w, p, o1, abc — 대문자 약어(PVC, ABS)는 제외
      if (PLACEHOLDER_TOKENS.has(v.toLowerCase())) return true;
      return false;
  };
  const checkPlaceholders = (obj: any): boolean => {
      if (typeof obj === 'string') {
          return isPlaceholder(obj);
      } else if (Array.isArray(obj)) {
          return obj.some(checkPlaceholders);
      } else if (typeof obj === 'object' && obj !== null) {
          return Object.values(obj).some(checkPlaceholders);
      }
      return false;
  };

  // 한 모듈 본문 안에서 서로 다른 키에 동일 문자열이 반복되는지 탐지
  const OPPOSED_PAIRS = [['limits', 'improved'], ['repair_when', 'replace_when']];

  const collectStrings = (obj: any, keyPath: string, out: Map<string, Set<string>>) => {
      if (typeof obj === 'string' && obj.length > 0) {
          if (!out.has(obj)) out.set(obj, new Set());
          out.get(obj)!.add(keyPath);
      } else if (Array.isArray(obj)) {
          obj.forEach((v, i) => collectStrings(v, `${keyPath}[${i}]`, out));
      } else if (typeof obj === 'object' && obj !== null) {
          for (const [k, v] of Object.entries(obj)) {
              collectStrings(v, keyPath ? `${keyPath}.${k}` : k, out);
          }
      }
  };

  const checkDuplicateStrings = (moduleBody: any): string | null => {
      const strMap = new Map<string, Set<string>>();
      collectStrings(moduleBody, '', strMap);

      // 대립 필드쌍이 동일하면 무조건 위반
      for (const [a, b] of OPPOSED_PAIRS) {
          const aVal = moduleBody[a];
          const bVal = moduleBody[b];
          if (aVal && bVal) {
              const aStr = JSON.stringify(aVal);
              const bStr = JSON.stringify(bVal);
              if (aStr === bStr) return `대립 필드 ${a}/${b} 가 동일한 값`;
          }
      }

      // 한 오브젝트 안에서 서로 다른 키에 같은 문자열이 들어간 경우
      for (const [str, keys] of strMap) {
          if (keys.size < 2) continue;
          // 같은 배열 내 반복은 허용 (예: steps[0].title, steps[1].title)
          const uniqueFieldNames = new Set([...keys].map(k => k.replace(/\[\d+\]/g, '[]')));
          if (uniqueFieldNames.size >= 2) {
              return `"${str.substring(0, 30)}" 이(가) ${[...uniqueFieldNames].join(', ')} 에 중복`;
          }
      }
      return null;
  };

  const moduleKeys = Object.keys(pageContext).filter(k => /^m\d{2}$/.test(k));
  for (const k of moduleKeys) {
      const moduleBody = (pageContext as any)[k];
      if (checkPlaceholders(moduleBody)) {
          violations.push({ code: 'F8', message: `자리표시자 탐지 (${k})`, hint: '모듈 본문에 자리표시자 문자열(w, p, o1, desc 등)이 남아 있음' });
      }
      const dupResult = checkDuplicateStrings(moduleBody);
      if (dupResult) {
          violations.push({ code: 'F8', message: `필드 복사 탐지 (${k}): ${dupResult}`, hint: '서로 다른 의미의 필드에 동일한 문자열이 들어감' });
      }
  }

  return { pass: violations.length === 0, violations, notes };
}
