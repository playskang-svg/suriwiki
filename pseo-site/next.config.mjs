/**
 * 요구사항 1-3: output:'export'로 순수 정적 파일(SSG)만 생성한다.
 * 이 값 때문에 이 프로젝트 안에서는 서버 전용 기능(미들웨어, 동적 API 라우트,
 * next/image 최적화 서버 등)을 쓸 수 없다 — 대신 Cloudflare Pages 등
 * 어떤 정적 호스팅에도 무료로 올릴 수 있다.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'export',
  images: {
    // 정적 export에는 이미지 최적화 서버가 없으므로 필수. <img> 태그를 그대로 사용한다.
    unoptimized: true,
  },
  reactStrictMode: true,
  trailingSlash: false,
};

export default nextConfig;
