import fs from 'fs';
import path from 'path';

let _contentTypes: any = null;
let _modules: any = null;

let _ctMap: Map<string, any> | null = null;
let _ctData: any = null;

export function getContentTypes() {
  if (_ctData) return _ctData;
  const p = path.resolve(process.cwd(), 'data/content-types.json');
  _ctData = JSON.parse(fs.readFileSync(p, 'utf-8'));
  
  _ctMap = new Map();
  for (const ct of _ctData.content_types) {
    _ctMap.set(ct.code, ct);
  }

  // Assertion: Check that CT1 to CT6 all exist
  for (let i = 1; i <= 6; i++) {
    const code = `CT${i}`;
    if (!_ctMap.has(code)) {
      throw new Error(`Critical Error: Content type ${code} is missing from data/content-types.json`);
    }
  }

  return _ctData;
}

export function getModules() {
  if (_modules) return _modules;
  const p = path.resolve(process.cwd(), 'data/modules.json');
  _modules = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return _modules;
}

export function getCTMatrix(ct: string) {
  getContentTypes(); // ensure it's loaded
  const data = _ctMap?.get(ct);
  if (!data) return undefined;
  
  return {
    required: data.required || [],
    required_alternatives: data.required_alternatives || [],
    optional: data.optional || [],
    default_order: data.default_order || [],
    fallback_ct: data.fallback_ct,
    min_compare_items: data.min_compare_items
  };
}

export function getGlobalRules() {
  const data = getContentTypes();
  return {
    promotion_rules: data.promotion_rules,
    intent_to_ct: data.intent_to_ct,
    diff_score_weights: data.diff_score_weights,
    decision_thresholds: data.decision_thresholds
  };
}
