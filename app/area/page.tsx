/**
 * /area — 전국 지역 인덱스 (시도 → 시군구).
 *
 * 지역 페이지가 3,811개라 개별 페이지를 전부 색인시키면 얇은 콘텐츠가 대량으로 쌓인다.
 * 이 인덱스만 색인시키고, 개별 지역 페이지는 실제 사례가 생긴 곳만 색인한다
 * (app/area/[area]/page.tsx 의 robots 설정 참고).
 */
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { siteConfig } from "@/config/site";
import { fetchAreaTree } from "@/lib/data/areas";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: `시공 가능 지역 | ${siteConfig.brand.name}` },
  description: "전국 시·도와 시군구별 부분 수리 시공 안내입니다.",
  alternates: { canonical: "/area" },
};

export default async function AreaIndexPage() {
  const tree = await fetchAreaTree();
  const telHref = `tel:${siteConfig.contact.phone.replace(/[^0-9]/g, "")}`;
  const total = tree.reduce((n, t) => n + t.children.length, 0) + tree.length;

  return (
    <>
      <Header />
      <main className="flex flex-col relative w-full pt-16 pb-32 bg-surface">
        <div className="w-full max-w-5xl mx-auto px-grid-margin-mobile md:px-grid-margin-desktop">
          <nav aria-label="위치" className="py-stack-md flex items-center gap-1.5 text-status-label font-status-label text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">홈</Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface">시공 지역</span>
          </nav>

          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">시공 가능 지역</h1>
          <p className="font-body-md text-on-surface-variant mb-stack-lg break-keep">
            전국 {tree.length}개 시·도, {total.toLocaleString()}개 지역을 안내합니다.
            지역별 시공 사례는 실제 작업한 현장이 생기는 대로 공개합니다.
          </p>

          <div className="flex flex-col gap-stack-lg">
            {tree.map(sido => (
              <section key={sido.slug}>
                <h2 className="font-headline-md text-[20px] text-on-surface mb-stack-sm flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full" />
                  <Link href={`/area/${sido.slug}`} className="hover:text-primary transition-colors">
                    {sido.label}
                  </Link>
                  {sido.children.length > 0 && (
                    <span className="font-body-md text-[14px] text-on-surface-variant">
                      {sido.children.length}개 지역
                    </span>
                  )}
                </h2>
                {sido.children.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sido.children.map(gu => (
                      <Link
                        key={gu.slug}
                        href={`/area/${gu.slug}`}
                        className="px-3 py-1.5 rounded-lg bg-surface-clean border border-border-subtle font-status-label text-status-label text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                      >
                        {gu.label}
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          <div className="mt-stack-lg bg-primary-container rounded-2xl p-stack-lg text-center">
            <p className="font-body-md text-on-primary-container mb-stack-md break-keep">
              찾으시는 지역이 목록에 없거나 시공 가능 여부가 궁금하시면 전화로 확인해 드립니다.
            </p>
            <a href={telHref} className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-headline-md">
              <span className="material-symbols-outlined text-[20px]">call</span>
              {siteConfig.contact.phone}
            </a>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
