/**
 * lib/content.ts
 * ------------------------------------------------------------------------
 * DB 템플릿 문자열의 {region}/{keyword}/{phone} 변수를 실제 텍스트로 치환하고,
 * 최종 노출 텍스트(<title>, <meta description>, H1/H2/H3)에 섞여 들어올 수 있는
 * "블로그제목:" 같은 라벨 접두사·따옴표를 제거해 순수한 텍스트만 남긴다.
 * (요구사항 1-2: title/description에 불필요한 접두사가 절대 섞이면 안 됨)
 * ------------------------------------------------------------------------
 */

export interface TemplateVars {
  region: string
  keyword: string
  phone: string
}

const TEMPLATE_VAR_RE = /\{(region|keyword|phone)\}/g

/** {region} {keyword} {phone}만 치환한다. 매칭 안 되는 {변수}는 그대로 남겨 오타를 조기에 발견할 수 있게 한다. */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(TEMPLATE_VAR_RE, (_match, key: keyof TemplateVars) => vars[key])
}

// 블로그 원고를 DB에 그대로 복붙할 때 흔히 딸려오는 라벨 접두사들 ("블로그제목: ...", "메타설명: ..." 등).
const LABEL_PREFIX_RE =
  /^\s*(블로그\s*제목|포스팅\s*제목|글\s*제목|제목|타이틀|메타\s*설명|설명|title|description)\s*[:：]\s*/i
const WRAPPING_QUOTES_RE = /^["'“”‘’]+|["'“”‘’]+$/g

/** title/description/heading 등 "최종 노출 텍스트"에는 항상 이걸 통과시킨다. */
export function sanitizeGeneratedText(input: string | null | undefined): string {
  if (!input) return ''
  return input.replace(LABEL_PREFIX_RE, '').replace(WRAPPING_QUOTES_RE, '').replace(/\s+/g, ' ').trim()
}

/** 본문 body_template을 빈 줄(\n\n) 기준으로 문단 분리. 빈 문단은 제거.
 *  DB에 실제 줄바꿈 대신 "\n\n"이라는 두 글자(백슬래시+n)가 그대로 들어오는
 *  경우가 있다 — SQL 문자열 리터럴은 백슬래시를 이스케이프로 처리하지 않아서,
 *  작성 과정에서 실제 줄바꿈이 문자 그대로의 "\n"으로 바뀌어 저장될 수 있다.
 *  화면에 "\n"이 글자 그대로 노출되는 걸 막기 위해 먼저 실제 줄바꿈으로 정규화한다. */
export function splitParagraphs(text: string): string[] {
  return text
    .replace(/\\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}
