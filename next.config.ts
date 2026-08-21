import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rgdejzrlszpesuodjejw.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  /**
   * 관례적인 별칭 주소를 실제 경로로 넘긴다.
   *
   * 피드·사이트맵은 사이트마다 경로가 제각각이라 사람도 크롤러도 흔한 이름부터 찔러본다.
   * 실제로 네이버 서치어드바이저에 /rss 를 넣었다가 404 를 받은 적이 있다.
   * 정식 주소는 하나로 유지하되(중복 색인을 만들지 않는다),
   * 흔한 별칭으로 와도 301 로 안내한다.
   */
  async redirects() {
    return [
      { source: '/rss', destination: '/rss.xml', permanent: true },
      { source: '/feed', destination: '/rss.xml', permanent: true },
      { source: '/feed.xml', destination: '/rss.xml', permanent: true },
      { source: '/atom.xml', destination: '/rss.xml', permanent: true },
      // /sitemap 만 정확히 매칭한다. /sitemap/core.xml 같은 분할 경로는 건드리지 않는다.
      { source: '/sitemap', destination: '/sitemap.xml', permanent: true },
      { source: '/sitemap_index.xml', destination: '/sitemap.xml', permanent: true },
    ];
  },
};

export default nextConfig;
