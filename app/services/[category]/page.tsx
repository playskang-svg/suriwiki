import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { mockCompanyProfile } from "@/lib/mock-data";

/**
 * 공정 허브 (Level 1A). PRD 2.2, 3.1-2, 12.5(22개 카테고리) 참고.
 * 예: /services/wallpaper-restoration
 * TODO: 해당 공정의 지역 페이지 목록, 대표 사례, 관련 가이드, 전문가 목록 (4.2 필수 링크 규칙)
 */
export default function ServiceHubPage({
  params,
}: {
  params: { category: string };
}) {
  return (
    <>
      <SiteHeader />
      <Breadcrumb items={[{ label: "홈", href: "/" }, { label: params.category }]} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">{params.category} 서비스 허브</h1>
        <p className="mt-4 text-black/60">
          TODO: 지역 페이지 목록 / 대표 시공 사례 / 관련 가이드 / 담당 전문가
        </p>
      </main>
      <SiteFooter company={mockCompanyProfile} />
    </>
  );
}
