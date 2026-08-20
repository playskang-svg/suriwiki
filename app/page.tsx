import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import StatStrip from "@/components/common/StatStrip";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col relative w-full pt-16 pb-32 bg-surface">
        <div className="flex flex-col w-full bg-surface">
          {/* Hero Section */}
          <section className="relative w-full h-[65vh] min-h-[500px] flex items-end pb-stack-lg" style={{ backgroundImage: "linear-gradient(to top, rgba(25, 28, 30, 0.8) 0%, rgba(25, 28, 30, 0.3) 50%, rgba(25, 28, 30, 0.1) 100%), url('/brand/default/placeholder.svg')", backgroundSize: "cover", backgroundPosition: "center" }}>
            <div className="w-full px-grid-margin-mobile md:px-grid-margin-desktop text-on-primary max-w-7xl mx-auto">
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg mb-stack-md leading-tight">
                전체 교체 없이,<br />상한 곳만 정확히 되살립니다
              </h1>
              <p className="font-body-lg text-[18px] md:text-[24px] text-on-surface-variant font-medium mb-stack-md md:mb-12 break-keep text-center md:text-left drop-shadow-sm opacity-90 max-w-xl mx-auto md:mx-0">
                <span className="text-primary font-bold">{siteConfig.brand.name}</span>는 비용이 많이 드는 전체 교체를 권하지 않습니다.<br />꼭 필요한 부분만 정확히 찾아내어 새것처럼 되살려 드립니다.
              </p>
              <button className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-4 rounded-xl font-headline-md text-[18px] flex items-center justify-center gap-2 w-full md:w-auto shadow-lg transition-transform active:scale-95">
                <span>무료 상담 신청하기</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </section>

          <StatStrip />

          {/* Service Categories */}
          <section className="w-full px-grid-margin-mobile md:px-grid-margin-desktop py-section-gap max-w-7xl mx-auto">
            <div className="mb-stack-lg">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">전문 복원 서비스</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">필요한 부분만 꼼꼼하게 수리하는 부분 복원 솔루션</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter">
              <ServiceCard title="싱크대 복원" desc="상판 크랙, 탄자국, 연마광택" img="/brand/default/placeholder.svg" href="/kitchen/countertop" />
              <ServiceCard title="문짝/문틀" desc="구멍 복원, 필름 시공, 힌지 교체" img="/brand/default/placeholder.svg" href="/entrance/firedoor" />
              <ServiceCard title="타일/벽지" desc="들뜸, 깨짐 부분 교체" img="/brand/default/placeholder.svg" href="/bath/tile" />
              <ServiceCard title="욕실 수리" desc="실리콘 재시공, 수전 교체" img="/brand/default/placeholder.svg" href="/bath/doorframe" />
              <ServiceCard title="가구 수리" desc="레일 교체, 경첩 수리, 단차 조정" img="/brand/default/placeholder.svg" href="/furniture/repair" />
              <ServiceCard title="후드/조명" desc="주방 후드, LED 조명 교체" img="/brand/default/placeholder.svg" href="/kitchen/hood" />
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
          <section className="w-full px-grid-margin-mobile md:px-grid-margin-desktop pb-section-gap pt-stack-lg mt-auto max-w-7xl mx-auto">
            <div className="bg-primary-container rounded-3xl p-stack-lg md:p-12 text-center relative overflow-hidden flex flex-col items-center">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
              <div className="relative z-10 flex flex-col items-center">
                <span className="material-symbols-outlined text-[48px] text-on-primary-container mb-4">photo_camera</span>
                <h2 className="font-headline-lg text-[24px] md:text-[32px] text-on-primary mb-3">수리가 필요한 곳이 있나요?</h2>
                <p className="font-body-md text-on-primary-container max-w-2xl text-center md:text-left opacity-90">우리 동네 수많은 집들이 이미 <span className="font-bold">{siteConfig.brand.name}</span>의 부분 수리로 새 생명을 얻었습니다. 검증된 수리 사례를 확인해보세요.</p>
                <button className="bg-on-primary text-primary-container w-full md:w-auto px-8 py-4 rounded-xl font-headline-md text-[18px] flex items-center justify-center gap-2 shadow-lg hover:bg-surface-clean transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                  사진 한 장으로 견적 받기
                </button>
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

function ServiceCard({ title, desc, img, href }: { title: string, desc: string, img: string, href: string }) {
  return (
    <Link href={href} className="group flex flex-col gap-3">
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-container shadow-sm group-hover:shadow-md transition-shadow">
        <img alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={img} />
      </div>
      <div>
        <h3 className="font-headline-md text-[18px] text-on-surface flex items-center gap-1 group-hover:text-primary transition-colors">
          {title} <span className="material-symbols-outlined text-[18px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">chevron_right</span>
        </h3>
        <p className="font-body-md text-[14px] text-on-surface-variant truncate">{desc}</p>
      </div>
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
