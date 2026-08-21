import { z } from 'zod';
import defaultProfile from './profiles/default.json';

// 프로필을 추가하면 여기에 등록한다.
// fs 로 읽지 않는 이유: 이 모듈은 M24 등 클라이언트 번들에 들어가는 컴포넌트에서도 import 된다.
// 브라우저에는 fs 가 없으므로 정적 import 라야 서버·클라이언트 양쪽에서 동작한다.
const PROFILES: Record<string, unknown> = {
  default: defaultProfile,
};

const profileSchema = z.object({
  profile: z.string(),
  brand: z.object({
    name: z.string().min(1),
    tagline: z.string().min(1),
    site_url: z.string().url(),
  }),
  contact: z.object({
    phone: z.string().regex(/^0\d{1,2}-\d{3,4}-\d{4}$/, '전화번호 형식 오류').refine(val => {
      if (process.env.NODE_ENV === 'production' && /0000-0000/.test(val)) {
        return false;
      }
      return true;
    }, '프로덕션 환경에서는 010-0000-0000 등 더미 전화번호를 사용할 수 없습니다.'),
    kakao_url: z.string().url().optional(),
    email: z.string().email(),
    business_hours: z.string(),
    owner: z.string(),
    biz_no: z.string(),
    address: z.string(),
  }),
  keyword_set: z.string(),
  area_scope: z.array(z.string()),
  certifications: z.array(z.string()),
  // 검색엔진 사이트 소유 확인 코드. null 이면 그 메타태그를 아예 렌더하지 않는다.
  // 빈 문자열로 렌더하면 소유 확인이 실패하는 게 아니라 "확인된 척"이 되므로 null 을 쓴다.
  verification: z.object({
    naver: z.string().nullable(),
    google: z.string().nullable(),
    bing: z.string().nullable(),
  }).optional(),
  // IndexNow 키. 비밀값이 아니다 — 키 파일을 사이트에 공개로 올려야 검증된다.
  indexnow_key: z.string().nullable().optional(),
  stats: z.object({
    count: z.string(),
    satisfaction: z.string(),
    colorMatch: z.string(),
  }).nullable(),
  assets: z.object({
    logo: z.string().nullable(),
    favicon: z.string().nullable(),
    og_image: z.string().nullable(),
    hero: z.string().nullable(),
    placeholder: z.string().nullable(),
  }).optional()
});

export type SiteConfig = z.infer<typeof profileSchema>;

function loadConfig(): SiteConfig {
  // NEXT_PUBLIC_ 접두사를 쓰는 이유: 서버와 브라우저가 같은 값을 봐야 한다.
  // 접두사가 없으면 브라우저에서 undefined 가 되어 hydration 불일치가 난다.
  const profileName = process.env.NEXT_PUBLIC_SITE_PROFILE || 'default';
  const source = PROFILES[profileName];

  if (!source) {
    throw new Error(
      `Site profile not found: "${profileName}". ` +
      `config/profiles/${profileName}.json 을 만들고 config/site.ts 의 PROFILES 에 등록하세요.`
    );
  }

  // 가져온 JSON 을 그대로 수정하지 않는다 (모듈 캐시가 공유된다)
  const raw = JSON.parse(JSON.stringify(source)) as Record<string, any>;

  // 환경변수 오버라이드 — Vercel 대시보드에서 값만 바꿔 redeploy 하는 경로
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    raw.brand.site_url = process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.NEXT_PUBLIC_SITE_PHONE) {
    raw.contact.phone = process.env.NEXT_PUBLIC_SITE_PHONE;
  }
  if (process.env.NEXT_PUBLIC_SITE_KAKAO_URL) {
    raw.contact.kakao_url = process.env.NEXT_PUBLIC_SITE_KAKAO_URL;
  }

  // 검색엔진 소유 확인 코드 — 콘솔에서 받은 값을 배포 환경변수로 넣는 경로.
  // NEXT_PUBLIC_ 접두사를 쓰는 이유는 이 값이 <head> 메타태그로 화면에 나가는 공개 정보이기 때문이다.
  raw.verification = raw.verification ?? { naver: null, google: null, bing: null };
  if (process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION) {
    raw.verification.naver = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION;
  }
  if (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION) {
    raw.verification.google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  }
  if (process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION) {
    raw.verification.bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
  }
  if (process.env.INDEXNOW_KEY) {
    raw.indexnow_key = process.env.INDEXNOW_KEY;
  }

  const parsed = profileSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Site profile validation failed for [${profileName}]:\n${parsed.error.message}`);
  }

  return parsed.data;
}

export const siteConfig = loadConfig();
