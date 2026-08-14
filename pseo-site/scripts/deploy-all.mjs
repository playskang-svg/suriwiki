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
// generate-sitemap.mjs와 같은 이유로 직접 읽는다. 지금은 이 스크립트 자체가 SITE_URL을
// 안 써서(루트 프로젝트명은 아래 ROOT_PROJECT_NAME 상수 고정값) 당장 필수는 아니지만,
// 다른 스크립트들과 패턴을 맞춰 두면 나중에 이 파일이 다른 env 값을 필요로 하게 되어도
// 바로 쓸 수 있다.
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

// ⚠️ 루트 Cloudflare Pages 프로젝트명은 SITE_URL에서 거꾸로 추측하지 않는다 — 커스텀
// 도메인(dj.adbles.com 등)을 프로젝트에 연결한 뒤에는 SITE_URL이 더 이상 *.pages.dev가
// 아니게 되고, 그러면 "URL의 호스트명 = 프로젝트명"이라는 가정이 깨진다(실제로 2026-08-14
// 커스텀 도메인 연결 직후 이 가정 때문에 "The Pages project 'dj.adbles.com' does not
// exist" 에러로 배포가 실패했다). 프로젝트명은 도메인이 뭐로 바뀌든 항상 고정이므로
// 그냥 상수로 둔다 — lib/constants.ts KEYWORD_SITE_URL의 도배장판 항목과 짝이 맞는 값.
const ROOT_PROJECT_NAME = 'suriwiki-pseo'
const DEPLOY_TARGETS = [
  { dir: 'out', project: ROOT_PROJECT_NAME },
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
