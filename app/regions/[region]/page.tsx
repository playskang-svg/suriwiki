import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { mockCompanyProfile } from "@/lib/mock-data";

/**
 * 지역 허브 (Level 1B). PRD 3.1-3, 4.2 참고.
 * TODO: 지역 내 공정 페이지, 지역 사례, 담당 전문가, 실제 인접 지역 링크
 */
export default function RegionHubPage({ params }: { params: { region: string } }) {
  return (
    <>
      <SiteHeader />
      <Breadcrumb items={[{ label: "홈", href: "/" }, { label: params.region }]} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">{params.region} 집수리</h1>
        <p className="mt-4 text-black/60">TODO: 지역 내 공정 목록 / 사례 / 전문가 / 인접 지역</p>
      </main>
      <SiteFooter company={mockCompanyProfile} />
    </>
  );
}
