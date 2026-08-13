/**
 * scripts/publish-nationwide-listings.mjs
 * ------------------------------------------------------------------------
 * 활성 키워드 전부 × 전국 시/도+시/군/구(245개) 조합을 pseo_page_listings에
 * 발행 등록한다. 이미 등록된 조합(keyword_id+region_id)은 건드리지 않고
 * 건너뛴다 — 몇 번을 다시 실행해도 안전하다(멱등).
 *
 * DONG/APT(불당동 등 실제 서비스 지역 하위 상세)는 대상에서 제외한다 —
 * 이 스크립트는 SIDO/SIGUNGU 레벨(전국 커버리지 용도)만 다룬다.
 *
 * 실행: node --env-file=.env.local scripts/publish-nationwide-listings.mjs
 * ------------------------------------------------------------------------
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다.')
  process.exit(1)
}
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

const BATCH_SIZE = 500

async function fetchAll(table, columns) {
  const { data, error } = await admin.from(table).select(columns)
  if (error) throw new Error(`[${table} 조회 실패] ${error.message}`)
  return data
}

async function main() {
  const [keywords, regions, existingListings] = await Promise.all([
    fetchAll('pseo_keywords', 'id, slug, is_active'),
    fetchAll('pseo_regions', 'id, type'),
    fetchAll('pseo_page_listings', 'keyword_id, region_id'),
  ])

  const activeKeywords = keywords.filter((k) => k.is_active)
  const targetRegions = regions.filter((r) => r.type === 'SIDO' || r.type === 'SIGUNGU')
  const existingSet = new Set(existingListings.map((l) => `${l.keyword_id}:${l.region_id}`))

  console.log(`키워드 ${activeKeywords.length}개 × 지역(SIDO/SIGUNGU) ${targetRegions.length}개 = 최대 ${activeKeywords.length * targetRegions.length}조합`)
  console.log(`기존 등록 ${existingListings.length}건`)

  const toInsert = []
  for (const keyword of activeKeywords) {
    for (const region of targetRegions) {
      const key = `${keyword.id}:${region.id}`
      if (!existingSet.has(key)) {
        toInsert.push({ keyword_id: keyword.id, region_id: region.id })
      }
    }
  }

  console.log(`새로 추가할 조합: ${toInsert.length}건\n`)

  let done = 0
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)
    const { error } = await admin.from('pseo_page_listings').insert(batch)
    if (error) throw new Error(`[배치 ${i / BATCH_SIZE + 1} 실패] ${error.message}`)
    done += batch.length
    console.log(`  ${done}/${toInsert.length}건 등록 완료`)
  }

  console.log(`\n완료 — 총 ${toInsert.length}건 신규 발행 등록`)
}

main().catch((err) => {
  console.error('\n중단:', err.message)
  process.exit(1)
})
