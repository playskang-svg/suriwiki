/**
 * ping-indexnow.ts — 발행된 URL 을 IndexNow 로 검색엔진에 알린다.
 *
 * 대상 URL 은 **실제 서비스 중인 사이트맵에서 읽는다.** 로컬 DB 를 다시 조회하지 않는다 —
 * 아직 배포되지 않은 URL 을 알리면 검색엔진이 404 를 가지러 오기 때문이다.
 * 사이트맵에 올라와 있다는 것은 곧 배포됐고 색인 대상이라는 뜻이다.
 *
 * 사용:
 *   npx tsx scripts/ping-indexnow.ts            # 보낼 목록만 보여준다
 *   npx tsx scripts/ping-indexnow.ts --apply    # 실제로 발송
 *
 * 네이버·빙·Yandex 가 IndexNow 에 참여한다. 구글은 참여하지 않으므로
 * 구글은 서치콘솔에 사이트맵을 제출해야 한다.
 */
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function fail(msg: string): never {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'suriwiki-indexnow/1.0' } });
  if (!res.ok) fail(`${url} → HTTP ${res.status}`);
  return res.text();
}

/** XML 에서 <loc> 값만 뽑는다. 파서를 붙일 만큼 복잡한 문서가 아니다. */
function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

async function main() {
  const apply = process.argv.includes('--apply');

  const { siteConfig } = await import('../config/site');
  const { pingIndexNow, getIndexNowKey, indexNowKeyPath } = await import('../lib/seo/indexnow');

  const key = getIndexNowKey();
  if (!key) fail('IndexNow 키가 없습니다. 프로필의 indexnow_key 또는 INDEXNOW_KEY 를 설정하세요.');

  const origin = new URL(siteConfig.brand.site_url).origin;

  // 키 파일이 실제로 공개돼 있어야 검색엔진이 소유를 검증한다. 먼저 확인한다.
  const keyUrl = `${origin}${indexNowKeyPath(key)}`;
  const keyBody = (await fetchText(keyUrl)).trim();
  if (keyBody !== key) {
    fail(`키 파일 내용이 키와 다릅니다: ${keyUrl}\n       본문 "${keyBody}" ≠ 키 "${key}"`);
  }
  console.log(`✓ 키 파일 확인  ${keyUrl}`);

  // 사이트맵 인덱스 → 분할 → URL
  const indexXml = await fetchText(`${origin}/sitemap.xml`);
  const parts = extractLocs(indexXml);
  console.log(`✓ 사이트맵 분할 ${parts.length}개`);

  const urls = new Set<string>();
  // 사이트맵에 안 실리는 진입점도 함께 알린다.
  for (const entry of ['/', '/cases', '/area']) urls.add(`${origin}${entry}`);

  for (const part of parts) {
    const xml = await fetchText(part);
    const locs = extractLocs(xml);
    console.log(`    ${part.replace(origin, '')}  ${locs.length}건`);
    for (const u of locs) urls.add(u);
  }

  const list = [...urls].sort();
  console.log(`\n보낼 URL ${list.length}건${apply ? '' : ' (미리보기)'}`);
  for (const u of list.slice(0, 5)) console.log(`  ${u.replace(origin, '')}`);
  if (list.length > 5) console.log(`  … 외 ${list.length - 5}건`);

  if (!apply) {
    console.log('\n실제로 발송하려면 --apply 를 붙여 다시 실행하세요.');
    return;
  }

  console.log('\n발송 중…');
  const results = await pingIndexNow(list);
  if (!results) fail('키가 없어 발송하지 못했습니다.');

  console.log();
  for (const r of results) {
    const host = new URL(r.endpoint).host;
    // 200/202 는 접수됨. 429 는 요청 과다, 403 은 키 검증 실패다.
    const mark = r.ok ? '✓' : '✗';
    console.log(`  ${mark} ${host.padEnd(28)} HTTP ${r.status ?? '-'}  접수 ${r.sent}건${r.error ? `  ${r.error}` : ''}`);
  }

  const okCount = results.filter(r => r.ok).length;
  console.log(`\n${okCount}/${results.length} 엔드포인트 접수 · URL ${list.length}건`);
  if (okCount === 0) {
    console.log('모두 실패했습니다. 키 파일 공개 여부와 도메인 일치를 확인하세요.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
