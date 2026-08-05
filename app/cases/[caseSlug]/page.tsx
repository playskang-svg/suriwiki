import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { mockCompanyProfile } from "@/lib/mock-data";

/**
 * 시공 사례 (Level 3). PRD 2.2, 4.2, 5.3(품질 게이트) 참고.
 * TODO: 지역×공정 페이지·공정 허브·지역 허브·담당 전문가·유사 사례 링크
 */
export default function ProjectCasePage({ params }: { params: { caseSlug: string } }) {
  return (
    <>
      <SiteHeader />
      <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "시공 사례" }]} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">시공 사례: {params.caseSlug}</h1>
        <p className="mt-4 text-black/60">TODO: 전·후 사진, 작업 상세, 검수자·작성일</p>
      </main>
      <SiteFooter company={mockCompanyProfile} />
    </>
  );
}
