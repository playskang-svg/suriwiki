/**
 * IndexNow — 새 페이지를 검색엔진에 즉시 알린다.
 *
 * 사이트맵·RSS 는 크롤러가 "언젠가" 가져가는 방식이라 지역·키워드 페이지를 계속 찍어내는
 * 이 사이트에서는 색인까지 며칠씩 밀린다. IndexNow 는 발행 시점에 밀어 넣는다.
 *
 * 네이버·빙·Yandex·Seznam 이 참여한다. 구글은 참여하지 않으므로 구글은 사이트맵으로 간다.
 *
 * 규격: https://www.indexnow.org/documentation
 *        https://searchadvisor.naver.com/guide/indexnow-preparation
 *   - key 는 비밀값이 아니다. 키 파일을 사이트에 공개로 올려야 소유 검증이 된다.
 *   - 키 파일은 **루트에 `<key>.txt` 이름으로** 둔다 (네이버 추천 방식).
 *     scripts/gen-indexnow-key.ts 가 빌드 때 public/<key>.txt 를 만든다.
 *   - 루트가 아닌 곳에 두면 그 디렉터리 이하 페이지만 갱신을 알릴 수 있다는 제약이 생긴다.
 */
import { siteConfig } from '@/config/site';

const ENDPOINTS = [
  // 범용 — 참여 엔진 전체로 전파된다
  'https://api.indexnow.org/indexnow',
  // 네이버 전용 — 범용 전파를 기다리지 않고 직접 넣는다
  'https://searchadvisor.naver.com/indexnow',
];

/** IndexNow 는 요청당 URL 1만 개까지 받는다. */
const MAX_URLS = 10000;

/** 키 파일 경로. 루트에 `<key>.txt` 로 둔다. */
export function indexNowKeyPath(key: string): string {
  return `/${key}.txt`;
}

export type IndexNowResult = {
  endpoint: string;
  ok: boolean;
  status: number | null;
  error?: string;
};

export function getIndexNowKey(): string | null {
  return siteConfig.indexnow_key ?? null;
}

/**
 * 발행·수정된 URL 을 알린다.
 *
 * 키가 없으면 호출한 쪽이 알 수 있도록 null 을 돌려준다.
 * 조용히 성공한 척하지 않는다 — 색인이 안 되는데 됐다고 믿는 게 제일 나쁘다.
 */
export async function pingIndexNow(urls: string[]): Promise<IndexNowResult[] | null> {
  const key = getIndexNowKey();
  if (!key) return null;
  if (!urls.length) return [];

  const siteUrl = new URL(siteConfig.brand.site_url);
  const payload = {
    host: siteUrl.host,
    key,
    keyLocation: `${siteUrl.origin}${indexNowKeyPath(key)}`,
    urlList: urls.slice(0, MAX_URLS),
  };

  return Promise.all(
    ENDPOINTS.map(async (endpoint): Promise<IndexNowResult> => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(payload),
        });
        return { endpoint, ok: res.ok, status: res.status };
      } catch (err) {
        return { endpoint, ok: false, status: null, error: String(err) };
      }
    })
  );
}
