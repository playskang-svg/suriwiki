import Link from "next/link";
import type { CompanyProfile } from "@/lib/types";

export function SiteFooter({ company }: { company: CompanyProfile }) {
  return (
    <footer className="mt-20 border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        {/* Col 1: Company Profile */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              수
            </span>
            <p className="text-base font-bold text-white tracking-tight">{company.companyName}</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            수리위키는 검증된 현장 전문가 팀의 시공 데이터를 기반으로 지역별·공정별 정보와 1:1 전용 상담 서비스를 제공하는 전문 집수리 플랫폼입니다.
          </p>

          <div className="pt-2 text-xs text-slate-400 space-y-1 font-mono">
            <p>상호명: {company.companyName} | 대표자: {company.representativeName || "홍길동"}</p>
            <p>사업자등록번호: {company.businessRegistrationNo || "124-88-00123"}</p>
            <p>운영/상담 시간: {company.operatingHours}</p>
          </div>
        </div>

        {/* Col 2: Service Regions */}
        <div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            전담 출장 서비스 지역
          </p>
          <ul className="text-xs space-y-1.5 text-slate-400">
            {company.serviceRegions.map((region, idx) => (
              <li key={idx} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                <span>{region}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Direct Contact */}
        <div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            전담 대표 연락처
          </p>
          <a
            href={`tel:${company.phoneNumber.replace(/[^0-9]/g, "")}`}
            className="text-lg font-bold text-white hover:text-blue-400 transition block mb-1 font-mono"
          >
            {company.phoneNumber}
          </a>
          <p className="text-[11px] text-slate-400 leading-normal mb-3">
            {company.prepInstructions || "파손 부위 전경 사진 2장을 전송해주시면 빠른 견적 산출이 가능합니다."}
          </p>
          <div className="flex gap-3 text-xs text-slate-400">
            <Link href="/sitemap.xml" className="hover:underline">
              사이트맵
            </Link>
            <span>·</span>
            <Link href="/admin" className="hover:underline">
              관리자 센터
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900 bg-black/40 px-4 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {company.companyName}. All rights reserved. Powered by SooriWiki Engine.
      </div>
    </footer>
  );
}
