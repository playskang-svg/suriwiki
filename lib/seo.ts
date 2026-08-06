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
  const description = `${regionName} 지역 ${categoryName} 전화 상담 기반 고품질 수리 전문. ${companyProfile.companyName} (${companyProfile.phoneNumber}). 파손·부식·스크래치 5분 빠른 전화 견적.`;
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

interface CategorySeoProps {
  categoryName: string;
  categorySlug: string;
  companyProfile: CompanyProfile;
}

/**
 * 공정 허브(카테고리) 페이지 메타데이터. 지역×공정 페이지가 "지역+공정" 롱테일 키워드를 노리는 것과 달리,
 * 허브 페이지는 "공정명" 자체의 대표 키워드(예: 문수리, 문수리 업체, 문수리 비용)를 노린다.
 * 두 레벨 모두 제목·설명 맨 앞에 실제 키워드가 그대로 오도록 해서 키워드별 검색 1위를 목표로 한다.
 */
export function generateCategoryPageMetadata({
  categoryName,
  categorySlug,
  companyProfile,
}: CategorySeoProps): Metadata {
  const title = `${categoryName} 전문 업체 | 수도권 출장 복원·시공 - 수리위키`;
  const description = `${categoryName} 파손·부식·마모 부분 복원 전문. 서울·경기·인천 전지역 출장, 전화 상담 5분 견적. ${companyProfile.companyName}이(가) 지역별 ${categoryName} 페이지를 통해 안내해드립니다.`;
  const url = `https://sooriwiki.com/services/${categorySlug}/`;

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
          alt: `${categoryName} 수리 전후 사례`,
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

export function generateCategoryJsonLd({ categoryName, categorySlug }: Omit<CategorySeoProps, "companyProfile">) {
  const url = `https://sooriwiki.com/services/${categorySlug}/`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: categoryName,
    areaServed: { "@type": "Country", name: "대한민국" },
    url,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://sooriwiki.com/" },
      { "@type": "ListItem", position: 2, name: `${categoryName} 허브`, item: url },
    ],
  };

  return [serviceSchema, breadcrumbSchema];
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
          text: `${companyProfile.prepInstructions || "전화 상담으로 현장 상황을 알려주시면 5분 내 정확한 견적을 안내해드립니다."}`,
        },
      },
    ],
  };

  return [localBusinessSchema, breadcrumbSchema, faqSchema];
}
