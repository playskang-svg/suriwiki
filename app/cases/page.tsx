/**
 * /cases — 발행된 모든 페이지를 공간별로 묶어 보여주는 목록.
 *
 * 이 사이트에는 목록 화면이 없어서, 홈에서 링크되지 않은 페이지는
 * 주소를 직접 치지 않는 한 도달할 방법이 없었다. 하단 네비의 "사례" 도 여기로 온다.
 */
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { siteConfig } from "@/config/site";
import { getCatalog } from "@/lib/data/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: `시공 사례 전체보기 | ${siteConfig.brand.name}` },
  description: "실제 현장에서 기록한 문제·진단·공정·결과를 공간별로 모아 봅니다.",
  alternates: { canonical: "/cases" },
};

export default async function CasesPage() {
  const { all, groups } = await getCatalog();
  const telHref = `tel:${siteConfig.contact.phone.replace(/[^0-9]/g, "")}`;

  return (
    <>
      <Header />
      <main className="flex flex-col relative w-full pt-16 pb-32 bg-surface">
        <div className="w-full max-w-5xl mx-auto px-grid-margin-mobile md:px-grid-margin-desktop">
          <nav aria-label="위치" className="py-stack-md flex items-center gap-1.5 text-status-label font-status-label text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">홈</Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface">시공 사례</span>
          </nav>

          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">시공 사례 전체보기</h1>
          <p className="font-body-md text-on-surface-variant mb-stack-lg">
            {all.length > 0
              ? `현재 ${all.length}건을 공개하고 있습니다. 실제 현장 기록만 싣습니다.`
              : "공개된 사례를 준비하고 있습니다."}
          </p>

          {groups.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-stack-lg text-center">
              <p className="font-body-md text-on-surface-variant mb-stack-md">
                아직 공개된 사례가 없습니다. 수리가 필요하시면 전화로 문의해 주세요.
              </p>
              <a href={telHref} className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-headline-md">
                <span className="material-symbols-outlined text-[20px]">call</span>
                {siteConfig.contact.phone}
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-stack-lg">
              {groups.map((g, gi) => (
                <section key={g.space?.id ?? `etc-${gi}`}>
                  <h2 className="font-headline-md text-[20px] text-on-surface mb-stack-md flex items-center gap-2">
                    <span className="w-1 h-5 bg-primary rounded-full" />
                    {g.space?.label ?? "기타"}
                    <span className="font-body-md text-[14px] text-on-surface-variant">{g.entries.length}건</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
                    {g.entries.map(e => (
                      <Link
                        key={e.slug}
                        href={`/${e.slug}`}
                        className="group bg-surface-clean border border-border-subtle rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col gap-2"
                      >
                        <span className="font-label-caps text-[11px] text-primary">{e.pageType}</span>
                        <h3 className="font-headline-md text-[17px] text-on-surface group-hover:text-primary transition-colors break-keep">
                          {e.title}
                        </h3>
                        {e.summary && (
                          <p className="font-body-md text-[14px] text-on-surface-variant line-clamp-2 break-keep">{e.summary}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
