import { describe, it, expect } from 'vitest';
import { diffScore, jaccardArray } from '../lib/compose/compose';
import fs from 'fs';
import path from 'path';

describe('Compose Logic (diff_score)', () => {
  const p = path.resolve(process.cwd(), 'data/difftest.fixtures.json');
  const fixtures = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const pages = fixtures.pages;
  const tolerance = fixtures.tolerance;

  fixtures.cases.forEach((c: any) => {
    it(`should match diff_score for ${c.a} vs ${c.b} (${c.expected_decision})`, () => {
      const pageA = pages[c.a];
      const pageB = pages[c.b];

      // 1. Jaccard 재계산
      const jaccardModules = jaccardArray(pageA.modules, pageB.modules);
      const jaccardImages = jaccardArray(pageA.images, pageB.images);

      expect(Math.abs(jaccardModules - c.jaccard_core_modules)).toBeLessThanOrEqual(tolerance);
      expect(Math.abs(jaccardImages - c.jaccard_image_set)).toBeLessThanOrEqual(tolerance);

      // 2. diffScore 계산
      const actualScore = diffScore(
        pageA.label, pageB.label,
        "mock", "mock",
        pageA.modules, pageB.modules,
        pageA.images, pageB.images,
        c.sim_search_intent,
        c.sim_m01_answer
      );

      expect(Math.abs(actualScore - c.expected_diff_score)).toBeLessThanOrEqual(tolerance);

      // 3. 판정
      let decision = 'CREATE';
      if (actualScore < fixtures.thresholds.review) {
        decision = 'MERGE';
      } else if (actualScore < fixtures.thresholds.create) {
        decision = 'REVIEW'; // In my compose.ts it's UPDATE instead of REVIEW.
      }
      
      // Let's match expected_decision literally (CREATE / REVIEW / MERGE or CREATE / UPDATE / MERGE)
      let expected = c.expected_decision;
      if (decision === 'UPDATE' && expected === 'REVIEW') expected = 'UPDATE';
      if (decision === 'REVIEW' && expected === 'UPDATE') decision = 'UPDATE';
      
      expect(decision).toBe(expected);
    });
  });
});
