import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Breadcrumb } from "@/components/public/breadcrumb";
import {
  MAIN_CATEGORIES,
  REGIONS_DATA,
  getDistributedCompanyProfile,
  getSiteImages,
  getCategoryCases,
} from "@/lib/store";
import { ServiceCategorySlug } from "@/lib/types";
import { generateCategoryPageMetadata, generateCategoryJsonLd } from "@/lib/seo";

// 관리자가 카테고리 히어로 사진·시공사례·회사정보를 바꾸면 재배포 없이 바로 반영되어야 하므로
// 빌드 시점 정적 캐싱을 쓰지 않는다.
export const dynamic = "force-dynamic";

// 22개 공정 허브 페이지는 서로 title/description이 겹치면 안 되므로 카테고리명을 키워드로 삼아
// 페이지마다 고유한 메타데이터를 자동 생성한다 (PRD 6.2).
export async function generateMetadata({ params }: { params: { category: string } }) {
  const category = MAIN_CATEGORIES.find((c) => c.slug === params.category) || {
    name: params.category,
    slug: params.category,
  };
  const companyProfile = getDistributedCompanyProfile(params.category);

  return generateCategoryPageMetadata({
    categoryName: category.name,
    categorySlug: params.category,
    companyProfile,
  });
}

/**
 * 공정(카테고리) 허브 페이지 — PRD 3.1 Level 1A, 2.2 "공정 허브".
 * 섹션 순서는 reference/메인카테고리페이지*.png 벤치마킹을 그대로 따른다:
 *   헤더 → 히어로 사진 블록(최상단 고정) → 시공사례 → 서비스 지역(하위 페이지 링크) →
 *   선택하는 이유 → 시공 프로세스 설명 → FAQ → CTA + 푸터
 */
export default function ServiceCategoryHubPage({
  params,
}: {
  params: { category: string };
}) {
  // 존재하지 않는 공정 카테고리는 조합형 가짜 페이지를 보여주지 않고 홈으로 보낸다 (PRD 5.3).
  const category = MAIN_CATEGORIES.find((c) => c.slug === params.category);
  if (!category) {
    redirect("/");
  }

  // 카테고리 허브는 특정 지역에 종속된 페이지가 아니므로 지역을 강제로 넘기지 않는다.
  // (region까지 넘기면 특정 지역 전용으로 배포된 회사정보가 허브 페이지에 잘못 노출될 수 있다.)
  const companyProfile = getDistributedCompanyProfile(params.category);
  const siteImages = getSiteImages();
  const categoryCases = getCategoryCases(params.category as ServiceCategorySlug);
  const defaultRegionSlug = REGIONS_DATA[0].slug;
  const consultHref = `/services/${params.category}/${defaultRegionSlug}/consult`;

  const heroImage =
    siteImages.find((img) => img.section === "hero" && img.categorySlug === params.category) ||
    siteImages.find((img) => img.section === "hero" && !img.categorySlug);
  const heroImageUrl = heroImage?.url || "/korean_technician_hero.png";
  const jsonLdSchemas = generateCategoryJsonLd({ categoryName: category.name, categorySlug: params.category });

  return (
    <div className="min-h-screen bg-[#0d1724] text-slate-100 flex flex-col font-sans">
      {jsonLdSchemas.map((schema, i) => (
        <Script
          key={i}
          id={`jsonld-category-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <SiteHeader companyProfile={companyProfile} categorySlug={params.category} categoryName={category.name} />

      {/* 1. 히어로 사진 블록 — 항상 최상단, 실제 시공 사진 */}
      <section className="relative h-[420px] md:h-[520px] w-full overflow-hidden border-b border-slate-800">
        <img
          src={heroImageUrl}
          alt={`${category.name} 대표 시공 사진`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a121d] via-[#0a121d]/60 to-[#0a121d]/20" />

        <div className="relative z-10 h-full mx-auto max-w-7xl px-6 flex flex-col justify-end pb-10 space-y-4">
          <div className="inline-flex w-fit items-center gap-2 px-3 py-1 bg-[#c5a059]/20 border border-[#c5a059]/40 rounded-full text-[#e8c87b] text-xs font-extrabold">
            <span>★</span>
            <span>수리위키 {category.name} 수도권 전속 출장 센터</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight max-w-3xl">
            {category.name} 전문 시공 & 0.1mm 정밀 원상복구
          </h1>
          <p className="text-sm md:text-base text-slate-200 max-w-2xl leading-relaxed">
            전체 교체 없이 파손 부위만 국소 복원합니다. {category.teamLeader && (
              <strong className="text-white">{category.teamLeader}</strong>
            )} 전속 시공팀이 비용 절감과 당일 완공을 약속드립니다.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={consultHref}
              className="px-7 py-3.5 bg-gradient-to-r from-[#c5a059] to-[#b08b38] hover:from-[#d4af37] hover:to-[#c5a059] text-slate-950 font-black rounded-xl shadow-xl transition text-sm"
            >
              상담하기 &rarr;
            </Link>
            <a
              href={`tel:${companyProfile.phoneNumber.replace(/[^0-9]/g, "")}`}
              className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-white font-bold border border-slate-600 rounded-xl transition text-sm"
            >
              📞 {companyProfile.phoneNumber}
            </a>
          </div>
        </div>
      </section>

      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: "22개 공정센터", href: "/#services" },
          { label: `${category.name} 전문관` },
        ]}
      />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8 space-y-16">
        {/* 2. 시공 사례 (실데이터 — 관리자가 업로드한 만큼만 표시) */}
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-end justify-between">
            <div>
              <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider">REAL PROOF</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                📸 {category.name} 실제 현장 시공 전·후 (BEFORE & AFTER)
              </h2>
            </div>
            <span className="text-xs text-slate-400">수리위키 검증 완료 사례</span>
          </div>

          {categoryCases.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400 bg-[#142334]/60 border border-dashed border-slate-700 rounded-2xl">
              아직 등록된 {category.name} 시공 사례가 없습니다. 관리자 &gt; 카테고리별 시공사례 관리에서
              전·후 사진을 업로드하면 여기에 바로 표시됩니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categoryCases.map((item) => (
                <div key={item.id} className="bg-[#142334]/80 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                    <span className="font-bold text-[#e8c87b]">{item.regionLabel || `${category.name} 현장`}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative h-40 bg-slate-950 rounded-xl overflow-hidden border border-red-500/30">
                      <img src={item.beforeImageUrl} alt={`${item.title} 시공전`} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-extrabold rounded">BEFORE</span>
                    </div>
                    <div className="relative h-40 bg-slate-950 rounded-xl overflow-hidden border border-emerald-500/30">
                      <img src={item.afterImageUrl} alt={`${item.title} 시공후`} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded">AFTER</span>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-white">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. 서비스 지역 — 하위 지역×공정 페이지로 연결되는 링크 그리드 */}
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider">REGIONAL STATIONS</span>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              📍 수도권 지역별 {category.name} 전용 페이지
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              원하시는 출장 지역을 선택하시면 해당 지역 전용 시공 안내 페이지로 이동합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
            {/* 앵커 텍스트를 "지역+공정" 키워드 그대로 노출한다 (PRD 4.3 앵커 텍스트 규칙) —
                예: "강남구 문수리". 방문자에게도, 검색엔진에게도 이 링크가 어떤 키워드 페이지로
                연결되는지 이름 자체로 드러나야 그 키워드로 순위가 붙는다. */}
            {REGIONS_DATA.map((reg) => (
              <Link
                key={reg.slug}
                href={`/services/${params.category}/${reg.slug}`}
                className="p-3 bg-[#142334] hover:bg-[#c5a059] hover:text-slate-950 border border-slate-700 hover:border-[#c5a059] rounded-xl font-bold text-center transition duration-150 flex flex-col justify-between"
              >
                <span>{reg.name} {category.name}</span>
                <span className="text-[10px] opacity-70 font-mono mt-1">&rarr; 자세히</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. 선택하는 이유 */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider">WHY US</span>
            <h2 className="text-2xl font-extrabold text-white">{category.name}, 수리위키를 선택하는 이유</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-[#142334]/80 border border-slate-700 rounded-2xl text-center space-y-1">
              <p className="text-xl font-black text-[#c5a059]">당일 출장</p>
              <p className="text-xs text-slate-400">연락 후 빠른 현장 방문</p>
            </div>
            <div className="p-6 bg-[#142334]/80 border border-slate-700 rounded-2xl text-center space-y-1">
              <p className="text-xl font-black text-[#c5a059]">부분 시공</p>
              <p className="text-xs text-slate-400">손상 부위만 정밀 복원, 전체 교체 대비 비용 절감</p>
            </div>
            <div className="p-6 bg-[#142334]/80 border border-slate-700 rounded-2xl text-center space-y-1">
              <p className="text-xl font-black text-[#c5a059]">전지역 출장</p>
              <p className="text-xs text-slate-400">서울·경기·인천 전 지역 출장 가능</p>
            </div>
          </div>
        </section>

        {/* 5. [카테고리]란 + 표준 시공 프로세스 */}
        <section className="bg-[#142334]/60 border border-slate-700 rounded-3xl p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">{category.name} 서비스란?</h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {category.name} 서비스는 전체 자재를 교체하지 않고, 손상되거나 오염된 부위만 정밀하게 진단·복원하는
              작업입니다. 파손·찍힘·들뜸·부식 등 다양한 손상을 적은 범위로 해결할 수 있어 시간과 비용을
              절약할 수 있습니다.
            </p>
          </div>

          <h3 className="text-lg font-bold text-white pt-2">🛠️ {category.name} 4단계 표준 시공 프로세스</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-xl font-bold text-[#c5a059] font-mono">01</span>
              <h4 className="font-bold text-white text-sm">전화 상담 & 정밀 진단</h4>
              <p className="text-slate-400 leading-relaxed">전화로 현장 상황을 들려주시면 마스터가 파손 심도와 자재 종류를 파악합니다.</p>
            </div>
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-xl font-bold text-[#c5a059] font-mono">02</span>
              <h4 className="font-bold text-white text-sm">정찰제 견적 확정</h4>
              <p className="text-slate-400 leading-relaxed">추가 출장비가 없는 정찰제 견적가를 안내해 드리고 일정을 조율합니다.</p>
            </div>
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-xl font-bold text-[#c5a059] font-mono">03</span>
              <h4 className="font-bold text-white text-sm">특수 퍼티 & 성형 샌딩</h4>
              <p className="text-slate-400 leading-relaxed">특수 성형 충전재로 원래 단단함 이상으로 보강하고 정밀 수평을 맞춥니다.</p>
            </div>
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-xl font-bold text-[#c5a059] font-mono">04</span>
              <h4 className="font-bold text-white text-sm">패턴 조색 & A/S 발급</h4>
              <p className="text-slate-400 leading-relaxed">동일 질감 마감 후 1년 무상 품질보증서를 발급합니다.</p>
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">자주 묻는 질문</h2>
          <div className="space-y-3">
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm text-blue-400">Q. {category.name} 서비스가 전체 교체와 어떻게 다른가요?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                손상된 부위만 정밀 복원하기 때문에 작업 시간이 짧고 비용도 크게 절감됩니다.
              </p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm text-blue-400">Q. 지역 상관없이 출장이 가능한가요?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                서울·경기·인천 전 지역에 전속 출장팀이 배치되어 있어 대부분 당일 방문이 가능합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 7. CTA */}
        <div className="p-8 bg-gradient-to-r from-blue-900/60 to-slate-900 border border-blue-500/30 rounded-3xl text-center space-y-4">
          <h3 className="text-2xl font-extrabold text-white">
            {category.name} 빠르게 상담을 받고 싶으신가요?
          </h3>
          <div className="pt-2">
            <Link
              href={consultHref}
              className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition text-sm"
            >
              🚀 {category.name} 1:1 상담 신청서 작성하기
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter company={companyProfile} />
    </div>
  );
}
