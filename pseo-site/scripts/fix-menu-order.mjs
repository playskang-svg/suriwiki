/**
 * scripts/fix-menu-order.mjs
 * ------------------------------------------------------------------------
 * 일회성 정정 스크립트 — menu_order가 그룹별로 로컬(1,2)이라 "도배"와
 * "도배 견적" 그룹이 전체 정렬에서 앞으로 몰리던 문제를 고친다.
 * 그룹 간에도 겹치지 않게 10 단위로 재배치해서, 참고 사이트 순서
 * (도배▾ · 벽지 · 장판 · 도배 견적▾)와 정확히 같아지게 한다.
 *
 * SUPABASE_SERVICE_ROLE_KEY로 직접 쓰기 — RLS를 우회하므로 이 스크립트는
 * 절대 Next.js 앱 번들에 포함되지 않고, 로컬에서 사람이 수동 실행할 때만 쓴다.
 *
 * 실행: node --env-file=.env.local scripts/fix-menu-order.mjs
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

// 10 단위 간격 — 그룹끼리도 안 겹치고, 나중에 그룹 사이에 새 항목을 끼워
// 넣고 싶을 때(예: 15) 기존 값을 안 건드리고 여유 공간을 쓸 수 있다.
const updates = [
  ['도배업체', 10], // 도배 그룹 1번
  ['아파트도배', 20], // 도배 그룹 2번
  ['벽지', 30], // 평메뉴
  ['장판', 40], // 평메뉴
  ['도배가격', 50], // 도배 견적 그룹 1번
  ['도배비용', 60], // 도배 견적 그룹 2번
]

for (const [slug, menu_order] of updates) {
  const { data, error } = await admin
    .from('pseo_keywords')
    .update({ menu_order })
    .eq('slug', slug)
    .select('slug, menu_order, menu_group')
  if (error) throw new Error(`[${slug}] 업데이트 실패: ${error.message}`)
  if (!data || data.length === 0) throw new Error(`[${slug}] 해당 슬러그의 키워드를 찾지 못했습니다.`)
  console.log(`✓ ${slug} → menu_order=${data[0].menu_order} (그룹: ${data[0].menu_group ?? '없음'})`)
}

console.log('\n완료.')
