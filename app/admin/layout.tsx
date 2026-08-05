import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getDistributedCompanyProfile } from "@/lib/store";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const hqCompany = getDistributedCompanyProfile();

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
      <AdminSidebar />
      <div className="flex-1 bg-slate-900 p-8 overflow-y-auto flex flex-col justify-between">
        <div>{children}</div>

        <footer className="mt-16 pt-6 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-200">{hqCompany.companyName}</span>
            <span> | 대표자: <strong className="text-white">{hqCompany.representativeName || "홍길동"}</strong></span>
            <span> | 사업자번호: {hqCompany.businessRegistrationNo || "124-88-00123"}</span>
            <span> | 대표전화: <strong className="text-blue-400 font-mono">{hqCompany.phoneNumber}</strong></span>
          </div>
          <p className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} 수리위키 관리자 센터 (PRD 11.3 & 12.4 회사정보 배포 적용)
          </p>
        </footer>
      </div>
    </div>
  );
}
