/**
 * gen-indexnow-key.ts — IndexNow 키 파일을 public/<key>.txt 로 생성한다.
 *
 * 네이버 서치어드바이저가 추천하는 방식은 **루트 디렉터리에 `<key>.txt` 이름으로** 두는 것이다.
 *   https://suriwiki.com/4257f49271086ed5ec527bb4b684e97c.txt  ← 내용도 같은 key 문자열
 *
 * 다른 경로에 두고 keyLocation 으로 알리는 방법도 규격상 유효하지만,
 * 그 경우 **키 파일이 있는 디렉터리 이하의 페이지만** 갱신을 알릴 수 있다는 제약이 붙는다.
 * 루트에 표준 이름으로 두면 그 제약이 없다.
 *
 * 키는 프로필(config/profiles/<name>.json)이나 INDEXNOW_KEY 환경변수에서 온다.
 * 파일명이 키에 따라 달라지므로 정적 파일로 저장소에 넣지 않고 빌드마다 생성한다.
 *
 * 사용: npx tsx scripts/gen-indexnow-key.ts   (npm run build 가 자동 실행)
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// 네이버·IndexNow 규격: 16진수 문자와 하이픈만, 8~128자
const KEY_PATTERN = /^[a-fA-F0-9-]{8,128}$/;
const KEY_FILE_PATTERN = /^[a-fA-F0-9-]{8,128}\.txt$/;

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public');

  // dotenv 로 .env.local 을 올린 뒤에 읽어야 환경변수 오버라이드가 반영된다.
  const { siteConfig } = await import('../config/site');
  const key = siteConfig.indexnow_key ?? null;

  fs.mkdirSync(publicDir, { recursive: true });

  // 키가 바뀌면 옛 키 파일이 남아 있으면 안 된다. 검색엔진이 옛 키로도 검증에 성공해버린다.
  // 이름이 키 형식인 .txt 만 지운다 — robots·ads 같은 다른 txt 는 건드리지 않는다.
  const stale = fs
    .readdirSync(publicDir)
    .filter(f => KEY_FILE_PATTERN.test(f) && f !== `${key}.txt`);
  for (const f of stale) {
    fs.unlinkSync(path.join(publicDir, f));
    console.log(`  옛 키 파일 삭제: public/${f}`);
  }

  if (!key) {
    // 키가 없는 것은 에러가 아니다 — IndexNow 를 아직 안 쓰는 상태일 수 있다.
    // 다만 조용히 넘어가지 않고 무엇이 비활성인지 알린다.
    console.log('! IndexNow 키가 없습니다 — 즉시 색인 요청이 비활성 상태입니다.');
    console.log('  프로필의 indexnow_key 나 INDEXNOW_KEY 환경변수를 설정하세요.');
    return;
  }

  if (!KEY_PATTERN.test(key)) {
    console.error(`ERROR: IndexNow 키 형식이 잘못됐습니다: ${key}`);
    console.error('       16진수 문자(a-f, A-F, 0-9)와 하이픈만, 8~128자여야 합니다.');
    process.exit(1);
  }

  const outPath = path.join(publicDir, `${key}.txt`);
  fs.writeFileSync(outPath, key, 'utf-8');
  console.log(`✓ public/${key}.txt  (IndexNow 소유 확인 키)`);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
