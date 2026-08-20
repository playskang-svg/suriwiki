import { describe, it, expect } from 'vitest';
import { checkFacts } from '../lib/gate/facts';
import { checkStructure } from '../lib/gate/structure';
import { checkDedupe } from '../lib/gate/dedupe';
import { checkLinks } from '../lib/gate/links';
import { PageContext } from '../lib/schemas/page-context';
import { canExpandArea } from '../lib/keyword-tree/scoring';

describe('Quality Gate Rules', () => {
  // Helpers
  const createMockContext = (overrides: Partial<PageContext>): PageContext => {
    return {
       // defaults that pass
       content_type: 'CT3',
       page_type: 'TOPIC',
       internal_links: ['a','b','c'],
       title: '123456789012345678901234567890', // 30 chars
       meta_description: '1234567890123456789012345678901234567890123456789012345678901234567890', // 70 chars
       has_parent_link: true,
       html_body: '<h1>Title</h1> <img src="1.jpg" alt="test"/>',
       ...overrides
    } as PageContext;
  };

  describe('Facts', () => {
    it('F1: 지역 CASE 없는데 사례 모듈(M08) 쓰면 실패', () => {
       const ctx = createMockContext({ 
         page_type: 'AREA', 
         keyword_node: { area_slug: 'invalid_area' },
         m08: { steps: [] }
       });
       const res = checkFacts(ctx);
       expect(res.violations.some(v => v.code === 'F1')).toBe(true);
    });
    
    it('F1: 지역 CASE 없어도 서비스 안내 모듈만 쓰면 통과 (AREA-SERVICE)', () => {
       const ctx = createMockContext({ 
         page_type: 'AREA', 
         keyword_node: { area_slug: 'invalid_area' },
         module_order: ['M01'],
         html_body: '수리 안내'
       });
       const res = checkFacts(ctx);
       expect(res.violations.some(v => v.code === 'F1')).toBe(false);
    });
    
    it('F1: 지역 CASE 있으면 사례 모듈 써도 통과 (AREA-CASE)', () => {
       const ctx = createMockContext({ 
           page_type: 'AREA', 
           keyword_node: { area_slug: 'busan_nam' },
           all_areas: [{ slug: 'busan_nam', parent_slug: 'busan' }],
           all_cases: [{ area_slug: 'busan_nam' }],
           module_order: ['M08']
       });
       const res = checkFacts(ctx);
       expect(res.violations.some(v => v.code === 'F1')).toBe(false);
    });

    it('F2: M14 금액 표시시 disclaimer 없으면 실패', () => {
       const ctx = createMockContext({ m14: { amounts: [1000] } });
       const res = checkFacts(ctx);
       expect(res.violations.some(v => v.code === 'F2')).toBe(true);
    });

    it('F2: M14 금액 표시시 disclaimer 있으면 통과', () => {
       const ctx = createMockContext({ m14: { amounts: [1000], disclaimer: '참고' } });
       const res = checkFacts(ctx);
       expect(res.violations.some(v => v.code === 'F2')).toBe(false);
    });
  });

  describe('Structure', () => {
    it('S2: 필수 모듈 누락시 실패', () => {
       const ctx = createMockContext({ content_type: 'CT1', module_order: ['M01'] }); // missing M03, M04, M09
       const res = checkStructure(ctx);
       expect(res.violations.some(v => v.code === 'S2')).toBe(true);
    });
    it('S2: 필수 모듈 존재 및 증거 충분시 통과', () => {
       const ctx = createMockContext({ 
           content_type: 'CT1', 
           module_order: ['M01', 'M03', 'M04', 'M09'], 
           case: { problem: 'a', judgement: 'b', work_steps: [{order:1,title:'c'}], result: 'd', cause: 'x', cause_observed: true } 
       });
       const res = checkStructure(ctx);
       expect(res.violations.some(v => v.code === 'S2')).toBe(false);
    });
    it('S3/R1: 옵션 모듈 1개짜리가 차단되지 않는다', () => {
       const ctx = createMockContext({ 
           content_type: 'CT1', 
           module_order: ['M01', 'M03', 'M04', 'M09', 'M10'], 
           case: { problem: 'a', judgement: 'b', work_steps: [{order:1,title:'c'}], result: 'd', cause: 'x', cause_observed: true } 
       });
       const res = checkStructure(ctx);
       expect(res.violations.some(v => v.code === 'S3')).toBe(false);
    });
  });

  describe('Dedupe', () => {
    it('D4: FAQ 유사도 높은 반례 차단 테스트 (모든 페이지 동일 FAQ)', () => {
       const ctx = createMockContext({ faq_similarity_max: 0.90 });
       const res = checkDedupe(ctx as any);
       expect(res.violations.some(v => v.code === 'D4')).toBe(true);
    });
    
    it('D5: 원본 이미지 Jaccard 중복시 차단', () => {
       const ctx = createMockContext({ 
          image_variants: [{ id: '1', image_id: 'img_123' }, { id: '2', image_id: 'img_124' }],
          existing_pages: [{ id: 'other', image_variants: [{ id: '3', image_id: 'img_123' }, { id: '4', image_id: 'img_124' }] }] 
       });
       const res = checkDedupe(ctx as any);
       expect(res.violations.some(v => v.code === 'D5')).toBe(true);
    });
  });

  describe('Links', () => {
    it('L4: h1이 여러개면 실패', () => {
       const ctx = createMockContext({ html_body: '<h1>T1</h1><h1>T2</h1>' });
       const res = checkLinks(ctx);
       expect(res.violations.some(v => v.code === 'L4')).toBe(true);
    });
    it('L4: h1이 1개면 통과', () => {
       const ctx = createMockContext({ html_body: '<h1>T1</h1>' });
       const res = checkLinks(ctx);
       expect(res.violations.some(v => v.code === 'L4')).toBe(false);
    });
  });

  describe('Keyword Tree (R3)', () => {
    it('R3: canExpandArea 판정이 F1 통과 조건과 일치해야 함', () => {
       // CASE가 없는 경우 AREA-SERVICE로 확장 가능해야 함 (F1 일치)
       const res1 = canExpandArea({ area_expandable: true, target: 'a' }, 'seoul', []);
       expect(res1.canExpand).toBe(true);
       expect(res1.type).toBe('AREA-SERVICE');
       
       // CASE가 있는 경우 AREA-CASE로 확장 가능해야 함
       const res2 = canExpandArea({ area_expandable: true, target: 'a' }, 'seoul', [{ area: 'seoul', target: 'a' }]);
       expect(res2.canExpand).toBe(true);
       expect(res2.type).toBe('AREA-CASE');
    });
  });
});
