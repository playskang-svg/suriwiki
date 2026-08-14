/**
 * lib/bg-images.ts
 * ------------------------------------------------------------------------
 * public/bg_images/ 안의 배경 이미지를 "seed(keywordSlug:regionSlug) 기반
 * 결정적 로테이션"으로 골라 base64 data URL로 돌려준다.
 *
 *  - 같은 페이지는 항상 같은 배경을 쓴다(재빌드해도 랜덤하게 안 바뀜 → 캐시/색인 안정적).
 *  - 파일 목록/바이트는 최초 1회만 읽고 모듈 스코프에 캐시한다(빌드 페이지 수천~수만개라도
 *    같은 파일을 반복해서 디스크에서 다시 읽지 않는다 — server-hoist-static-io 패턴).
 * ------------------------------------------------------------------------
 */
import fs from 'node:fs'
import path from 'node:path'

const BG_DIR = path.join(process.cwd(), 'public', 'bg_images')
const VALID_EXT = /\.(jpe?g|png|webp)$/i

let fileListCache: string[] | null = null
const dataUrlCache = new Map<string, string>()

function listBgFiles(): string[] {
  if (fileListCache) return fileListCache
  try {
    fileListCache = fs
      .readdirSync(BG_DIR)
      .filter((f) => VALID_EXT.test(f))
      .sort() // 1.jpg, 2.jpg ... 정렬을 고정해 빌드마다 동일한 로테이션을 보장
  } catch {
    fileListCache = []
  }
  return fileListCache
}

function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

/** seed(보통 "keywordSlug:regionSlug")로 배경 이미지를 결정적으로 하나 골라 data URL로 반환. 이미지가 없으면 null. */
export function pickBgImageDataUrl(seed: string): string | null {
  const files = listBgFiles()
  if (files.length === 0) return null

  const file = files[hashSeed(seed) % files.length]
  const cached = dataUrlCache.get(file)
  if (cached) return cached

  const buf = fs.readFileSync(path.join(BG_DIR, file))
  const ext = path.extname(file).slice(1).toLowerCase()
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  const dataUrl = `data:${mime};base64,${buf.toString('base64')}`
  dataUrlCache.set(file, dataUrl)
  return dataUrl
}

export function hasBgImages(): boolean {
  return listBgFiles().length > 0
}

/** pickBgImageDataUrl과 같은 로테이션 로직이지만, OG(Satori)용 base64 data URL이 아니라
 *  일반 페이지에서 <img src>로 바로 쓸 공개 경로(/bg_images/1.jpg)를 반환한다 — data URL을
 *  쓰면 페이지마다 이미지 바이트가 HTML에 그대로 박혀 브라우저 캐시 이점을 잃는다. */
export function pickBgImagePath(seed: string): string | null {
  const files = listBgFiles()
  if (files.length === 0) return null
  return `/bg_images/${files[hashSeed(seed) % files.length]}`
}
