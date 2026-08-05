import { Metadata } from "next";
import { CompanyProfile } from "./types";

interface KeywordSeoProps {
  categoryName: string;
  regionName: string;
  categorySlug: string;
  regionSlug: string;
  companyProfile: CompanyProfile;
}

export function generateKeywordPageMetadata({
  categoryName,
  regionName,
  categorySlug,
  regionSlug,
  companyProfile,
}: KeywordSeoProps): Metadata {
  const title = `${regionName} ${categoryName} 전문 출장복원 및 시공 | 수리위키 ${companyProfile.companyName}`;
  const description = `${regionName} 지역 ${categoryName} 현장 사진 기반 고품질 수리 전문. ${companyProfile.companyName} (${companyProfile.phoneNumber}). 파손·부식·스크래치 5분 빠른 사진 견적.`;
  const url = `https://sooriwiki.com/services/${categorySlug}/${regionSlug}/`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: `수리위키 - ${companyProfile.companyName}`,
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: "https://sooriwiki.com/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${regionName} ${categoryName} 수리전후 사례`,
        },
      ],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function generateJsonLd({
  categoryName,
  regionName,
  categorySlug,
  regionSlug,
  companyProfile,
}: KeywordSeoProps) {
  const url = `https://sooriwiki.com/services/${categorySlug}/${regionSlug}/`;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: `${companyProfile.companyName} - ${regionName} ${categoryName}`,
    url: url,
    telephone: companyProfile.phoneNumber,
    priceRange: "₩",
    address: {
      "@type": "PostalAddress",
      addressLocality: regionName,
      addressCountry: "KR",
    },
    openingHours: companyProfile.operatingHours,
    areaServed: companyProfile.serviceRegions.map((r) => ({
      "@type": "AdministrativeArea",
      name: r,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: "https://sooriwiki.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: `${categoryName} 허브`,
        item: `https://sooriwiki.com/services/${categorySlug}/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${regionName} ${categoryName}`,
        item: url,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${regionName} ${categoryName} 작업 시 소요되는 시간은 얼마나 되나요?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `일반적인 ${categoryName} 작업은 현장 상태에 따라 1시간~3시간 이내에 완료되며, 당일 바로 정상 사용이 가능합니다.`,
        },
      },
      {
        "@type": "Question",
        name: `견적을 받으려면 어떤 절차가 필요한가요?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${companyProfile.prepInstructions || "파손 부위 전경 사진 2장을 문자로 보내주시면 5분 내 정확한 견적을 안내해드립니다."}`,
        },
      },
    ],
  };

  return [localBusinessSchema, breadcrumbSchema, faqSchema];
}
