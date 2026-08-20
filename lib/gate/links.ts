import { GateResult } from './facts';
import { PageContext } from '../schemas/page-context';

export function checkLinks(pageContext: PageContext): GateResult {
  const violations: { code: string, message: string, hint: string }[] = [];
  const notes: { code: string, message: string }[] = [];

  // L1: 내부링크 3~8개
  // 상한만 위반으로 본다. 하한을 위반으로 두면 링크할 실제 페이지가 부족할 때
  // 빈 페이지를 만들어 링크를 채우게 된다(실제로 dummy 페이지 3건이 그렇게 생겼다).
  // S3(R1)와 같은 판단이다 — 억지로 채우지 않는다.
  const linkCount = pageContext.internal_links?.length || 0;
  if (linkCount > 8) {
    violations.push({ code: 'L1', message: '내부링크 초과', hint: '8개 이하로 조정' });
  } else if (linkCount < 3) {
    notes.push({ code: 'L1', message: `내부링크 ${linkCount}개 — 링크할 실제 페이지가 그만큼임(정상)` });
  }

  // L2: 고아 페이지 금지
  if (pageContext.has_parent_link === false) {
      violations.push({ code: 'L2', message: '고아 페이지', hint: '상위 TOPIC/AREA에서 들어오는 링크 필요' });
  }

  // L3: title 30~45, desc 70~120
  const title = pageContext.title || '';
  if (title.length > 0 && (title.length < 30 || title.length > 45)) {
     violations.push({ code: 'L3', message: 'title 길이 위반 (30~45자)', hint: '길이 조정' });
  }
  const desc = pageContext.meta_description || '';
  if (desc.length > 0 && (desc.length < 70 || desc.length > 120)) {
     violations.push({ code: 'L3', message: 'description 길이 위반 (70~120자)', hint: '길이 조정' });
  }

  // Parse HTML body for L4, L5, L6, L7
  if (pageContext.html_body) {
      // Basic HTML parsing to avoid dependency issues if cheerio is not installed, 
      // but instruction says "html_body"
      // L4: h1 1개
      const h1Count = (pageContext.html_body.match(/<h1\b[^>]*>/g) || []).length;
      if (h1Count !== 1) {
          violations.push({ code: 'L4', message: 'h1 태그 개수 위반', hint: `현재 ${h1Count}개, 1개여야 함` });
      }

      // L5: 모든 이미지 alt 존재
      const imgTags = pageContext.html_body.match(/<img\b[^>]*>/g) || [];
      const imgWithoutAlt = imgTags.filter(tag => !/alt\s*=\s*(["'])(.*?)\1/.test(tag) || /alt\s*=\s*(["'])\s*\1/.test(tag));
      if (imgWithoutAlt.length > 0) {
          violations.push({ code: 'L5', message: '이미지 alt 누락', hint: '모든 img 태그에 의미 있는 alt 속성 필요' });
      }

      // L6: FAQPage JSON-LD 와 화면 불일치
      // If we have json_ld for FAQ, and M21 items
      if (pageContext.json_ld?.includes('FAQPage') && pageContext.m21?.items) {
          // Just check if the number of Question matches M21 items length
          const qCount = (pageContext.json_ld.match(/"@type"\s*:\s*"Question"/g) || []).length;
          if (qCount !== pageContext.m21.items.length) {
             violations.push({ code: 'L6', message: 'FAQ 마크업 불일치', hint: `JSON-LD(${qCount}) 와 M21.items(${pageContext.m21.items.length}) 다름` });
          }
      }
      
      // L7: AggregateRating/Review 금지
      if (pageContext.html_body.includes('AggregateRating') || pageContext.html_body.includes('Review')) {
          violations.push({ code: 'L7', message: '후기/평점 마크업 포함', hint: '마크업에서 Review 제거' });
      }
  }

  return { pass: violations.length === 0, violations, notes };
}
