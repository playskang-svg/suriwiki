import type { Metadata } from "next";
import { Noto_Sans_KR, Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";

const notoSansKr = Noto_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--font-noto",
});

const inter = Inter({
  weight: ["600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = siteConfig.brand.site_url;

// 검색엔진 콘솔에서 받은 소유 확인 코드. 값이 없으면 태그 자체를 렌더하지 않는다.
const verification = siteConfig.verification ?? { naver: null, google: null, bing: null };
const otherVerification: Record<string, string> = {};
if (verification.naver) otherVerification["naver-site-verification"] = verification.naver;
if (verification.bing) otherVerification["msvalidate.01"] = verification.bing;

export const metadata: Metadata = {
  // 없으면 OG·canonical 의 상대경로가 절대 URL 로 안 펴진다.
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${siteConfig.brand.name}`,
    default: `${siteConfig.brand.name} - ${siteConfig.brand.tagline}`,
  },
  description: siteConfig.brand.tagline,
  openGraph: {
    title: siteConfig.brand.name,
    description: siteConfig.brand.tagline,
    url: SITE_URL,
    siteName: siteConfig.brand.name,
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.brand.name,
    description: siteConfig.brand.tagline,
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": `${SITE_URL}/rss.xml`,
    },
  },
  verification: {
    ...(verification.google ? { google: verification.google } : {}),
    ...(Object.keys(otherVerification).length ? { other: otherVerification } : {}),
  },
};

/**
 * 사이트 전역 구조화 데이터.
 *
 * 생성형 검색(AI 답변)이 출처를 고를 때 "이 사이트가 무엇을 하는 누구인가"를 먼저 본다.
 * 페이지별 Article·FAQ 만으로는 그 질문에 답이 안 되므로 Organization·WebSite 를 루트에 둔다.
 *
 * telephone·areaServed 는 설정에 실제로 들어 있는 값만 쓴다. 없는 자격·수치는 넣지 않는다(F3·F7).
 */
function buildSiteJsonLd() {
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: siteConfig.brand.name,
    url: SITE_URL,
    description: siteConfig.brand.tagline,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      addressCountry: "KR",
      addressLocality: siteConfig.contact.address,
    },
  };
  if (siteConfig.assets?.logo) {
    organization.logo = `${SITE_URL}${siteConfig.assets.logo}`;
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: siteConfig.brand.name,
        description: siteConfig.brand.tagline,
        inLanguage: "ko-KR",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${inter.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${siteConfig.brand.name} RSS`}
          href={`${SITE_URL}/rss.xml`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSiteJsonLd()) }}
        />
      </head>
      <body className="bg-surface text-on-surface font-body-md antialiased">
        {children}
      </body>
    </html>
  );
}
