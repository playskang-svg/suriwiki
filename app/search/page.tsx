import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { mockCompanyProfile } from "@/lib/mock-data";

/** 내부 검색·필터 결과. PRD 2.2, 8.2 참고 — noindex,follow, 사이트맵 제외 */
export const metadata = {
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">검색</h1>
        <p className="mt-4 text-black/60">TODO: 검색 결과 목록</p>
      </main>
      <SiteFooter company={mockCompanyProfile} />
    </>
  );
}
