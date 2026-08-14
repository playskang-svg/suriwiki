/**
 * scripts/incremental-deploy.mjs
 * ------------------------------------------------------------------------
 * 지역(또는 키워드) 하나가 바뀌었을 때, 전체 53,295페이지를 다시 굽지 않고
 * "바뀐 부분만" 빌드해서 해당 키워드 샤드 하나만 재배포한다.
 *
 * 사용법:
 *   node scripts/incremental-deploy.mjs <키워드슬러그> [지역경로...]
 *
 * 예시:
 *   # 강남구 하나만 (도배장판 키워드)
 *   node scripts/incremental-deploy.mjs 도배장판 서울특별시/강남구
 *
 *   # 여러 지역
 *   node scripts/incremental-deploy.mjs 도배업체 서울특별시/강남구 서울특별시/서초구
 *
 *   # 지역 없이 키워드만 — 그 키워드 전체 지역을 다시 빌드(그래도 다른 6개 키워드는 안 건드림)
 *   node scripts/incremental-deploy.mjs 벽지
 *
 * 왜 이게 되는가:
 *   lib/supabase.ts의 getStaticParamsList()와 app/[keyword]/page.tsx의
 *   generateStaticParams()가 INCREMENTAL_KEYWORD / INCREMENTAL_REGION_PATHS
 *   환경변수를 보고 "이 키워드(+이 지역들)"만 정적 페이지 생성 대상에 포함시킨다.
 *   next build 자체(Next.js output:'export')는 여전히 매번 전체를 도는 것처럼
 *   보이지만, generateStaticParams가 돌려주는 목록이 작으면 "Generating static
 *   pages" 단계가 그만큼만 돈다 — Compiling/Collecting page data의 고정 비용
 *   (약 1분 안팎)만 내고 나머지는 몇 초~몇 분 안에 끝난다.
 *
 *   next build는 결과물을 항상 ./out에 쓰기 때문에(경로를 바꿀 방법이 없음),
 *   지금 배포된 상태를 담고 있는 기존 out/ 또는 out-{키워드}/를 잃어버리지
 *   않도록 아래 순서로 안전하게 처리한다:
 *     1) 현재 ./out을 OS 임시폴더로 잠깐 옮겨 보호
 *     2) 필터가 걸린 채로 next build 실행 → 작고 빠른 새 ./out 생성
 *     3) 새 ./out에서 이 키워드의 파일들만 뽑아서 진짜 배포 대상 폴더(루트
 *        키워드면 보호해둔 out/, 아니면 기존 out-{키워드}/)에 덮어쓴다
 *     4) 보호해둔 out/을 제자리로 복원(루트 키워드가 아니었다면 그대로,
 *        루트 키워드였다면 방금 병합한 내용까지 포함해서)
 *     5) 그 샤드의 sitemap.xml/robots.txt만 다시 만들고, 그 프로젝트 하나만 배포
 *
 * 알아둘 점(한계):
 *   - 이 스크립트가 재빌드하지 않은 "인접 페이지"(예: 새로 추가한 지역의 형제
 *     지역 목록에 그 지역이 나오는 페이지)는 다음에 그 페이지가 다시 빌드되기
 *     전까지 새 지역으로 가는 링크가 안 보일 수 있다. 완전히 새 지역을 여러 개
 *     한꺼번에 추가할 땐 형제 지역들도 같이 인자로 넣어주거나, 나중에 전체
 *     재빌드(npm run build && npm run split && npm run deploy)로 한 번
 *     정리해주는 걸 권장한다.
 *   - 이 스크립트를 쓰려면 out/(루트) 또는 out-{키워드}/가 이미 한 번의 전체
 *     빌드+분할로 만들어져 있어야 한다(증분 병합 대상이 있어야 하므로).
 * ------------------------------------------------------------------------
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')
const OUT_DIR = join(ROOT_DIR, 'out')

// next build를 거치지 않는 순수 node 스크립트라 .env.local을 직접 읽는다 —
// generate-sitemap.mjs / split-by-keyword.mjs / deploy-all.mjs와 같은 이유·같은 패턴.
function loadDotEnvLocal() {
  try {
    const text = readFileSync(join(ROOT_DIR, '.env.local'), 'utf-8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
    }
  } catch {
    // .env.local이 없으면(예: CI 환경변수로 주입) 그냥 넘어간다
  }
}
loadDotEnvLocal()

// lib/constants.ts의 KEYWORD_SITE_URL과 반드시 같은 내용으로 유지할 것 — 이유는
// scripts/split-by-keyword.mjs 상단 주석 참고.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://example-pseo.pages.dev').replace(/\/$/, '')
const ROOT_KEYWORD = '도배장판'
const KEYWORD_SITE_URL = {
  도배장판: SITE_URL,
  도배업체: 'https://suriwiki-pseo-dobae-eopche.pages.dev',
  아파트도배: 'https://suriwiki-pseo-apateu-dobae.pages.dev',
  벽지: 'https://suriwiki-pseo-byeokji.pages.dev',
  장판: 'https://suriwiki-pseo-jangpan.pages.dev',
  도배가격: 'https://suriwiki-pseo-dobae-gagyeok.pages.dev',
  도배비용: 'https://suriwiki-pseo-dobae-biyong.pages.dev',
}

function shardDirName(url) {
  const host = new URL(url).hostname
  const slug = host.replace(/\.pages\.dev$/, '').replace(/^suriwiki-pseo-?/, '')
  return `out-${slug || 'root'}`
}

// ⚠️ Cloudflare Pages 프로젝트명은 도메인 URL에서 거꾸로 추측하지 않는다 — 커스텀
// 도메인(dj.adbles.com 등)을 연결하면 SITE_URL이 더 이상 *.pages.dev가 아니게 되어
// "호스트명 = 프로젝트명" 가정이 깨진다(실제로 deploy-all.mjs에서 이 가정 때문에
// "The Pages project 'dj.adbles.com' does not exist" 에러가 났었다). 루트 프로젝트명은
// 도메인이 뭐로 바뀌든 항상 고정이라 상수로 둔다.
const ROOT_PROJECT_NAME = 'suriwiki-pseo'
function projectName(url) {
  return new URL(url).hostname.replace(/\.pages\.dev$/, '')
}

function filterSitemap(fullSitemapXml, domain) {
  const lines = fullSitemapXml.split('\n')
  const urlLines = lines.filter((line) => line.includes('<url>') && line.includes(`<loc>${domain}`))
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urlLines.join('\n') +
    `\n</urlset>\n`
  )
}

/**
 * src(방금 필터링된 채로 새로 구운 작은 out/)의 keyword 관련 파일들을 dest(기존에
 * 배포돼 있던, 그 키워드의 전체 페이지를 담은 폴더)에 "병합"한다.
 *
 * ⚠️ 반드시 병합(overwrite-merge)이어야 하고, "폴더 통째로 교체"이면 안 된다 —
 * INCREMENTAL_REGION_PATHS로 지역을 몇 개만 골랐으면 src의 {keyword}/ 폴더 안에는
 * 그 지역들만 들어있다. 여기서 dest의 {keyword}/ 폴더를 먼저 지우고 src로 바꿔치기하면
 * (실제로 초기 버전에서 이렇게 짜서 사고가 났었다 — out-도배업체/의 11,447개 파일이
 * 32개로 줄어들고 그 상태로 배포까지 돼서 라이브 사이트가 깨졌다) 필터에 안 걸린
 * 나머지 지역 페이지가 전부 사라진다.
 *
 * fs.cpSync(src, dest, {recursive:true})는 dest가 이미 있는 디렉터리일 때 "병합"
 * 동작이다 — src에 있는 파일은 새로 만들거나 덮어쓰고, dest에만 있고 src에는 없는
 * 파일은 그대로 둔다(지우지 않는다). 정확히 우리가 원하는 동작이라 직접 테스트해서
 * 확인한 뒤 채택했다.
 *
 * 허브 페이지(단일 파일 {keyword}.html/.txt)는 지역 필터와 무관하게 이 빌드에서
 * 항상 그 키워드 전체 기준으로 새로 만들어지므로 그냥 덮어쓴다(파일이라 병합 개념이
 * 필요 없음).
 *
 * 참고: 이 병합은 "지역이 삭제/비공개 전환된 경우"까지는 처리하지 못한다(지워야 할
 * 파일을 지우지 않음) — 그런 경우는 언젠가 전체 재빌드(npm run build && npm run
 * split && npm run deploy)로 정리해야 한다.
 */
function extractKeywordSubtree(srcOut, destDir, keyword) {
  const regionDirSrc = join(srcOut, keyword)
  if (existsSync(regionDirSrc)) {
    mkdirSync(destDir, { recursive: true })
    cpSync(regionDirSrc, join(destDir, keyword), { recursive: true })
  }
  const ogDirSrc = join(srcOut, 'api', 'og', keyword)
  if (existsSync(ogDirSrc)) {
    mkdirSync(join(destDir, 'api', 'og'), { recursive: true })
    cpSync(ogDirSrc, join(destDir, 'api', 'og', keyword), { recursive: true })
  }
  for (const ext of ['html', 'txt']) {
    const src = join(srcOut, `${keyword}.${ext}`)
    if (existsSync(src)) cpSync(src, join(destDir, `${keyword}.${ext}`))
  }
}

// _next/static/chunks/**의 파일명은 콘텐츠 해시이긴 하지만, 실제로 확인해보니 next
// build를 다시 돌릴 때마다 "내용이 안 바뀐" 라우트 청크도 다른 해시로 나올 수 있다
// (전체 모듈 그래프가 빌드마다 달라서 웹팩 모듈ID 배정이 흔들리는 걸로 보임 — 실제로
// 이것 때문에 사고가 났다: 페이지 HTML은 새 해시를 참조하는데 배포된 _next/에는 그
// 파일이 없어서 "ChunkLoadError"로 라이브 페이지가 하얗게 깨졌다). 그래서 keyword
// 서브트리뿐 아니라 _next/(그리고 폰트·배경이미지·404·헤더 같은 공용 정적 자산)도
// 매번 같이 병합해야 한다 — 병합(overwrite-merge)이라 기존 파일을 지우지 않으므로
// 다른 키워드/지역이 참조 중인 예전 청크도 안전하게 남는다.
const SHARED_ASSET_ENTRIES = ['_next', 'fonts', 'bg_images', '404.html', '_headers']

function mergeSharedAssets(srcOut, destDir) {
  for (const entry of SHARED_ASSET_ENTRIES) {
    const src = join(srcOut, entry)
    if (existsSync(src)) cpSync(src, join(destDir, entry), { recursive: true })
  }
}

function main() {
  const [keyword, ...regionPaths] = process.argv.slice(2)
  if (!keyword) {
    console.error('사용법: node scripts/incremental-deploy.mjs <키워드슬러그> [지역경로...]')
    console.error('예시:   node scripts/incremental-deploy.mjs 도배장판 서울특별시/강남구')
    process.exit(1)
  }
  const domain = KEYWORD_SITE_URL[keyword]
  if (!domain) {
    console.error(`[incremental-deploy] "${keyword}"는 lib/constants.ts KEYWORD_SITE_URL에 없는 키워드입니다.`)
    console.error(`   등록된 키워드: ${Object.keys(KEYWORD_SITE_URL).join(', ')}`)
    process.exit(1)
  }
  const isRoot = keyword === ROOT_KEYWORD
  const mergeTargetDir = isRoot ? OUT_DIR : join(ROOT_DIR, shardDirName(domain))
  const project = isRoot ? ROOT_PROJECT_NAME : projectName(domain)

  if (!existsSync(mergeTargetDir)) {
    console.error(`[incremental-deploy] ${mergeTargetDir} 이(가) 없습니다.`)
    console.error('   증분 배포는 이미 한 번 전체 빌드+분할(npm run build && npm run split)이')
    console.error('   끝난 상태에서만 쓸 수 있습니다. 먼저 전체 빌드/분할/배포를 한 번 해주세요.')
    process.exit(1)
  }

  console.log(`[incremental-deploy] 키워드: ${keyword}  지역: ${regionPaths.length ? regionPaths.join(', ') : '(전체)'}`)
  console.log(`[incremental-deploy] 대상: ${mergeTargetDir} → ${project}`)

  const backupDir = join(tmpdir(), `pseo-out-backup-${Date.now()}`)
  const hadExistingOut = existsSync(OUT_DIR)
  if (hadExistingOut) renameSync(OUT_DIR, backupDir)

  let restored = false
  const restoreOut = () => {
    if (restored) return
    restored = true
    rmSync(OUT_DIR, { recursive: true, force: true })
    if (hadExistingOut) renameSync(backupDir, OUT_DIR)
  }

  try {
    console.log('[incremental-deploy] 필터링된 next build 실행 중...')
    execFileSync('npm', ['run', 'build'], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      env: { ...process.env, INCREMENTAL_KEYWORD: keyword, INCREMENTAL_REGION_PATHS: regionPaths.join('|') },
    })

    // 병합: 새로 구운(작은) out/에서 이 키워드 관련 파일 + 공용 정적 자산(_next 등)을
    // 뽑아 실제 배포 대상에 덮어쓴다.
    if (isRoot) {
      // 루트는 배포 대상 자체가 out/이므로, 보호해둔 backupDir(예전 out/)을 병합 대상으로 쓰고
      // 홈페이지(index.html/txt)도 항상 최신(전체 키워드 목록 반영)으로 같이 가져간다.
      extractKeywordSubtree(OUT_DIR, backupDir, keyword)
      mergeSharedAssets(OUT_DIR, backupDir)
      for (const f of ['index.html', 'index.txt']) {
        rmSync(join(backupDir, f), { force: true })
        cpSync(join(OUT_DIR, f), join(backupDir, f))
      }
    } else {
      extractKeywordSubtree(OUT_DIR, mergeTargetDir, keyword)
      mergeSharedAssets(OUT_DIR, mergeTargetDir)
    }

    // public/sitemap.xml은 generate-sitemap.mjs가 매 빌드마다 "전체" 키워드 기준으로 새로
    // 만든다(INCREMENTAL 필터의 영향을 안 받음) — 여기서 이 샤드 도메인 것만 걸러 쓴다.
    const fullSitemap = readFileSync(join(ROOT_DIR, 'public', 'sitemap.xml'), 'utf-8')
    const finalTarget = isRoot ? backupDir : mergeTargetDir
    writeFileSync(join(finalTarget, 'sitemap.xml'), filterSitemap(fullSitemap, domain), 'utf-8')
    writeFileSync(join(finalTarget, 'robots.txt'), `User-Agent: *\nAllow: /\n\nSitemap: ${domain}/sitemap.xml\n`, 'utf-8')

    restoreOut() // out/ 복원(루트면 방금 병합된 backupDir가 그대로 out/이 된다)

    console.log(`[incremental-deploy] ${mergeTargetDir} → ${project} 배포 중...`)
    execFileSync(
      'npx',
      ['wrangler', 'pages', 'deploy', isRoot ? 'out' : mergeTargetDir, `--project-name=${project}`, '--branch=main', '--commit-dirty=true'],
      { cwd: ROOT_DIR, stdio: 'inherit' }
    )

    console.log(`\n[incremental-deploy] 완료 ✅ ${domain}`)
  } catch (err) {
    console.error('[incremental-deploy] 실패:', err.message)
    restoreOut()
    process.exit(1)
  }
}

main()
