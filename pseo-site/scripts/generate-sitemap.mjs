/**
 * scripts/generate-sitemap.mjs
 * ------------------------------------------------------------------------
 * public/sitemap.xml, public/robots.txt를 빌드 "전에" 직접 정적 파일로 써낸다
 * (요청: "검색봇이 대문에서 한번에 찾고 잘 크롤링해서 반영할 수 있게 사이트맵
 * 정보도 반영해줘"). output:'export'는 public/ 안 파일을 그대로 out/에 복사하므로,
 * next build가 끝나면 자동으로 최종 결과물에 포함된다.
 *
 * ⚠️ Next.js 내장 sitemap.ts + generateSitemaps()는 output:'export'와 조합했을 때
 * 실제로 시도해보니 버그가 있었다(루트 sitemap.xml이 안 만들어지거나 "id" 관련
 * 빌드 에러 — vercel/next.js #77304, #61969). 그래서 프레임워크 컨벤션 대신 이렇게
 * 직접 생성하는 방식으로 우회한다 — 더 단순하고, 이 프로젝트 버전에서 실제로 동작이
 * 확인된 방법이다.
 *
 * package.json의 build 스크립트가 `node scripts/generate-sitemap.mjs && next build`
 * 순서로 이 파일을 항상 먼저 실행한다.
 *
 * 실행: node scripts/generate-sitemap.mjs   (또는 npm run build에 포함되어 자동 실행)
 * ------------------------------------------------------------------------
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '..', 'public')

// .env.local을 수동으로 읽는다 — 이 스크립트는 next build보다 먼저(순수 node로) 실행되므로
// Next.js의 자동 .env 로딩이 아직 적용되지 않은 상태다. 이미 환경변수로 주입돼 있으면
// (예: node --env-file, CI 시크릿) 그 값을 우선한다.
function loadDotEnvLocal() {
  try {
    const text = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
    }
  } catch {
    // .env.local이 없으면(예: CI 환경변수로 주입) 그냥 넘어간다
  }
}
loadDotEnvLocal()

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://example-pseo.pages.dev').replace(/\/$/, '')

// lib/constants.ts의 KEYWORD_SITE_URL과 반드시 같은 내용으로 유지할 것 — 이 스크립트는
// next build보다 먼저 도는 순수 node 스크립트라 '@/lib/constants' import 별칭을 못 쓴다.
// (배경: Cloudflare Pages 무료플랜 2만 파일/배포 제한 때문에 키워드별로 별도 프로젝트에
// 나눠 배포한다 — 자세한 사정은 lib/constants.ts 주석 참고.)
const KEYWORD_SITE_URL = {
  도배장판: SITE_URL,
  도배업체: 'https://suriwiki-pseo-dobae-eopche.pages.dev',
  아파트도배: 'https://suriwiki-pseo-apateu-dobae.pages.dev',
  벽지: 'https://suriwiki-pseo-byeokji.pages.dev',
  장판: 'https://suriwiki-pseo-jangpan.pages.dev',
  도배가격: 'https://suriwiki-pseo-dobae-gagyeok.pages.dev',
  도배비용: 'https://suriwiki-pseo-dobae-biyong.pages.dev',
}
function keywordSiteUrl(slug) {
  return KEYWORD_SITE_URL[slug] ?? SITE_URL
}
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[generate-sitemap] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다.')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })

const PAGE_SIZE = 1000
async function fetchAll(table, columns, filter) {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    let q = supabase.from(table).select(columns).range(from, from + PAGE_SIZE - 1)
    if (filter) q = filter(q)
    const { data, error } = await q
    if (error) throw new Error(`[${table}] ${error.message}`)
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return rows
}

/** lib/region-tree.ts의 getRegionPathSegments와 동일한 로직 — 이 스크립트는 Next 경로 별칭을
 *  못 써서 최소한으로 그대로 옮겨 적었다. */
function buildPathSegments(regions) {
  const byId = new Map(regions.map((r) => [r.id, r]))
  const pathCache = new Map()
  function pathOf(region) {
    if (pathCache.has(region.id)) return pathCache.get(region.id)
    const segments = region.parent_id && byId.has(region.parent_id) ? [...pathOf(byId.get(region.parent_id)), region.slug] : [region.slug]
    pathCache.set(region.id, segments)
    return segments
  }
  return { byId, pathOf }
}

async function main() {
  const [keywords, regions, listings] = await Promise.all([
    fetchAll('pseo_keywords', 'id,slug,is_active', (q) => q.eq('is_active', true)),
    fetchAll('pseo_regions', 'id,parent_id,slug'),
    fetchAll('pseo_page_listings', 'keyword_id,region_id,is_published', (q) => q.eq('is_published', true)),
  ])

  const keywordById = new Map(keywords.map((k) => [k.id, k]))
  const { byId, pathOf } = buildPathSegments(regions)

  const urls = [{ loc: SITE_URL, changefreq: 'weekly', priority: '1.0' }]

  // 키워드 허브 페이지 — 발행된 조합이 하나라도 있는 키워드만
  const publishedKeywordIds = new Set(listings.map((l) => l.keyword_id))
  for (const k of keywords) {
    if (publishedKeywordIds.has(k.id)) urls.push({ loc: `${keywordSiteUrl(k.slug)}/${k.slug}`, changefreq: 'weekly', priority: '0.8' })
  }

  // 키워드 × 지역 상세 페이지 — 키워드마다 도메인이 다를 수 있다(keywordSiteUrl).
  for (const listing of listings) {
    const keyword = keywordById.get(listing.keyword_id)
    const region = byId.get(listing.region_id)
    if (!keyword || !region) continue
    const path = pathOf(region).join('/')
    urls.push({ loc: `${keywordSiteUrl(keyword.slug)}/${keyword.slug}/${path}`, changefreq: 'monthly', priority: '0.6' })
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${escapeXml(u.loc)}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n') +
    `\n</urlset>\n`

  const robotsTxt = `User-Agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`

  writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), xml, 'utf-8')
  writeFileSync(join(PUBLIC_DIR, 'robots.txt'), robotsTxt, 'utf-8')

  console.log(`[generate-sitemap] public/sitemap.xml 작성 완료 — URL ${urls.length}개`)
  console.log(`[generate-sitemap] public/robots.txt 작성 완료`)
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

main().catch((err) => {
  console.error('[generate-sitemap] 중단:', err.message)
  process.exit(1)
})
