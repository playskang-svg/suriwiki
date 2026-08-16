import Link from "next/link";
import { CompanyProfile } from "@/lib/types";

export function SiteHeader({
  companyProfile,
  categorySlug,
  regionSlug,
  categoryName,
}: {
  companyProfile?: CompanyProfile;
  categorySlug?: string;
  regionSlug?: string;
  categoryName?: string;
}) {
  const title = categoryName || "수리위키";
  const consultHref =
    categorySlug && regionSlug
      ? `/services/${categorySlug}/${regionSlug}/consult`
      : "#consult-regions";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs font-sans transition">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand Logo - SooriWiki */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition">
            W
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-none">
                {title}
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold rounded">
                공식
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-wider text-slate-500 block mt-0.5">
              대한민국 1등 집수리·복원 지식백과
            </span>
          </div>
        </Link>

        {/* Top Header Navigation Items */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-bold text-slate-700">
          <Link href="/" className="hover:text-emerald-700 transition">
            홈
          </Link>
          <a href="/#services" className="hover:text-emerald-700 transition">
            22개 공정 전체보기
          </a>
          <a href="/#showcase" className="hover:text-emerald-700 transition">
            인기 시공사례
          </a>
          <a href="/#consult-regions" className="hover:text-emerald-700 transition">
            시공문의
          </a>
          <a href="/#collaborate" className="hover:text-emerald-700 transition">
            협업문의
          </a>
          <a href="/#process" className="hover:text-emerald-700 transition">
            진행 과정
          </a>
          <a href="/#why-us" className="hover:text-emerald-700 transition">
            왜 수리위키인가
          </a>
          <Link href="/sitemap" className="hover:text-emerald-700 transition">
            사이트맵
          </Link>
          <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-700 transition font-mono">
            [관리자]
          </Link>
        </nav>

        {/* Call to Action Button */}
        <div className="flex items-center gap-3">
          <a
            href={consultHref}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-extrabold shadow-sm hover:shadow transition duration-200 tracking-wide flex items-center justify-center gap-1.5"
          >
            <span>⚡ 실시간 시공문의</span>
          </a>
        </div>
      </div>
    </header>
  );
}
