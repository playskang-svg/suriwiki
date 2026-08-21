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
  const all = await fetchAreaTree();

  /*
    광역시·특별시·도 단위만 버튼으로 낸다.
    areas 테이블에는 초기 데이터에서 넘어온 "김해" · "평택" · "서울 강남구" 같은
    최상위 행이 섞여 있는데, 이것들은 하위 지역이 없는 시군구급이라
    시도 버튼에 끼면 "김해"가 광역시처럼 보인다.
    하위 지역을 가진 것만 광역 단위로 본다. (해당 지역 페이지 자체는 그대로 살아 있다.)
  */
  const tree = all.filter(t => t.children.length > 0);
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
            지역을 누르면 해당 시·군·구가 펼쳐집니다.
            지역별 시공 사례는 실제 작업한 현장이 생기는 대로 공개합니다.
          </p>

          {/*
            광역시·특별시·도 단위 버튼만 늘어놓고, 누른 하나만 펼친다.

            <details name="..."> 은 같은 name 을 가진 것 중 하나만 열리게 하는
            HTML 표준 동작(exclusive accordion)이다. 자바스크립트가 필요 없어
            서버 컴포넌트로 남고, 지원하지 않는 구형 브라우저에서는
            그냥 일반 아코디언으로 동작한다 — 기능이 사라지지는 않는다.
          */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {tree.map(sido => (
              <details
                key={sido.slug}
                name="region"
                className="group bg-surface-clean border border-border-subtle rounded-xl open:col-span-2 sm:open:col-span-3 md:open:col-span-4 open:border-primary/40 transition-colors"
              >
                <summary className="flex items-center justify-between gap-1 px-3 py-3 cursor-pointer rounded-xl hover:bg-surface-container-low transition-colors">
                  <span className="font-headline-md text-[15px] md:text-[16px] text-on-surface group-open:text-primary transition-colors break-keep">
                    {sido.label}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    {sido.children.length > 0 && (
                      <span className="font-status-label text-[12px] text-on-surface-variant">
                        {sido.children.length}
                      </span>
                    )}
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform group-open:rotate-180">
                      expand_more
                    </span>
                  </span>
                </summary>

                <div className="px-4 pb-4 pt-1 border-t border-border-subtle">
                  <Link
                    href={`/area/${sido.slug}`}
                    className="inline-flex items-center gap-1 mb-3 font-status-label text-status-label text-primary hover:underline"
                  >
                    {sido.label} 전체 보기
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
                  {sido.children.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {sido.children.map(gu => (
                        <Link
                          key={gu.slug}
                          href={`/area/${gu.slug}`}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-container-low font-status-label text-status-label text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                        >
                          {gu.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </details>
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
