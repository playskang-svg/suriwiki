import Link from "next/link";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { MAIN_CATEGORIES, REGIONS_DATA, getDistributedCompanyProfile } from "@/lib/store";

export default function VisualSitemapPage() {
  const companyProfile = getDistributedCompanyProfile();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <SiteHeader companyProfile={companyProfile} categoryName="전체 사이트맵" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 space-y-12">
        {/* Title Header */}
        <div className="border-b border-slate-200 pb-6 space-y-2">
          <span className="px-3 py-1 bg-emerald-100/90 border border-emerald-300 text-emerald-900 font-mono text-xs font-bold rounded-full">
            VISUAL HTML SITEMAP HUB
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">
            🗺️ 수리위키 964개 세부 키워드 전체 사이트맵
          </h1>
          <p className="text-sm text-slate-500">
            수도권 22개 전문 시공 공정 × 40개 세부 지역 인프라 네트워크 전체 바로가기
          </p>
        </div>

        {/* 1. Main Category Studios Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
            <span>🏗️ 22개 메인 시공 공정관 바로가기</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            {MAIN_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/services/${cat.slug}/gangnam`}
                className="p-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-xl transition space-y-1 group shadow-xs"
              >
                <div className="font-bold text-slate-900 group-hover:text-emerald-800">{cat.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{cat.domain}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* 2. Regional Hub Landing Pages Matrix (964 Pages) */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-emerald-800">
            📍 지역별 출장 서비스 랜딩페이지 (964개 조합)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {REGIONS_DATA.map((reg) => (
              <div key={reg.slug} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="border-b border-slate-200 pb-2">
                  <span className="text-[10px] text-emerald-700 font-mono font-bold uppercase">{reg.parentRegionSlug}</span>
                  <h3 className="font-bold text-base text-slate-900">{reg.name} 출장관</h3>
                </div>

                <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto pr-1">
                  {MAIN_CATEGORIES.slice(0, 10).map((cat) => (
                    <Link
                      key={`${reg.slug}-${cat.slug}`}
                      href={`/services/${cat.slug}/${reg.slug}`}
                      className="block text-slate-700 hover:text-emerald-800 hover:underline font-medium truncate"
                    >
                      • {reg.name} {cat.name}
                    </Link>
                  ))}
                  <span className="text-[10px] text-slate-400 block pt-1">외 12개 공정 전체...</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Search Engine XML Sitemap Link */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-xs">
          <div>
            <span className="font-bold text-slate-900">🔍 네이버/구글 검색엔진 수집용 XML 파일</span>
            <p className="text-slate-500 mt-0.5">서치콘솔 자동 수집을 위한 표준 XML 사이트맵</p>
          </div>
          <a
            href="/sitemap.xml"
            target="_blank"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition shadow-xs"
          >
            sitemap.xml 열기 ↗
          </a>
        </div>
      </main>

      <SiteFooter company={companyProfile} />
    </div>
  );
}
