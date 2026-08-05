import Link from "next/link";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Breadcrumb } from "@/components/public/breadcrumb";
import {
  MAIN_CATEGORIES,
  REGIONS_DATA,
  getDistributedCompanyProfile,
  getSiteImages,
} from "@/lib/store";

export default function ServiceCategoryHubPage({
  params,
}: {
  params: { category: string };
}) {
  const category = MAIN_CATEGORIES.find((c) => c.slug === params.category) || {
    name: "문수리",
    slug: params.category,
    domain: "doorsuri.com",
    teamLeader: "김문수 팀장",
    activeCount: 42,
  };

  const companyProfile = getDistributedCompanyProfile(params.category, "gangnam");
  const siteImages = getSiteImages();

  // Category specific showcase cases
  const categoryShowcase = [
    {
      id: "cat_case_01",
      regionName: "강남구",
      regionSlug: "gangnam",
      title: `${category.name} 하단부 습기 부식 & 0.1mm 정밀 원상복구`,
      beforeImg: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
      afterImg: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
      desc: "습기로 인해 필름이 박리되고 곰팡이가 피어난 파손 부위를 자재 전체 교체 없이 부분 성형 복원 완료",
    },
    {
      id: "cat_case_02",
      regionName: "성남 분당구",
      regionSlug: "bundang",
      title: `${category.name} 충격 구멍 파손 & 결맞춤 정밀 래핑`,
      beforeImg: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80",
      afterImg: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=600&q=80",
      desc: "이삿짐 파손으로 커다란 구멍이 뚫린 현장을 특수 폼 충전 후 샌딩 및 무늬 컬러 조색 마감",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d1724] text-slate-100 flex flex-col font-sans">
      <SiteHeader companyProfile={companyProfile} categorySlug={params.category} />

      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: "22개 공정센터", href: "/#services" },
          { label: `${category.name} 전문관` },
        ]}
      />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8 space-y-16">
        {/* 1. Category Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#142334] via-[#0e1926] to-[#1a2e45] p-8 md:p-12 border border-slate-700/80 shadow-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c5a059]/20 border border-[#c5a059]/40 rounded-full text-[#e8c87b] text-xs font-extrabold">
            <span>★</span>
            <span>수리위키 {category.name} 수도권 전속 출장 센터</span>
          </div>

          <div className="space-y-3 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {category.name} 전문 시공 & 0.1mm 정밀 원상복구 홈
            </h1>
            <p className="text-base md:text-lg text-slate-300 leading-relaxed">
              전체 교체의 부담스러운 비용과 소음을 해결합니다!{" "}
              <strong className="text-white">{category.teamLeader}</strong>의 전속 시공팀이 
              파손 부위만을 국소 복원하여 <strong>비용 70% 절감 & 당일 완공</strong>을 약속드립니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href={`/services/${params.category}/gangnam/consult`}
              className="px-8 py-4 bg-gradient-to-r from-[#c5a059] to-[#b08b38] hover:from-[#d4af37] hover:to-[#c5a059] text-slate-950 font-black rounded-xl shadow-xl transition text-sm flex items-center gap-2"
            >
              <span>📷 현장 사진 보내고 5분 무료 견적받기</span>
              <span>&rarr;</span>
            </Link>

            <a
              href={`tel:${companyProfile.phoneNumber.replace(/[^0-9]/g, "")}`}
              className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 rounded-xl transition text-sm flex items-center gap-2"
            >
              <span>📞 직통 전화: {companyProfile.phoneNumber}</span>
            </a>
          </div>
        </section>

        {/* 2. Before & After Photo Cases */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoryShowcase.map((item) => (
              <div key={item.id} className="bg-[#142334]/80 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                  <span className="font-bold text-[#e8c87b]">{item.regionName} 아파트 현장</span>
                  <span className="text-slate-400 font-mono">소요시간: 1시간 30분</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative h-40 bg-slate-950 rounded-xl overflow-hidden border border-red-500/30">
                    <img src={item.beforeImg} alt="시공전" className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-extrabold rounded">BEFORE</span>
                  </div>

                  <div className="relative h-40 bg-slate-950 rounded-xl overflow-hidden border border-emerald-500/30">
                    <img src={item.afterImg} alt="시공후" className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded">AFTER</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {item.desc}
                </p>

                <div className="pt-1 flex justify-end">
                  <Link
                    href={`/services/${params.category}/${item.regionSlug}`}
                    className="text-xs text-[#c5a059] font-bold hover:underline"
                  >
                    {item.regionName} {category.name} 세부 홈 보기 &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. 4-Step Process & Material Tech Guide */}
        <section className="bg-[#142334]/60 border border-slate-700 rounded-3xl p-8 space-y-6">
          <h2 className="text-2xl font-extrabold text-white">
            🛠️ {category.name} 4단계 표준 시공 프로세스
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-xl font-bold text-[#c5a059] font-mono">01</span>
              <h3 className="font-bold text-white text-sm">사진 전송 & 정밀 진단</h3>
              <p className="text-slate-400 leading-relaxed">현장 사진을 전송해주시면 마스터가 파손 심도와 자재 종류를 파악합니다.</p>
            </div>

            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-xl font-bold text-[#c5a059] font-mono">02</span>
              <h3 className="font-bold text-white text-sm">정찰제 견적 확정</h3>
              <p className="text-slate-400 leading-relaxed">추가 출장비가 없는 정찰제 견적가를 안내해 드리고 일정을 조율합니다.</p>
            </div>

            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-xl font-bold text-[#c5a059] font-mono">03</span>
              <h3 className="font-bold text-white text-sm">특수 퍼티 & 성형 샌딩</h3>
              <p className="text-slate-400 leading-relaxed">특수 성형 충전재로 원래 단단함 이상으로 보강하고 0.1mm 수평을 맞춥니다.</p>
            </div>

            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-xl font-bold text-[#c5a059] font-mono">04</span>
              <h3 className="font-bold text-white text-sm">패턴 조색 & A/S 발급</h3>
              <p className="text-slate-400 leading-relaxed">동일 질감 인테리어 필름/조색 마감 후 1년 무상 품질보증서를 발급합니다.</p>
            </div>
          </div>
        </section>

        {/* 4. Region Selector Grid */}
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider">REGIONAL STATIONS</span>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              📍 수도권 지역별 {category.name} 전용 홈 선택
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              원하시는 출장 지역을 선택하시면 해당 지역 전용 시공 홈으로 이동합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
            {REGIONS_DATA.map((reg) => (
              <Link
                key={reg.slug}
                href={`/services/${params.category}/${reg.slug}`}
                className="p-3 bg-[#142334] hover:bg-[#c5a059] hover:text-slate-950 border border-slate-700 hover:border-[#c5a059] rounded-xl font-bold text-center transition duration-150 flex flex-col justify-between"
              >
                <span>{reg.name}</span>
                <span className="text-[10px] opacity-70 font-mono mt-1">&rarr; 홈 입장</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom Call To Action */}
        <div className="p-8 bg-gradient-to-r from-blue-900/60 to-slate-900 border border-blue-500/30 rounded-3xl text-center space-y-4">
          <h3 className="text-2xl font-extrabold text-white">
            {category.name} 빠르게 견적 상담을 받고 싶으신가요?
          </h3>
          <p className="text-xs text-slate-300">
            현장 사진 2장 첨부 시 5분 이내 전속 마스터 팀장이 정밀 견적을 전달드립니다.
          </p>
          <div className="pt-2">
            <Link
              href={`/services/${params.category}/gangnam/consult`}
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
