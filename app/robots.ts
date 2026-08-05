import type { MetadataRoute } from "next";

/** PRD 8.1 robots 정책 — 관리자·미리보기·내부 API·상담문의 경로를 차단한다. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/preview", "/api", "*/consult"],
    },
    sitemap: "https://sooriwiki.com/sitemap.xml",
  };
}
