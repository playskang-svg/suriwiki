/**
 * scripts/deploy-all.mjs
 * ------------------------------------------------------------------------
 * scripts/split-by-keyword.mjs가 만들어 둔 out/ + out-로 시작하는 폴더들을
 * 각자의 Cloudflare Pages 프로젝트에 순서대로 배포한다.
 *
 * 실행 순서: npm run build → npm run split → node scripts/deploy-all.mjs
 * (또는 한 번에: npm run deploy)
 *
 * 하나라도 실패하면 즉시 멈춘다 — 어느 프로젝트가 옛날 버전인 채로 방치되는
 * 상황을 피하려고, 절반만 배포된 채 넘어가지 않는다.
 * ------------------------------------------------------------------------
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')

// next build를 거치지 않는 순수 node 스크립트라 Next의 자동 .env 로딩이 안 된다 —
// generate-sitemap.mjs와 같은 이유로 직접 읽는다. 이걸 빼먹으면 NEXT_PUBLIC_SITE_URL이
// undefined가 되어 기본값(example-pseo.pages.dev)으로 루트 프로젝트명을 잘못 계산한다
// (실제로 2026-08-14에 이 버그로 배포가 한 번 실패했다: "The Pages project
// 'example-pseo' does not exist").
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

// lib/constants.ts KEYWORD_SITE_URL과 동기화 유지 (같은 이유는 split-by-keyword.mjs 참고)
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://example-pseo.pages.dev').replace(/\/$/, '')
const DEPLOY_TARGETS = [
  { dir: 'out', project: new URL(SITE_URL).hostname.replace(/\.pages\.dev$/, '') },
  ...readdirSync(ROOT_DIR)
    .filter((name) => name.startsWith('out-') && existsSync(join(ROOT_DIR, name)))
    .map((dir) => ({ dir, project: `suriwiki-pseo-${dir.slice('out-'.length)}` })),
]

console.log('[deploy-all] 배포 대상:')
for (const t of DEPLOY_TARGETS) console.log(`  ${t.dir}/  →  ${t.project}`)
console.log()

for (const { dir, project } of DEPLOY_TARGETS) {
  const fullDir = join(ROOT_DIR, dir)
  if (!existsSync(fullDir)) {
    console.error(`[deploy-all] ${dir}/ 없음 — 중단`)
    process.exit(1)
  }
  console.log(`\n[deploy-all] ▶ ${dir}/ → ${project} 배포 중...`)
  try {
    execFileSync(
      'npx',
      ['wrangler', 'pages', 'deploy', dir, `--project-name=${project}`, '--branch=main', '--commit-dirty=true'],
      { cwd: ROOT_DIR, stdio: 'inherit' }
    )
  } catch (err) {
    console.error(`[deploy-all] ${project} 배포 실패 — 중단`)
    process.exit(1)
  }
}

console.log('\n[deploy-all] 전체 완료 ✅')
