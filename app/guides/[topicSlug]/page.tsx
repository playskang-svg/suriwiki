import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { mockCompanyProfile } from "@/lib/mock-data";

/**
 * 정보 가이드. PRD 2.2(검수 완료 시 index), 4.2 참고.
 * TODO: 관련 공정 허브, 적용 가능한 사례, 상담 페이지 링크
 */
export default function GuidePage({ params }: { params: { topicSlug: string } }) {
  return (
    <>
      <SiteHeader />
      <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "가이드" }]} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">가이드: {params.topicSlug}</h1>
        <p className="mt-4 text-black/60">TODO: 문제 해결 가이드 본문</p>
      </main>
      <SiteFooter company={mockCompanyProfile} />
    </>
  );
}
