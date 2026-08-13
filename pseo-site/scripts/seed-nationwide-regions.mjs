/**
 * scripts/seed-nationwide-regions.mjs
 * ------------------------------------------------------------------------
 * 전국 시/도(16) + 시/군/구(229) 를 pseo_regions에 채워 넣는다.
 * 이미 있는 지역(예: 충청남도, 천안시, 아산시 — 기존 서비스 지역)은 건드리지
 * 않고 그대로 재사용하며, 없는 것만 새로 추가한다 — 몇 번을 다시 실행해도
 * 안전하다(멱등).
 *
 * 실행: node --env-file=.env.local scripts/seed-nationwide-regions.mjs
 * ------------------------------------------------------------------------
 */
import { createClient } from '@supabase/supabase-js'
import { NATIONWIDE_REGIONS, summarize } from './nationwide-regions-data.mjs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다.')
  process.exit(1)
}
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

/** slug+parent_id로 기존 행을 찾고 없으면 만든다. id를 반환. */
async function upsertRegion({ name, slug, type, parent_id, display_order }) {
  let query = admin.from('pseo_regions').select('id').eq('slug', slug).eq('type', type)
  query = parent_id ? query.eq('parent_id', parent_id) : query.is('parent_id', null)
  const { data: existing, error: selErr } = await query.maybeSingle()
  if (selErr) throw new Error(`[조회 실패] ${name}: ${selErr.message}`)
  if (existing) return { id: existing.id, created: false }

  const { data: inserted, error: insErr } = await admin
    .from('pseo_regions')
    .insert({ name, slug, type, parent_id, display_order })
    .select('id')
    .single()
  if (insErr) throw new Error(`[추가 실패] ${name}: ${insErr.message}`)
  return { id: inserted.id, created: true }
}

async function main() {
  const { sidoCount, sigunguTotal } = summarize()
  console.log(`대상: 시/도 ${sidoCount}개, 시/군/구 ${sigunguTotal}개 (합계 ${sidoCount + sigunguTotal})\n`)

  let sidoCreated = 0
  let sigunguCreated = 0
  let sigunguSkipped = 0

  for (let i = 0; i < NATIONWIDE_REGIONS.length; i++) {
    const sido = NATIONWIDE_REGIONS[i]
    const { id: sidoId, created } = await upsertRegion({
      name: sido.name,
      slug: sido.name,
      type: 'SIDO',
      parent_id: null,
      display_order: i,
    })
    if (created) sidoCreated++
    console.log(`${created ? '+ 신규' : '· 기존'} ${sido.name}`)

    for (let j = 0; j < sido.sigungu.length; j++) {
      const name = sido.sigungu[j]
      const { created: sgCreated } = await upsertRegion({
        name,
        slug: name,
        type: 'SIGUNGU',
        parent_id: sidoId,
        display_order: j,
      })
      if (sgCreated) sigunguCreated++
      else sigunguSkipped++
    }
  }

  console.log(`\n완료 — 시/도 신규 ${sidoCreated}개, 시/군/구 신규 ${sigunguCreated}개, 시/군/구 기존(건너뜀) ${sigunguSkipped}개`)
}

main().catch((err) => {
  console.error('\n중단:', err.message)
  process.exit(1)
})
