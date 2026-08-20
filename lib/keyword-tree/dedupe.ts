import crypto from 'crypto';

// Synonyms map from taxonomy.md §5
const SYNONYMS: Array<[RegExp, string]> = [
  [/화장실|샤워실/g, '욕실'],
  [/싱크대(?!\s*상판)/g, '주방'],
  [/현관/g, '현관·출입문'],
  [/발코니/g, '베란다'],
  [/도어프레임|문틀재|문선/g, '문틀'],
  [/방문|실내문|목도어/g, '방문·문짝'],
  [/강화유리문|유리문|통유리문/g, '강화도어'],
  [/현관문|세대현관문/g, '방화문·현관문'],
  [/인조대리석|인조대리석상판/g, '싱크대 상판'],
  [/샤시|새시|창틀/g, '창호'],
  [/플로어힌지|바닥힌지|후로아힌지/g, '플로어힌지'],
  [/피벗힌지|피봇힌지/g, '피벗힌지'],
  [/상롯트|상부힌지|어퍼힌지/g, '상부힌지'],
  [/도어체크|도어클로저|클로저/g, '도어클로저'],
  [/부식|삭음|곰팡이썩음/g, '썩음'],
  [/새깅|늘어짐|주저앉음/g, '처짐'],
  [/끌림|바닥긁힘|문끌림/g, '바닥 끌림'],
  [/크랙|금감|갈라짐/g, '크랙'],
  [/들뜸|뜸|벌어짐/g, '들뜸'],
  [/탈락|떨어짐/g, '탈락'],
  [/누수|물샘|물새는/g, '누수'],
];

export function normalize(text: string): string {
  let s = text;
  
  for (const [regex, replacement] of SYNONYMS) {
    s = s.replace(regex, replacement);
  }

  // 조사 제거 (한국어 어절 끝)
  s = s.replace(/(이|가|은|는|을|를|의|에|에서|으로|로)(?=\s|$|[^\p{L}\p{N}])/gu, '');
  
  // 접미 제거
  s = s.replace(/(하는법|하는방법|방법|추천|업체|잘하는곳)/g, '');
  
  // 공백 및 특수문자 제거 (한글/영문/숫자만 남김)
  s = s.replace(/[^\p{L}\p{N}]+/gu, '');
  
  return s;
}

export function dedupeKey(query: string, ct: string, modules: string[]): string {
  const norm = normalize(query);
  const sortedModules = [...modules].sort().join(',');
  const raw = `${norm}|${ct}|${sortedModules}`;
  
  return crypto.createHash('sha1').update(raw).digest('hex').substring(0, 16);
}
