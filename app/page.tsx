import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import StatStrip from "@/components/common/StatStrip";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { fetchPublishedPages, pageLastModified, isAreaPage } from "@/lib/seo/sitemap";
import areasData from "@/data/areas.json";

export const revalidate = 3600;

export default async function Home() {
  // 실제로 발행된 페이지만 홈에서 링크한다.
  // 서비스 카드가 아직 없는 페이지를 가리키고 있어서 눌러도 전부 404 였고,
  // 정작 발행된 CASE 는 홈에서 갈 방법이 없었다.
  const published = (await fetchPublishedPages())
    .sort((a, b) => pageLastModified(b).getTime() - pageLastModified(a).getTime());

  // 시공 지역. 발행된 AREA 페이지가 있는 지역만 링크한다.
  // 페이지가 없는 지역까지 링크하면 눌러서 404 가 나는 링크가 다시 생긴다 (F1).
  const areaPageSlugs = new Set(published.filter(isAreaPage).map(p => p.slug));
  const serviceAreas = areasData.areas
    .filter(a => a.parent === null)
    .map(a => ({ ...a, href: areaPageSlugs.has(`area/${a.slug}`) ? `/area/${a.slug}` : null }));

  return (
    <>
      <Header />
      <main className="flex flex-col relative w-full pt-16 pb-32 bg-surface">
        <div className="flex flex-col w-full bg-surface">
          {/* Hero Section */}
          {/*
            히어로 배경: 실제 사진이 준비될 때까지 이미지를 깔지 않는다.
            자리표시자를 배경으로 쓰면 "이미지 준비 중" 도형이 헤드라인 위에 겹쳐 보이고,
            시공 사진처럼 보이는 아무 이미지를 끼우는 것은 사실성 규칙 위반이다 (docs/17 §8-5).
            프로필에 hero 가 채워지면 그때 배경으로 깐다.
          */}
          <section
            className="relative w-full h-[65vh] min-h-[500px] flex items-end pb-stack-lg"
            style={{
              backgroundImage: siteConfig.assets?.hero
                ? `linear-gradient(to top, rgba(0, 16, 56, 0.88) 0%, rgba(0, 35, 111, 0.55) 55%, rgba(0, 35, 111, 0.35) 100%), url('${siteConfig.assets.hero}')`
                : "linear-gradient(to top, #001038 0%, #00236f 60%, #123a94 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="w-full px-grid-margin-mobile md:px-grid-margin-desktop text-on-primary max-w-7xl mx-auto">
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg mb-stack-md leading-tight">
                전체 교체 없이,<br />상한 곳만 정확히 되살립니다
              </h1>
              {/* 어두운 히어로 배경 위라 밝은 색을 쓴다. text-primary(#00236f)는 배경에 묻힌다. */}
              <p className="font-body-lg text-[18px] md:text-[24px] text-on-primary font-medium mb-stack-md md:mb-12 break-keep text-center md:text-left drop-shadow-sm opacity-90 max-w-xl mx-auto md:mx-0">
                <span className="text-primary-fixed-dim font-bold">{siteConfig.brand.name}</span>는 비용이 많이 드는 전체 교체를 권하지 않습니다.<br />꼭 필요한 부분만 정확히 찾아내어 새것처럼 되살려 드립니다.
              </p>
              {/* <button> 이라 아무 동작도 하지 않았다. 전화가 실제 전환 경로다. */}
              <a
                href={`tel:${siteConfig.contact.phone.replace(/[^0-9]/g, "")}`}
                className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-4 rounded-xl font-headline-md text-[18px] inline-flex items-center justify-center gap-2 w-full md:w-auto shadow-lg transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined">call</span>
                <span>{siteConfig.contact.phone} 전화 상담</span>
              </a>
            </div>
          </section>

          <StatStrip />

          {/* Service Categories */}
          <section id="services" className="w-full px-grid-margin-mobile md:px-grid-margin-desktop py-section-gap max-w-7xl mx-auto">
            <div className="mb-stack-lg">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">실제 시공 사례</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">현장에서 기록한 문제·진단·공정·결과를 그대로 공개합니다</p>
                </div>
                {published.length > 0 && (
                  <Link href="/cases" className="shrink-0 font-status-label text-status-label text-primary hover:underline flex items-center gap-1">
                    전체보기
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </Link>
                )}
              </div>
            </div>
            {published.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-gutter">
                {published.map(page => (
                  <ServiceCard
                    key={page.slug}
                    title={page.title}
                    desc={page.meta_description || page.search_intent}
                    href={`/${page.slug}`}
                  />
                ))}
              </div>
            ) : (
              /* 발행된 페이지가 없으면 죽은 링크를 늘어놓지 않고 상태를 그대로 말한다. */
              <div className="bg-surface-container-low rounded-2xl p-stack-lg text-center">
                <p className="font-body-md text-on-surface-variant">
                  시공 사례를 준비하고 있습니다. 수리가 필요하시면 전화로 문의해 주세요.
                </p>
              </div>
            )}
          </section>

          {/* 시공 지역 */}
          <section id="areas" className="w-full px-grid-margin-mobile md:px-grid-margin-desktop pb-section-gap max-w-7xl mx-auto">
            <div className="mb-stack-md">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">시공 지역</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                아래 지역에서 방문 시공하고 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {serviceAreas.map(a =>
                a.href ? (
                  <Link
                    key={a.slug}
                    href={a.href}
                    className="px-4 py-2.5 rounded-full bg-surface-clean border border-border-subtle font-status-label text-status-label text-on-surface hover:border-primary hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                    {a.label}
                  </Link>
                ) : (
                  /* 아직 사례가 없는 지역은 링크하지 않는다. 문의는 전화로 받는다. */
                  <span
                    key={a.slug}
                    className="px-4 py-2.5 rounded-full bg-surface-container-low font-status-label text-status-label text-on-surface-variant flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {a.label}
                  </span>
                )
              )}
            </div>
          </section>

          {/* Core Strengths */}
          <section className="w-full bg-surface-container-low py-section-gap">
            <div className="px-grid-margin-mobile md:px-grid-margin-desktop max-w-7xl mx-auto mb-stack-lg">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">왜 {siteConfig.brand.name}인가요?</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">타협하지 않는 디테일의 차이</p>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pl-grid-margin-mobile md:pl-grid-margin-desktop md:justify-center pr-grid-margin-mobile gap-stack-md pb-4">
              <StrengthCard icon="search" title="사전 방문 서비스" desc="정확한 진단 없이는 완벽한 복원도 없습니다. 시공 전 현장을 방문하여 상태를 꼼꼼히 점검합니다." />
              <StrengthCard icon="palette" title="정밀 조색 기술" desc="기존 소재와의 이질감을 최소화하기 위해 수십 번의 조색 테스트를 거쳐 완벽한 컬러 매칭을 구현합니다." />
              <StrengthCard icon="shield_with_house" title="철저한 보양 작업" desc="작업 중 발생할 수 있는 2차 손상과 분진을 막기 위해 시공 부위 주변을 철저하게 보양합니다." />
              <StrengthCard icon="task_alt" title="당일 완료 원칙" desc="고객님의 소중한 일상에 불편함이 없도록, 약속된 일정 내에 신속하고 정확하게 시공을 마무리합니다." />
            </div>
          </section>



          {/* Bottom CTA */}
          <section id="consult" className="w-full px-grid-margin-mobile md:px-grid-margin-desktop pb-section-gap pt-stack-lg mt-auto max-w-7xl mx-auto">
            <div className="bg-primary-container rounded-3xl p-stack-lg md:p-12 text-center relative overflow-hidden flex flex-col items-center">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
              <div className="relative z-10 flex flex-col items-center">
                <span className="material-symbols-outlined text-[48px] text-on-primary-container mb-4">photo_camera</span>
                <h2 className="font-headline-lg text-[24px] md:text-[32px] text-on-primary mb-3">수리가 필요한 곳이 있나요?</h2>
                <p className="font-body-md text-on-primary-container max-w-2xl text-center md:text-left opacity-90">우리 동네 수많은 집들이 이미 <span className="font-bold">{siteConfig.brand.name}</span>의 부분 수리로 새 생명을 얻었습니다. 검증된 수리 사례를 확인해보세요.</p>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <a
                    href={`tel:${siteConfig.contact.phone.replace(/[^0-9]/g, "")}`}
                    className="bg-on-primary text-primary w-full md:w-auto px-8 py-4 rounded-xl font-headline-md text-[18px] inline-flex items-center justify-center gap-2 shadow-lg hover:bg-surface-clean transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">call</span>
                    전화로 상담하기
                  </a>
                  {siteConfig.contact.kakao_url && (
                    <a
                      href={siteConfig.contact.kakao_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#FEE500] text-[#3C1E1E] w-full md:w-auto px-8 py-4 rounded-xl font-headline-md text-[18px] inline-flex items-center justify-center gap-2 shadow-lg hover:brightness-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                      사진 보내기
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-5 z-40 flex flex-col gap-3 md:hidden">
        <a href={`tel:${siteConfig.contact.phone.replace(/[^0-9]/g, '')}`} className="w-14 h-14 bg-amber-point rounded-full shadow-lg flex items-center justify-center text-white transition-transform active:scale-95">
          <span className="material-symbols-outlined">call</span>
        </a>
        <a href={siteConfig.contact.kakao_url || '#'} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-[#FEE500] rounded-full shadow-lg flex items-center justify-center text-[#3C1E1E] transition-transform active:scale-95">
          <span className="material-symbols-outlined">chat</span>
        </a>
      </div>

      <BottomNav />
    </>
  );
}

/*
  같은 자리표시자 이미지를 카드마다 반복해 넣지 않는다 (docs/17 §8-5).
  실제 시공 사진은 각 사례 페이지 안에 있다.
*/
function ServiceCard({ title, desc, href }: { title: string, desc: string, href: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 bg-surface-clean border border-border-subtle rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
    >
      <h3 className="font-headline-md text-[18px] text-on-surface flex items-start gap-1 group-hover:text-primary transition-colors break-keep">
        <span className="flex-1">{title}</span>
        <span className="material-symbols-outlined text-[18px] mt-1 shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">chevron_right</span>
      </h3>
      <p className="font-body-md text-[14px] text-on-surface-variant line-clamp-2 break-keep">{desc}</p>
    </Link>
  );
}

function StrengthCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="snap-start shrink-0 w-64 md:w-72 bg-surface-clean p-6 rounded-2xl shadow-sm border border-border-subtle flex flex-col gap-4">
      <div className="w-12 h-12 rounded-full bg-trust-blue/10 flex items-center justify-center text-deep-navy">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <div>
        <h4 className="font-headline-md text-[18px] text-on-surface mb-2">{title}</h4>
        <p className="font-body-md text-[14px] text-on-surface-variant line-clamp-3">{desc}</p>
      </div>
    </div>
  );
}
