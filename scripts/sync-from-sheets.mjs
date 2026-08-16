import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '13xUm0roOtpRjfe0kMeYO2dlTSkGWnsHvqtCMlDmj5X4'
const url = 'https://rgdejzrlszpesuodjejw.supabase.co'; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length === 0 || !values.some((v) => v.length > 0)) continue
    const obj = {}
    headersArr.forEach((h, idx) => {
      obj[h.trim()] = values[idx] !== undefined ? values[idx].trim() : ''
    })
    rows.push(obj)
  }
  return rows
}

function parseCsvLine(line) {
  const result = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      result.push(cur); cur = ''
    } else {
      cur += c
    }
  }
  result.push(cur)
  return result
}

function updateConstantsFile(primaryPhone) {
  const constantsPath = path.join(process.cwd(), 'lib', 'constants.ts')
  if (!existsSync(constantsPath)) return
  let code = readFileSync(constantsPath, 'utf8')
  if (primaryPhone) {
    code = code.replace(/export const DEFAULT_PHONE = '[^']+'/, `export const DEFAULT_PHONE = '${primaryPhone}'`)
  }
  writeFileSync(constantsPath, code, 'utf8')
}

async function supabaseFetch(endpoint, options = {}) {
  const res = await fetch(`${url}/rest/v1/${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`[Supabase ${endpoint}] ${res.status}: ${errText}`)
  }
  return res.json().catch(() => null)
}

async function syncKeywords() {
  const rows = await fetchSheetCsv('키워드목록')
  let firstPhone = '010-4684-8838'
  const payload = []

  for (const r of rows) {
    if (!r.slug || !r.display_name) continue
    if (r.phone) firstPhone = r.phone
    payload.push({
      slug: r.slug,
      display_name: r.display_name,
      phone: r.phone || '010-4684-8838',
      is_active: r.is_active === 'TRUE' || r.is_active === 'true' || r.is_active === true,
      menu_group: r.menu_group || null,
      menu_order: parseInt(r.menu_order || '0', 10),
    })
  }

  if (payload.length > 0) {
    await supabaseFetch('pseo_keywords', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    })
  }
  updateConstantsFile(firstPhone)
}

async function syncVariants() {
  const rows = await fetchSheetCsv('콘텐츠템플릿')
  const keywords = await supabaseFetch('pseo_keywords?select=id,slug')
  const kwMap = new Map((keywords || []).map((k) => [k.slug, k.id]))
  const payload = []

  for (const r of rows) {
    const keywordId = kwMap.get(r.keyword_slug)
    if (!keywordId || !r.variant_key) continue
    payload.push({
      keyword_id: keywordId,
      variant_key: r.variant_key,
      title_template: r.title_template,
      meta_description_template: r.meta_description_template,
      h1_template: r.h1_template,
      sort_order: parseInt(r.sort_order || '0', 10),
    })
  }

  if (payload.length > 0) {
    await supabaseFetch('pseo_keyword_variants', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    })
  }
}

async function syncSections() {
  const rows = await fetchSheetCsv('본문섹션')
  const variants = await supabaseFetch('pseo_keyword_variants?select=id,variant_key')
  const varMap = new Map((variants || []).map((v) => [v.variant_key, v.id]))

  const grouped = {}
  for (const r of rows) {
    if (!r.variant_key || !r.body_template) continue
    if (!grouped[r.variant_key]) grouped[r.variant_key] = []
    grouped[r.variant_key].push(r)
  }

  for (const [variantKey, items] of Object.entries(grouped)) {
    const variantId = varMap.get(variantKey)
    if (!variantId) continue

    await supabaseFetch(`pseo_content_sections?variant_id=eq.${variantId}`, {
      method: 'DELETE',
    })

    const toInsert = items.map((item, idx) => ({
      variant_id: variantId,
      section_type: item.section_type || 'BODY',
      heading_level: item.heading_level || null,
      heading_template: item.heading_template || null,
      body_template: item.body_template,
      sort_order: parseInt(item.sort_order || String(idx), 10),
    }))

    await supabaseFetch('pseo_content_sections', {
      method: 'POST',
      body: JSON.stringify(toInsert),
    })
  }
}

async function syncListings() {
  const rows = await fetchSheetCsv('발행대상')
  const keywords = await supabaseFetch('pseo_keywords?select=id,slug')
  const kwMap = new Map((keywords || []).map((k) => [k.slug, k.id]))
  const regions = await supabaseFetch('pseo_regions?select=id,name,type')
  const payload = []

  for (const r of rows) {
    const keywordId = kwMap.get(r.keyword_slug)
    if (!keywordId) continue

    const targetRegion = (regions || []).find((reg) =>
      (r.target_sigungu && reg.type === 'SIGUNGU' && reg.name === r.target_sigungu) ||
      (!r.target_sigungu && r.target_sido && reg.type === 'SIDO' && reg.name === r.target_sido)
    )
    if (!targetRegion) continue

    payload.push({
      keyword_id: keywordId,
      region_id: targetRegion.id,
      phone_override: r.phone_override || null,
      is_published: r.is_published === 'TRUE' || r.is_published === 'true' || r.is_published === true,
    })
  }

  if (payload.length > 0) {
    await supabaseFetch('pseo_page_listings', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    })
  }
}

async function main() {
  console.log(`🚀 [Google Sheets -> Supabase API] 동기화 시작 (${url})`)
  await syncKeywords()
  await syncVariants()
  await syncSections()
  await syncListings()
  console.log('✨ 모든 동기화 완료!')
}

main().catch((err) => {
  console.error('❌ 에러:', err.message)
  process.exit(1)
})
