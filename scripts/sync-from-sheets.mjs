import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '13xUm0roOtpRjfe0kMeYO2dlTSkGWnsHvqtCMlDmj5X4'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('[sync-from-sheets] 환경변수가 없습니다.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

async function fetchSheetCsv(sheetName) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  const res = await fetch(csvUrl)
  if (!res.ok) throw new Error(`[${sheetName}] 구글 시트 조회 실패 (${res.status})`)
  const text = await res.text()
  return parseCsv(text)
}

function parseCsv(text) {
  const lines = text.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const headers = parseCsvLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length === 0 || !values.some((v) => v.length > 0)) continue
    const obj = {}
    headers.forEach((h, idx) => {
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

async function syncKeywords() {
  const rows = await fetchSheetCsv('키워드목록')
  let firstPhone = '010-4684-8838'
  for (const r of rows) {
    if (!r.slug || !r.display_name) continue
    if (r.phone) firstPhone = r.phone
    await admin.from('pseo_keywords').upsert({
      slug: r.slug,
      display_name: r.display_name,
      phone: r.phone || '010-4684-8838',
      is_active: r.is_active === 'TRUE' || r.is_active === 'true' || r.is_active === true,
      menu_group: r.menu_group || null,
      menu_order: parseInt(r.menu_order || '0', 10),
    }, { onConflict: 'slug' })
  }
  updateConstantsFile(firstPhone)
}

async function syncVariants() {
  const rows = await fetchSheetCsv('콘텐츠템플릿')
  const { data: keywords } = await admin.from('pseo_keywords').select('id, slug')
  const kwMap = new Map((keywords || []).map((k) => [k.slug, k.id]))
  for (const r of rows) {
    const keywordId = kwMap.get(r.keyword_slug)
    if (!keywordId || !r.variant_key) continue
    await admin.from('pseo_keyword_variants').upsert({
      keyword_id: keywordId,
      variant_key: r.variant_key,
      title_template: r.title_template,
      meta_description_template: r.meta_description_template,
      h1_template: r.h1_template,
      sort_order: parseInt(r.sort_order || '0', 10),
    }, { onConflict: 'keyword_id,variant_key' })
  }
}

async function syncSections() {
  const rows = await fetchSheetCsv('본문섹션')
  const { data: variants } = await admin.from('pseo_keyword_variants').select('id, variant_key')
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
    await admin.from('pseo_content_sections').delete().eq('variant_id', variantId)
    const toInsert = items.map((item, idx) => ({
      variant_id: variantId,
      section_type: item.section_type || 'BODY',
      heading_level: item.heading_level || null,
      heading_template: item.heading_template || null,
      body_template: item.body_template,
      sort_order: parseInt(item.sort_order || String(idx), 10),
    }))
    await admin.from('pseo_content_sections').insert(toInsert)
  }
}

async function syncListings() {
  const rows = await fetchSheetCsv('발행대상')
  const { data: keywords } = await admin.from('pseo_keywords').select('id, slug')
  const kwMap = new Map((keywords || []).map((k) => [k.slug, k.id]))
  const { data: regions } = await admin.from('pseo_regions').select('id, name, type')
  for (const r of rows) {
    const keywordId = kwMap.get(r.keyword_slug)
    if (!keywordId) continue
    const targetRegion = (regions || []).find((reg) => 
      (r.target_sigungu && reg.type === 'SIGUNGU' && reg.name === r.target_sigungu) ||
      (!r.target_sigungu && r.target_sido && reg.type === 'SIDO' && reg.name === r.target_sido)
    )
    if (!targetRegion) continue
    await admin.from('pseo_page_listings').upsert({
      keyword_id: keywordId,
      region_id: targetRegion.id,
      phone_override: r.phone_override || null,
      is_published: r.is_published === 'TRUE' || r.is_published === 'true' || r.is_published === true,
    }, { onConflict: 'keyword_id,region_id' })
  }
}

async function main() {
  console.log('🚀 동기화 시작')
  await syncKeywords()
  await syncVariants()
  await syncSections()
  await syncListings()
  console.log('✨ 완료!')
}
main().catch(console.error)
