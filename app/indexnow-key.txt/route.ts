/**
 * IndexNow 키 파일 — /indexnow-key.txt
 *
 * 검색엔진이 이 주소를 열어 본문이 요청에 실린 key 와 같은지 확인한다. 같아야 소유자로 인정한다.
 * 비밀값이 아니다 — 공개로 서빙돼야 검증이 된다.
 *
 * 키가 없으면 200 에 빈 본문을 주지 말고 404 를 준다.
 * 빈 파일이 200 으로 뜨면 검색엔진은 "키가 틀렸다"가 아니라 "검증 실패"로 처리하고,
 * 그 상태가 왜 생겼는지 추적하기 어려워진다.
 */
import { getIndexNowKey } from '@/lib/seo/indexnow';

export function GET() {
  const key = getIndexNowKey();
  if (!key) {
    return new Response('IndexNow key not configured', { status: 404 });
  }
  return new Response(key, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
