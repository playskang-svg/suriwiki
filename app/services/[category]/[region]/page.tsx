import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { ConsultCta } from "@/components/public/consult-cta";
import {
  getDistributedCompanyProfile,
  MAIN_CATEGORIES,
  REGIONS_DATA,
  getKeywordPages,
  generateDefaultBodyContent,
} from "@/lib/store";
import { generateKeywordPageMetadata, generateJsonLd } from "@/lib/seo";

// 관리자가 회사정보·연락처 배포(12.4)를 바꾸면 재배포 없이도 바로 반영되어야 하므로
// 빌드 시점 정적 캐싱을 쓰지 않고 매 요청마다 새로 렌더링한다.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { category: string; region: string };
}) {
  const category = MAIN_CATEGORIES.find((c) => c.slug === params.category) || {
    name: params.category,
    slug: params.category,
  };
  const region = REGIONS_DATA.find((r) => r.slug === params.region) || {
    name: params.region,
    slug: params.region,
  };
  const companyProfile = getDistributedCompanyProfile(params.category, params.region);

  return generateKeywordPageMetadata({
    categoryName: category.name,
    regionName: region.name,
    categorySlug: params.category,
    regionSlug: params.region,
    companyProfile,
  });
}

export default function KeywordLandingPage({
  params,
}: {
  params: { category: string; region: string };
}) {
  // PRD 5.3 SEO 발행 품질 게이트: 실제 시공 데이터가 없거나 아직 발행되지 않은 지역×공정 조합은
  // 조합형 문구로 채운 빈 랜딩페이지를 보여주지 않고 상위 허브로 보낸다.
  const category = MAIN_CATEGORIES.find((c) => c.slug === params.category);
  if (!category) {
    redirect("/");
  }

  const region = REGIONS_DATA.find((r) => r.slug === params.region);
  if (!region) {
    redirect(`/services/${params.category}`);
  }

  const allKeywordPages = getKeywordPages();
  const keywordPage = allKeywordPages.find(
    (p) => p.categorySlug === params.category && p.regionSlug === params.region
  );

  if (!keywordPage || keywordPage.status !== "published") {
    redirect(`/services/${params.category}`);
  }

  const pageTitle = keywordPage.title;
  const bodyContent = keywordPage.bodyContent || generateDefaultBodyContent(category.name, region.name);

  const companyProfile = getDistributedCompanyProfile(params.category, params.region);
  const consultHref = `/services/${params.category}/${params.region}/consult`;

  const jsonLdSchemas = generateJsonLd({
    categoryName: category.name,
    regionName: region.name,
    categorySlug: params.category,
    regionSlug: params.region,
    companyProfile,
  });

  const adjacentRegions = REGIONS_DATA.filter((r) => r.slug !== params.region).slice(0, 4);
  const relatedCategories = MAIN_CATEGORIES.filter((c) => c.slug !== params.category).slice(0, 4);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Schema.org Structured Data */}
      {jsonLdSchemas.map((schema, i) => (
        <Script
          key={i}
          id={`jsonld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <SiteHeader companyProfile={companyProfile} categorySlug={params.category} regionSlug={params.region} />

      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: `${category.name} 허브`, href: `/services/${params.category}` },
          { label: `${region.name} ${category.name}` },
        ]}
      />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8 space-y-16">
        {/* 1. Hero & Core Summary */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/30 p-8 md:p-12 border border-emerald-200/80 shadow-xs">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-100/90 border border-emerald-300 rounded-full text-emerald-900 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>{region.name} 전지역 출장 가능 · 수리위키 공식 인증</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {pageTitle}
            </h1>

            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              파손·부식·스크래치·소음 문제부터 교체 없이 깔끔한 원상복구까지!{" "}
              <strong className="text-slate-900 font-extrabold">{companyProfile.companyName}</strong>의 검증된 현장 전문가 팀이 
              전화 상담 후 5분 내 정확한 견적을 안내하고 {region.name} 전지역으로 즉시 출동합니다.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href={consultHref}
                className="px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md text-center transition duration-200 text-base flex items-center justify-center gap-2"
              >
                <span>📞 전화로 5분 견적 상담받기</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a
                href={`tel:${companyProfile.phoneNumber.replace(/[^0-9]/g, "")}`}
                className="px-6 py-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-center transition text-base flex items-center justify-center gap-2 shadow-xs"
              >
                <span>📞 {companyProfile.phoneNumber}</span>
              </a>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                교체 대비 최대 70% 비용 절감
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                무상 A/S 품질 보증
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                당일/원하는 날짜 시공 완료
              </span>
            </div>
          </div>
        </section>

        {/* 2. Custom Article Body Content Section */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <h2 className="text-lg font-bold text-slate-900">
              {region.name} {category.name} 맞춤 정보 및 전문 시공 가이드
            </h2>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans space-y-2">
            {bodyContent}
          </div>
        </section>

        {/* 3. Before & After Showcase */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">REAL PROOF</span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                {region.name} 현장 시공 전·후 비교 사례
              </h2>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">실제 {region.name} 지역 시공 사진</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Case Card 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                <span className="font-bold text-emerald-800">{region.name} 아파트 현장</span>
                <span>작업시간 1시간 30분</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-lg overflow-hidden bg-slate-100 border border-red-300 p-3 text-center space-y-2">
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
                    시공 전 (BEFORE)
                  </span>
                  <div className="w-full h-36 bg-slate-200/70 flex items-center justify-center text-red-700 text-xs font-mono rounded">
                    [습기 부식 및 겉면 함몰 파손]
                  </div>
                  <p className="text-[11px] text-slate-500">하단부 곰팡이 및 자재 박리</p>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-slate-100 border border-emerald-300 p-3 text-center space-y-2">
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">
                    시공 후 (AFTER)
                  </span>
                  <div className="w-full h-36 bg-emerald-50/70 flex items-center justify-center text-emerald-800 text-xs font-mono rounded">
                    [완벽 퍼티 보수 & 매칭 퍼펙트 복원]
                  </div>
                  <p className="text-[11px] text-slate-500">새 제품 수준 평탄화 완성</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                &quot;문 전체 교체 시 50만원 이상 소요되는 상황이었으나, 수리위키 전문 복원 기법으로 문틀 훼손 없이 기존 문을 깔끔하게 살렸습니다.&quot;
              </p>
            </div>

            {/* Case Card 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                <span className="font-bold text-emerald-800">{region.name} 오피스텔/빌라 현장</span>
                <span>작업시간 2시간</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-lg overflow-hidden bg-slate-100 border border-red-300 p-3 text-center space-y-2">
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
                    시공 전 (BEFORE)
                  </span>
                  <div className="w-full h-36 bg-slate-200/70 flex items-center justify-center text-red-700 text-xs font-mono rounded">
                    [구멍 파손 & 충격 찌그러짐]
                  </div>
                  <p className="text-[11px] text-slate-500">내부 충전재 붕괴 상태</p>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-slate-100 border border-emerald-300 p-3 text-center space-y-2">
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">
                    시공 후 (AFTER)
                  </span>
                  <div className="w-full h-36 bg-emerald-50/70 flex items-center justify-center text-emerald-800 text-xs font-mono rounded">
                    [강화 폼 성형 & 필름 매칭]
                  </div>
                  <p className="text-[11px] text-slate-500">색상 및 결 맞춤 완벽 작업</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                &quot;퇴거 전 원상복구 점검을 앞두고 긴급 의뢰해주셨으며, 티 없이 단단하게 성형 마감하여 당일 점검 통과했습니다.&quot;
              </p>
            </div>
          </div>
        </section>

        {/* 4. Service Process & Price Guide */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-sm font-black">
                4
              </span>
              <span>{region.name} {category.name} 4단계 표준 시공 공정</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1 shadow-xs">
                <span className="text-xs font-bold text-emerald-700">STEP 1</span>
                <h4 className="font-semibold text-sm text-slate-900">전화 상담 기반 정밀 진단</h4>
                <p className="text-xs text-slate-500">전화로 자재 타입, 파손 부위, 정도를 여쭤보고 파악합니다</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1 shadow-xs">
                <span className="text-xs font-bold text-emerald-700">STEP 2</span>
                <h4 className="font-semibold text-sm text-slate-900">파손 부위 보강 성형</h4>
                <p className="text-xs text-slate-500">특수 보수 퍼티 및 강화 충전재로 원래 단단함보다 높은 강도 확보</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1 shadow-xs">
                <span className="text-xs font-bold text-emerald-700">STEP 3</span>
                <h4 className="font-semibold text-sm text-slate-900">정밀 평탄화 & 샌딩</h4>
                <p className="text-xs text-slate-500">미세 단차 0.1mm 이하 조율을 위한 육안/손끝 검수 작업 진행</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1 shadow-xs">
                <span className="text-xs font-bold text-emerald-700">STEP 4</span>
                <h4 className="font-semibold text-sm text-slate-900">패턴 매칭 & 최종 마감</h4>
                <p className="text-xs text-slate-500">동일 질감 인테리어 필름/도색 마감 및 클린 정리 완료</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">투명한 견적 구조</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                수리위키는 부당한 현장 추가금을 원천 차단합니다.
              </p>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700">부분 스크래치/단순복원</span>
                  <span className="font-bold text-emerald-700 font-mono">8만원 ~</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700">구멍 파손/부식 성형</span>
                  <span className="font-bold text-emerald-700 font-mono">15만원 ~</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700">문틀/문 전체 패키지</span>
                  <span className="font-bold text-emerald-700 font-mono">25만원 ~</span>
                </div>
              </div>
            </div>

            <Link
              href={consultHref}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold text-center transition block shadow-xs"
            >
              내 현장 맞춤 견적 확인하기
            </Link>
          </div>
        </section>

        {/* 5. Verified Expert & Company Profile */}
        <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold">
              ✔ {region.name} 담당 배포 전담팀
            </div>
            <h3 className="text-xl font-bold text-slate-900">{companyProfile.companyName}</h3>
            <p className="text-xs text-slate-600">
              대표자: {companyProfile.representativeName} | 사업자번호: {companyProfile.businessRegistrationNo}
            </p>
            <p className="text-xs text-slate-500">
              영업시간: {companyProfile.operatingHours}
            </p>
            <p className="text-xs text-emerald-800 italic font-medium">
              &quot;{companyProfile.prepInstructions || "전화 상담으로 5분 내 정밀 견적을 안내해드립니다."}&quot;
            </p>
          </div>

          <div className="flex-shrink-0 text-center space-y-2">
            <a
              href={`tel:${companyProfile.phoneNumber.replace(/[^0-9]/g, "")}`}
              className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md text-sm block font-mono"
            >
              📞 {companyProfile.phoneNumber}
            </a>
            <span className="text-[11px] text-slate-500 block">터치 시 직통 전화 연결</span>
          </div>
        </section>

        {/* 6. Spiderweb Internal Links Section */}
        <section className="space-y-6 border-t border-slate-200 pt-10">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">SPIDERWEB NAVIGATION</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              관련 공정 및 인접 지역 서비스 연관 탐색
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              수리위키 거미줄 내부링크 구조를 통해 3클릭 이내 관련 공정과 인접 지역 정보를 확인하실 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>{category.name} 인접 출장 지역</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {adjacentRegions.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/services/${params.category}/${r.slug}`}
                    className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs text-slate-700 hover:text-emerald-800 transition flex items-center justify-between shadow-xs"
                  >
                    <span>{r.name} {category.name}</span>
                    <span className="text-slate-400 font-mono">&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>{region.name} 함께 검색하는 연관 공정</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {relatedCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/services/${c.slug}/${params.region}`}
                    className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs text-slate-700 hover:text-emerald-800 transition flex items-center justify-between shadow-xs"
                  >
                    <span>{region.name} {c.name}</span>
                    <span className="text-slate-400 font-mono">&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ Accordion */}
        <section className="space-y-4 border-t border-slate-200 pt-10">
          <h2 className="text-xl font-bold text-slate-900">자주 묻는 질문 (FAQ)</h2>
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm text-emerald-800">
                Q. {region.name} 지역 출장 비용이 따로 발생하나요?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                아닙니다. 전담 출장팀이 {region.name} 내에 상주하고 있으므로 별도의 추가 출장비 없이 견적 금액 그대로 출장 시공해드립니다.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm text-emerald-800">
                Q. 수리 후 무상 A/S 기간은 어떻게 되나요?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                시공 완료일로부터 1년간 시공 부위 하자에 대해 100% 무상 A/S를 보증합니다.
              </p>
            </div>
          </div>
        </section>

        <div className="pt-8">
          <ConsultCta consultHref={consultHref} label={`${region.name} ${category.name} 1:1 빠른 상담 신청하기`} />
        </div>
      </main>

      <SiteFooter company={companyProfile} />
    </div>
  );
}
