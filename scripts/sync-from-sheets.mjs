import { readFileSync, writeFileSync, existsSync } from "node:fs"
import path from "node:path"

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || "13xUm0roOtpRjfe0kMeYO2dlTSkGWnsHvqtCMlDmj5X4"
const url = "https://rgdejzrlszpesuodjejw.supabase.co"
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceKey) {
  console.error("[sync-from-sheets] SUPABASE_SERVICE_ROLE_KEY í™˜ê²½ë³€ìˆ˜ê°€ ì—†ìŠµë‹ˆë‹¤.")
  process.exit(1)
}

const headers = {
  apikey: serviceKey,
  Authorization: "Bearer " + serviceKey,
  "Content-Type": "application/json",
}

async function fetchSheetCsv(sheetName) {
  const csvUrl = "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(sheetName)
  const res = await fetch(csvUrl)
  if (!res.ok) throw new Error("[" + sheetName + "] êµ¬ê¸€ ì‹œíŠ¸ ì¡°íšŒ ì‹¤íŒ¨ (" + res.status + ") - êµ¬ê¸€ ì‹œíŠ¸ ê³µìœ  ê¶Œí•œì„ í™•ì¸í•´ì£¼ì„¸ìš”.")
  return parseCsv(await res.text())
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const headersArr = parseCsvLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length === 0 || !values.some((v) => v.length > 0)) continue
    const obj = {}
    headersArr.forEach((h, idx) => {
      obj[h.trim()] = values[idx] !== undefined ? values[idx].trim() : ""
    })
    rows.push(obj)
  }
  return rows
}

function parseCsvLine(line) {
  const result = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === "\"") {
      if (inQuotes && line[i + 1] === "\"") { cur += "\""; i++ }
      else inQuotes = !inQuotes
    } else if (c === "," && !inQuotes) {
      result.push(cur); cur = ""
    } else {
      cur += c
    }
  }
  result.push(cur)
  return result
}

function updateConstantsFile(primaryPhone) {
  const constantsPath = path.join(process.cwd(), "lib", "constants.ts")
  if (!existsSync(constantsPath)) return
  let code = readFileSync(constantsPath, "utf8")
  if (primaryPhone) {
    code = code.replace(/export const DEFAULT_PHONE = '[^']+'/, "export const DEFAULT_PHONE = '" + primaryPhone + "'")
  }
  writeFileSync(constantsPath, code, "utf8")
}

async function supabaseFetch(endpoint, options = {}) {
  const res = await fetch(url + "/rest/v1/" + endpoint, {
    ...options,
    headers: { ...headers, ...options.headers },
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error("[Supabase " + endpoint + "] " + res.status + ": " + errText)
  }
  return res.json().catch(() => null)
}

async function syncKeywords() {
  console.log("\n[1/4] í‚¤ì›Œë“œ ë™ê¸°í™” ì¤‘...")
  const rows = await fetchSheetCsv("í‚¤ì›Œë“œëª©ë¡")
  let firstPhone = "010-4684-8838"
  const payload = []

  for (const r of rows) {
    if (!r.slug || !r.display_name) continue
    if (r.phone) firstPhone = r.phone
    payload.push({
      slug: r.slug,
      display_name: r.display_name,
      phone: r.phone || "010-4684-8838",
      is_active: r.is_active === "TRUE" || r.is_active === "true" || r.is_active === true,
      menu_group: r.menu_group || null,
      menu_order: parseInt(r.menu_order || "0", 10),
    })
  }

  if (payload.length > 0) {
    await supabaseFetch("pseo_keywords?on_conflict=slug", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(payload),
    })
    console.log(" âœ… í‚¤ì›Œë“œ " + payload.length + "ê°œ ë™ê¸°í™” ì™„ë£Œ")
  }
  updateConstantsFile(firstPhone)
}

async function syncVariants() {
  console.log("\n[2/4] ì½˜í…ì¸  í…œí”Œë¦¿(Variants) ë™ê¸°í™” ì¤‘...")
  const rows = await fetchSheetCsv("ì½˜í…ì¸ í…œí”Œë¦¿")
  const keywords = await supabaseFetch("pseo_keywords?select=id,slug")
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
      sort_order: parseInt(r.sort_order || "0", 10),
    })
   }

  if (payload.length > 0) {
    await supabaseFetch("pseo_keyword_variants?on_conflict=keyword_id,variant_key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(payload),
    })
    console.log(" âœ… í…œí”Œë¦¿ " + payload.length + "ê°œ ë™ê¸°í™” ì™„ë£Œ")
  }
}

async function syncSections() {
  console.log("\n[3/4] ë³¸ë¬¸ ì„¹ì…˜ ë™ê¸°í™” ì¤‘...")
  const rows = await fetchSheetCsv(".»;ŽºËŽÈKžÈY‚"¢6öç7Bf&–çG2Òv—B7W&6TfWF6‚‚'6Võö¶W—v÷&E÷f&–çG3÷6VÆV7CÖ–BÇf&–çEö¶W’"¢6öç7Bf$ÖÒæWrÖ‚‡f&–çG2ÇÂµÒ’æÖ‚‡b’Óâ·bçf&–çEö¶W’Âbæ–EÒ’ ¢6öç7Bw&÷WVBÒ·Ð¢f÷"†6öç7B"öb&÷w2’°¢–b‚"çf&–çEö¶W’ÇÂ"æ&öG•÷FV×ÆFR’6öçF–çVP¢–b‚w&÷WVE·"çf&–çEö¶W•Ò’w&÷WVE·"çf&–çEö¶W•ÒÒµÐ¢w&÷WVE·"çf&–çEö¶W•ÒçW6‚‡"¢Ð ¢f÷"†6öç7B·f&–çD¶W’Â—FV×5Òöbö&¦V7BæVçG&–W2†w&÷WVB’’°¢6öç7Bf&–çD–BÒf$ÖævWB‡f&–çD¶W’¢–b‚f&–çD–B’6öçF–çVP ¢v—B7W&6TfWF6‚‚'6Võö6öçFVçE÷6V7F–öç3÷f&–çEö–CÖWâ"²f&–çD–BÂ°¢ÖWF†öC¢$DTÄUDR"À¢Ò ¢6öç7BFô–ç6W'BÒ—FV×2æÖ‚†—FVÒÂ–G‚’Óâ‡°¢f&–çEö–C¢f&–çD–BÀ¢6V7F–öå÷G—S¢—FVÒç6V7F–öå÷G—RÇÂ$$ôE’"À¢†VF–æuöÆWfVÃ¢—FVÒæ†VF–æuöÆWfVÂÇÂçVÆÂÀ¢†VF–æu÷FV×ÆFS¢—FVÒæ†VF–æu÷FV×ÆFRÇÂçVÆÂÀ¢&öG•÷FV×ÆFS¢—FVÒæ&öG•÷FV×ÆFRÀ¢6÷'Eö÷&FW#¢'6T–çB†—FVÒç6÷'Eö÷&FW"ÇÂ7G&–ær†–G‚’Â’À¢Ò’ ¢v—B7W&6TfWF6‚‚'6Võö6öçFVçE÷6V7F–öç2"Â°¢ÖWF†öC¢%õ5B"À¢&öG“¢¥4ôâç7G&–æv–g’‡Fô–ç6W'B’À¢Ò¢6öç6öÆRæÆör‚")ÈRÈKžÈY‚²"²f&–çD¶W’²%Ò"²Fô–ç6W'BæÆVæwF‚².«	Â¸ùž«‹Ù™BÉ˜Nº8Â"¢Ð§Ð ¦7–æ2gVæ7F–öâ7–æ4Æ—7F–æw2‚’°¢6öç6öÆRæÆör‚%Æå³BóEÒ»	ÎÙh’¸ÈÈ8ºªžºÒ¸ùž«‹Ù™BÊIâââ"¢6öç7B&÷w2Òv—BfWF6…6†VWD77b‚.»	ÎÙhž¸ÈÈ8"¢6öç7B¶W—v÷&G2Òv—B7W&6TfWF6‚‚'6Võö¶W—v÷&G3÷6VÆV7CÖ–BÇ6ÇVr"¢6öç7B·tÖÒæWrÖ‚†¶W—v÷&G2ÇÂµÒ’æÖ‚†²’Óâ¶²ç6ÇVrÂ²æ–EÒ’¢6öç7B&Vv–öç2Òv—B7W&6TfWF6‚‚'6Võ÷&Vv–öç3÷6VÆV7CÖ–BÆæÖRÇG—R"¢6öç7B–ÆöBÒµÐ ¢f÷"†6öç7B"öb&÷w2’°¢6öç7B¶W—v÷&D–BÒ·tÖævWB‡"æ¶W—v÷&E÷6ÇVr¢–b‚¶W—v÷&D–B’6öçF–çVP ¢6öç7BF&vWE&Vv–öâÒ‡&Vv–öç2ÇÂµÒ’æf–æB‚‡&Vr’Óà¢‡"çF&vWE÷6–wVæwRbb&VrçG—RÓÓÒ%4”uTäuR"bb&VrææÖRÓÓÒ"çF&vWE÷6–wVæwR’ÇÀ¢‚"çF&vWE÷6–wVæwRbb"çF&vWE÷6–Fòbb&VrçG—RÓÓÒ%4”Dò"bb&VrææÖRÓÓÒ"çF&vWE÷6–Fò¢¢–b‚F&vWE&Vv–öâ’6öçF–çVP ¢–ÆöBçW6‚‡°¢¶W—v÷&Eö–C¢¶W—v÷&D–BÀ¢&Vv–öåö–C¢F&vWE&Vv–öâæ–BÀ¢†öæUö÷fW'&–FS¢"ç†öæUö÷fW'&–FRÇÂçVÆÂÀ¢—5÷V&Æ—6†VC¢"æ—5÷V&Æ—6†VBÓÓÒ%E%TR"ÇÂ"æ—5÷V&Æ—6†VBÓÓÒ'G'VR"ÇÂ"æ—5÷V&Æ—6†VBÓÓÒG'VRÀ¢Ò¢Ð ¢–b‡–ÆöBæÆVæwF‚â’°¢v—B7W&6TfWF6‚‚'6Võ÷vUöÆ—7F–æw3ööåö6öæfÆ–7CÖ¶W—v÷&Eö–BÇ&Vv–öåö–B"Â°¢ÖWF†öC¢%õ5B"À¢†VFW'3¢²&VfW#¢'&W6öÇWF–öãÖÖW&vRÖGWÆ–6FW2"ÒÀ¢&öG“¢¥4ôâç7G&–æv–g’‡–ÆöB’À¢Ò¢6öç6öÆRæÆör‚")ÈR»	ÎÙh’ºªžºÒ"²–ÆöBæÆVæwF‚².«	Â¸ùž«‹Ù™BÉ˜Nº8Â"¢Ð§Ð ¦7–æ2gVæ7F–öâÖ–â‚’°¢6öç6öÆRæÆör‚/	ù¨´vöövÆR6†VWG2Óâ7W&6R•Ò¸ùž«‹Ù™BÈ¹ÎÉé‚"²W&Â²"’"¢v—B7–æ4¶W—v÷&G2‚¢v—B7–æ5f&–çG2‚¢v—B7–æ56V7F–öç2‚¢v—B7–æ4Æ—7F–æw2‚¢6öç6öÆRæÆör‚%Æî)Ê‚ºªŽ¹:¸ÛÉÛNØK»òËÙN¹9Â¸ùž«‹Ù™BÉ˜Nº8Â"§Ð ¦Ö–â‚’æ6F6‚‚†W'"’Óâ°¢6öç7B×6rÒW'"bbW'"æÖW76vRòW'"æÖW76vR¢7G&–ær†W'"¢6öç7BÆ–ä×6rÒ×6rç&WÆ6R‚òâ£ÅÅÂö‡FÖÃâ÷2Ârr’ç6Æ–6RƒÂ3¢6öç6öÆRæW'&÷"‚%Æî)ØÂÉy¹úÂ»	ÎÈ9Ó¢"ÂÆ–ä×6rÇÂ×6r¢&ö6W72æW†—Bƒ§Ò 