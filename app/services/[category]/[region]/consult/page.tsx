import type { Metadata } from "next";
import { MAIN_CATEGORIES, REGIONS_DATA } from "@/lib/store";
import { ConsultPageClient } from "./consult-client";

/**
 * 상담문의 페이지는 세부 키워드 페이지와 1:1로 짝을 이루는 전환 전용 페이지라 검색 노출 대상이
 * 아니다 (PRD 2.2, 11.2). 클라이언트 컴포넌트("use client")는 metadata를 export할 수 없어서
 * 이 파일을 서버 컴포넌트 래퍼로 분리했다 — 예전에는 noindex 지정이 아예 빠져 있었다.
 */
export function generateMetadata({
  params,
}: {
  params: { category: string; region: string };
}): Metadata {
  const category = MAIN_CATEGORIES.find((c) => c.slug === params.category);
  const region = REGIONS_DATA.find((r) => r.slug === params.region);
  const title =
    category && region
      ? `${region.name} ${category.name} 상담문의 | 수리위키`
      : "상담문의 | 수리위키";

  return {
    title,
    robots: { index: false, follow: true },
  };
}

export default function ConsultPage({
  params,
}: {
  params: { category: string; region: string };
}) {
  return <ConsultPageClient params={params} />;
}
