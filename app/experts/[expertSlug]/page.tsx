import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { mockCompanyProfile } from "@/lib/mock-data";

/**
 * 전문가·업체 페이지. PRD 2.2(검증 완료 시 index), 7장(LocalBusiness) 참고.
 * TODO: 담당 공정, 서비스 지역, 실제 사례 링크
 */
export default function ExpertPage({ params }: { params: { expertSlug: string } }) {
  return (
    <>
      <SiteHeader />
      <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "전문가" }]} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">전문가: {params.expertSlug}</h1>
        <p className="mt-4 text-black/60">TODO: 담당 공정 / 서비스 지역 / 실제 시공 사례</p>
      </main>
      <SiteFooter company={mockCompanyProfile} />
    </>
  );
}
