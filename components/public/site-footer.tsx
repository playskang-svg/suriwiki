import Link from "next/link";
import type { CompanyProfile } from "@/lib/types";

export function SiteFooter({ company }: { company: CompanyProfile }) {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-100 text-slate-700 font-sans">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        {/* Col 1: Company Profile */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
              수
            </span>
            <p className="text-base font-bold text-slate-900 tracking-tight">{company.companyName}</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            수리위키는 검증된 현장 전문가 팀의 시공 데이터를 기반으로 지역별·공정별 정보와 1:1 전용 상담 서비스를 제공하는 전문 집수리 플랫폼입니다.
          </p>

          <div className="pt-2 text-xs text-slate-500 space-y-1 font-mono">
            <p>상호명: {company.companyName} | 대표자: {company.representativeName || "홍길동"}</p>
            <p>사업자등록번호: {company.businessRegistrationNo || "124-88-00123"}</p>
            <p>운영/상담 시간: {company.operatingHours}</p>
          </div>
        </div>

        {/* Col 2: Service Regions */}
        <div>
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
            전담 출장 서비스 지역
          </p>
          <ul className="text-xs space-y-1.5 text-slate-600">
            {company.serviceRegions.map((region, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>{region}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Direct Contact */}
        <div>
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
            전담 대표 연락처
          </p>
          <a
            href={`tel:${company.phoneNumber.replace(/[^0-9]/g, "")}`}
            className="text-lg font-bold text-slate-900 hover:text-emerald-700 transition block mb-1 font-mono"
          >
            {company.phoneNumber}
          </a>
          <p className="text-[11px] text-slate-500 leading-normal mb-3">
            {company.prepInstructions || "전화 상담으로 현장 상황을 알려주시면 빠른 견적 산출이 가능합니다."}
          </p>
          <div className="flex gap-3 text-xs text-slate-500">
            <Link href="/sitemap.xml" className="hover:underline hover:text-slate-800">
              사이트맵
            </Link>
            <span>·</span>
            <Link href="/admin" className="hover:underline hover:text-slate-800">
              관리자 센터
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-200/60 px-4 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} {company.companyName}. All rights reserved. Powered by SooriWiki Engine.
      </div>
    </footer>
  );
}
