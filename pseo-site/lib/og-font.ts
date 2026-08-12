/**
 * lib/og-font.ts
 * ------------------------------------------------------------------------
 * OG 이미지(app/api/og)에서 한글을 그리기 위한 폰트 로더.
 *
 * next/og(Satori)는 기본 내장 폰트에 한글 글리프가 없어서, 폰트를 직접 버퍼로
 * 넘겨주지 않으면 지역명/키워드가 네모(tofu)로 깨져서 나온다. 아래 순서로 폰트를 구한다.
 *
 *   1) public/fonts/ 안에 로컬 .ttf/.otf 파일이 있으면 그것을 우선 사용한다
 *      (사내망/오프라인 빌드, 외부망이 막힌 CI 환경 대비 — 가장 안전한 방법).
 *   2) 없으면 빌드 시점에 Google Fonts(Black Han Sans)에서 자동으로 내려받는다.
 *      next/font/google이 폰트를 자체 호스팅하는 것과 동일한 원리로, "next build를
 *      실행하는 시점"에 그 컴퓨터의 네트워크로 받아오는 것이다(지금 내가 대신
 *      받아주는 게 아니라, 나중에 사용자가 빌드를 돌릴 때 코드가 하는 일이다).
 *
 * 폰트를 바꾸고 싶으면 GOOGLE_FONT_FAMILY만 바꾸면 된다. next/og(Satori)는 woff2를
 * 잘 파싱하지 못하므로, 구형 User-Agent로 요청해 ttf를 강제로 받는 방법을 쓴다
 * (OG 이미지 생성 커뮤니티에서 널리 쓰이는 우회법).
 * ------------------------------------------------------------------------
 */
import fs from 'node:fs'
import path from 'node:path'

const GOOGLE_FONT_FAMILY = 'Black Han Sans'
const GOOGLE_FONTS_CSS_URL = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONT_FAMILY.replace(/ /g, '+')}&display=swap`

// Satori가 안정적으로 파싱하는 ttf를 받기 위한 구형 UA (최신 UA로 요청하면 woff2가 내려온다)
const LEGACY_UA =
  'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'

const LOCAL_FONT_DIR = path.join(process.cwd(), 'public', 'fonts')

function readLocalFont(): ArrayBuffer | null {
  try {
    const files = fs.readdirSync(LOCAL_FONT_DIR).filter((f) => /\.(ttf|otf)$/i.test(f))
    if (files.length === 0) return null
    const buf = fs.readFileSync(path.join(LOCAL_FONT_DIR, files[0]))
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  } catch {
    return null
  }
}

async function fetchGoogleFont(): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(GOOGLE_FONTS_CSS_URL, { headers: { 'User-Agent': LEGACY_UA } })
    if (!cssRes.ok) return null
    const css = await cssRes.text()
    const match = css.match(/src:\s*url\(([^)]+)\)/)
    if (!match) return null
    const fontRes = await fetch(match[1])
    if (!fontRes.ok) return null
    return await fontRes.arrayBuffer()
  } catch (err) {
    console.warn(
      '[lib/og-font] Google Fonts에서 폰트를 가져오지 못했습니다. public/fonts/에 .ttf 파일을 넣어주세요.',
      err
    )
    return null
  }
}

// 빌드 1회당 한 번만 로드하도록 모듈 스코프에 캐시 (server-hoist-static-io 패턴)
let fontPromise: Promise<ArrayBuffer | null> | null = null

export function getOgFont(): Promise<ArrayBuffer | null> {
  if (!fontPromise) {
    fontPromise = (async () => readLocalFont() ?? (await fetchGoogleFont()))()
  }
  return fontPromise
}
