/**
 * scripts/seed-dong-regions.mjs
 * ------------------------------------------------------------------------
 * scripts/dong-data-raw.json(전국 읍/면/동 3,558개, 배경 조사+5종 교차검증 완료)를
 * pseo_regions에 DONG 레벨로 채워 넣는다. "시도/시군구" 키로 부모(SIGUNGU)를
 * 찾아 그 밑에 자식으로 붙인다 — 세종특별자치시만 예외(단층제라 시군구 없이
 * SIDO 바로 아래 붙인다).
 *
 * 대량(3,558건)이라 upsert를 배치로 처리한다. 이미 있는 동(예: 천안시 불당동 —
 * 초기 서비스 지역 예시로 먼저 들어가 있던 것)은 건드리지 않고 건너뛴다.
 *
 * 실행: node --env-file=.env.local scripts/seed-dong-regions.mjs
 * ------------------------------------------------------------------------
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다.')
  process.exit(1)
}
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

const BATCH_SIZE = 500
const PAGE_SIZE = 1000

async function fetchAll(table, columns) {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin.from(table).select(columns).range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`[${table} 조회 실패] ${error.message}`)
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return rows
}

async function main() {
  const raw = JSON.parse(readFileSync(join(__dirname, 'dong-data-raw.json'), 'utf-8'))
  console.log(`읍/면/동 원본: 시군구 ${Object.keys(raw.flat).length}곳, 합계 ${raw._meta.읍면동총계}개\n`)

  // 기존 SIDO/SIGUNGU 전부 읽어서 이름→id 매핑 (parent_id로 정확히 구분 — 동명 시군구 있음)
  const regions = await fetchAll('pseo_regions', 'id,parent_id,type,name')
  const sidoByName = new Map(regions.filter((r) => r.type === 'SIDO').map((r) => [r.name, r]))
  // "시도id:시군구이름" → region — 형제(같은 시도) 안에서만 유일하면 되므로 이렇게 키를 만든다
  const sigunguByKey = new Map(
    regions.filter((r) => r.type === 'SIGUNGU').map((r) => [`${r.parent_id}:${r.name}`, r])
  )
  const existingDongKey = new Set(
    regions.filter((r) => r.type === 'DONG').map((r) => `${r.parent_id}:${r.name}`)
  )

  const toInsert = []
  let skippedNoParent = 0

  for (const [key, dongNames] of Object.entries(raw.flat)) {
    const [sidoName, sigunguName] = key.split('/')
    const sido = sidoByName.get(sidoName)
    if (!sido) {
      console.warn(`⚠️ 시/도 못 찾음: ${sidoName} (${key})`)
      skippedNoParent += dongNames.length
      continue
    }

    // 세종특별자치시는 시군구 레벨이 없다 — flat 키가 "세종특별자치시/세종시"로 오는데,
    // 실제 DB에는 "세종시"라는 SIGUNGU가 없으므로 SIDO 바로 아래 자식으로 붙인다.
    let parent
    if (sigunguName === '세종시' && sidoName === '세종특별자치시') {
      parent = sido
    } else {
      parent = sigunguByKey.get(`${sido.id}:${sigunguName}`)
    }
    if (!parent) {
      console.warn(`⚠️ 시/군/구 못 찾음: ${key}`)
      skippedNoParent += dongNames.length
      continue
    }

    dongNames.forEach((name, i) => {
      const dongKey = `${parent.id}:${name}`
      if (existingDongKey.has(dongKey)) return // 이미 있음(예: 천안시 불당동) — 건너뜀
      toInsert.push({ name, slug: name, type: 'DONG', parent_id: parent.id, display_order: i })
      existingDongKey.add(dongKey) // 같은 실행 내 중복 방지
    })
  }

  console.log(`신규 추가 대상: ${toInsert.length}개 (매칭 실패로 건너뜀: ${skippedNoParent}개)\n`)

  let done = 0
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)
    const { error } = await admin.from('pseo_regions').insert(batch)
    if (error) throw new Error(`[배치 ${i / BATCH_SIZE + 1} 실패] ${error.message}`)
    done += batch.length
    console.log(`  ${done}/${toInsert.length}개 추가 완료`)
  }

  console.log(`\n완료 — 읍/면/동 ${toInsert.length}개 신규 추가`)
}

main().catch((err) => {
  console.error('\n중단:', err.message)
  process.exit(1)
})
