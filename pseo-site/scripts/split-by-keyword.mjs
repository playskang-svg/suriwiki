/**
 * scripts/split-by-keyword.mjs
 * ------------------------------------------------------------------------
 * next build가 만든 통합 out/ 한 벌을, 키워드별로 out-{slug}/ 여러 벌로 나눈다.
 *
 * 왜 필요한가: Cloudflare Pages 무료 플랜은 배포 1건당 파일 2만 개 제한이 있다.
 * 7개 키워드 × 전국 읍/면/동까지 발행하니 out/ 전체가 약 8만 개 파일이 되어
 * 한 프로젝트로는 배포 자체가 거부된다(2026-08-14 실제 확인: "Pages only
 * supports up to 20,000 files in a deployment for your current plan").
 *
 * 그래서 키워드마다 별도 Cloudflare Pages 프로젝트에 나눠 배포하기로 했다.
 * URL 구조상 키워드가 이미 경로 맨 앞 세그먼트라({keyword}/{region...}) 이
 * 경계로 자르는 게 가장 자연스럽고, 페이지당 파일 수가 고르게 나뉜다
 * (약 11,000~12,000개/샤드로 2만 개 한도 안에 여유 있게 들어간다).
 *
 * next build를 7번 다시 돌리지 않는다 — 대신 딱 1번 통합 빌드해서 모든
 * cross-keyword 링크/canonical/OG메타/sitemap이 lib/constants.ts의
 * KEYWORD_SITE_URL 기준으로 "정확한" 절대 URL을 갖게 만든 다음, 이미 완성된
 * out/ 파일들을 폴더째로 재배치(mv)만 한다. 빠르고, 소스 레벨에서 정확하다
 * (빌드 결과물을 사후에 sed로 패치하는 방식은 Next 하이드레이션 시 클라이언트가
 * 갖고 있는 원래 RSC payload(.txt)로 href가 되돌아갈 위험이 있어 채택하지 않음).
 *
 * 루트 키워드(ROOT_KEYWORD, 지금은 "도배장판")는 옮기지 않고 out/ 자체에 홈페이지와
 * 함께 그대로 남는다 — 기존 suriwiki-pseo 프로젝트가 계속 그 역할을 한다.
 *
 * 실행 순서: npm run build (통합 빌드) → node scripts/split-by-keyword.mjs
 * ------------------------------------------------------------------------
 */
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, cpSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')
const OUT_DIR = join(ROOT_DIR, 'out')

// next build를 거치지 않는 순수 node 스크립트라 Next의 자동 .env 로딩이 안 된다 —
// generate-sitemap.mjs와 같은 이유로 직접 읽는다. 이걸 빼먹으면 NEXT_PUBLIC_SITE_URL이
// undefined가 되어 SITE_URL이 기본값(example-pseo.pages.dev)으로 잘못 계산되고, 그
// 결과 루트(out/) sitemap.xml이 도메인 불일치로 빈 채 만들어진다(2026-08-14 실제로
// 이 버그로 out/sitemap.xml·robots.txt가 깨진 적 있음 — deploy-all.mjs도 같은 실수
// 를 했었다).
function loadDotEnvLocal() {
  try {
    const text = readFileSync(join(ROOT_DIR, '.env.local'), 'utf-8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
    }
  } catch {
    // .env.local이 없으면(예: CI 환경변수로 주입) 그냥 넘어간다
  }
}
loadDotEnvLocal()

// lib/constants.ts의 KEYWORD_SITE_URL과 반드시 같은 내용으로 유지할 것(순수 node 스크립트라
// import 별칭을 못 씀 — generate-sitemap.mjs와 같은 이유·같은 패턴).
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://example-pseo.pages.dev').replace(/\/$/, '')
const ROOT_KEYWORD = '도배장판'
const KEYWORD_SITE_URL = {
  도배장판: SITE_URL,
  도배업체: 'https://suriwiki-pseo-dobae-eopche.pages.dev',
  아파트도배: 'https://suriwiki-pseo-apateu-dobae.pages.dev',
  벽지: 'https://suriwiki-pseo-byeokji.pages.dev',
  장판: 'https://suriwiki-pseo-jangpan.pages.dev',
  도배가격: 'https://suriwiki-pseo-dobae-gagyeok.pages.dev',
  도배비용: 'https://suriwiki-pseo-dobae-biyong.pages.dev',
}

/** https://suriwiki-pseo-dobae-eopche.pages.dev → out-dobae-eopche (폴더명/프로젝트명용) */
function shardDirName(url) {
  const host = new URL(url).hostname // suriwiki-pseo-dobae-eopche.pages.dev
  const slug = host.replace(/\.pages\.dev$/, '').replace(/^suriwiki-pseo-?/, '')
  return `out-${slug || 'root'}`
}

/** Cloudflare Pages 프로젝트명(위와 동일 규칙, "out-" 대신 "suriwiki-pseo-" 접두어) */
function projectName(url) {
  return new URL(url).hostname.replace(/\.pages\.dev$/, '')
}

const SHARED_ENTRIES = ['_next', 'fonts', 'bg_images', '_headers', '404.html']

function copyShared(destDir) {
  for (const entry of SHARED_ENTRIES) {
    const src = join(OUT_DIR, entry)
    if (existsSync(src)) cpSync(src, join(destDir, entry), { recursive: true })
  }
}

function moveIfExists(src, dest) {
  if (existsSync(src)) {
    mkdirSync(dirname(dest), { recursive: true })
    renameSync(src, dest)
  }
}

/** 통합 sitemap.xml에서 특정 도메인(loc이 그 도메인으로 시작하는) 항목만 골라 새 sitemap.xml 문자열을 만든다. */
function filterSitemap(fullSitemapXml, domain) {
  const lines = fullSitemapXml.split('\n')
  const urlLines = lines.filter((line) => line.includes('<url>') && line.includes(`<loc>${domain}`))
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urlLines.join('\n') +
    `\n</urlset>\n`
  )
}

function main() {
  if (!existsSync(OUT_DIR)) {
    console.error('[split-by-keyword] out/ 디렉터리가 없습니다. 먼저 npm run build를 실행하세요.')
    process.exit(1)
  }

  const fullSitemap = readFileSync(join(OUT_DIR, 'sitemap.xml'), 'utf-8')
  const nonRootKeywords = Object.keys(KEYWORD_SITE_URL).filter((k) => k !== ROOT_KEYWORD)
  const createdShards = []

  for (const keyword of nonRootKeywords) {
    const domain = KEYWORD_SITE_URL[keyword]
    const shardDir = join(ROOT_DIR, shardDirName(domain))
    rmSync(shardDir, { recursive: true, force: true })
    mkdirSync(shardDir, { recursive: true })

    copyShared(shardDir)
    moveIfExists(join(OUT_DIR, keyword), join(shardDir, keyword))
    moveIfExists(join(OUT_DIR, `${keyword}.html`), join(shardDir, `${keyword}.html`))
    moveIfExists(join(OUT_DIR, `${keyword}.txt`), join(shardDir, `${keyword}.txt`))
    moveIfExists(join(OUT_DIR, 'api', 'og', keyword), join(shardDir, 'api', 'og', keyword))

    writeFileSync(join(shardDir, 'sitemap.xml'), filterSitemap(fullSitemap, domain), 'utf-8')
    writeFileSync(join(shardDir, 'robots.txt'), `User-Agent: *\nAllow: /\n\nSitemap: ${domain}/sitemap.xml\n`, 'utf-8')

    createdShards.push({ keyword, domain, dir: shardDir, project: projectName(domain) })
    console.log(`[split-by-keyword] ${keyword} → ${shardDir} (project: ${projectName(domain)})`)
  }

  // 루트(out/)에는 이제 홈페이지 + 도배장판만 남아있다 — sitemap/robots도 그 범위로 다시 쓴다.
  writeFileSync(join(OUT_DIR, 'sitemap.xml'), filterSitemap(fullSitemap, SITE_URL), 'utf-8')
  writeFileSync(join(OUT_DIR, 'robots.txt'), `User-Agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, 'utf-8')

  console.log('\n[split-by-keyword] 완료. 배포 대상:')
  console.log(`  out/  → suriwiki-pseo (루트, 홈 + ${ROOT_KEYWORD})`)
  for (const s of createdShards) console.log(`  ${shardDirName(s.domain)}/  → ${s.project} (${s.keyword})`)
}

main()
