import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = siteConfig.brand.site_url;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /admin 은 관리 화면, /api 는 내부 엔드포인트, /dev 는 모듈 미리보기라 색인 대상이 아니다.
      disallow: ['/admin/', '/api/', '/dev/'],
    },
    // 사이트맵은 분할되어 /sitemap/<id>.xml 로 서빙된다.
    // 여기서는 그 목록을 담은 인덱스(app/sitemap.xml/route.ts)를 가리킨다.
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
