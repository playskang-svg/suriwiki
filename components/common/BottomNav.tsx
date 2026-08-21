import Link from "next/link";
import { siteConfig } from "@/config/site";

/**
 * 하단 네비게이션.
 *
 * Stitch 목업에서 넘어온 /services · /cases · /consult 는 이 프로젝트에 없는 경로다.
 * 링크를 살려두면 전부 404 로 떨어지므로, 실제로 존재하는 곳만 가리킨다.
 * 목록 페이지가 생기면 그때 그 경로로 바꾼다.
 */
export default function BottomNav() {
  const telHref = `tel:${siteConfig.contact.phone.replace(/[^0-9]/g, "")}`;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-clean/90 backdrop-blur-xl shadow-[0_-1px_8px_rgba(0,0,0,0.04)] md:hidden">
      <div className="flex justify-between items-center h-16 px-4">
        <Link href="/" className="flex flex-col items-center justify-center gap-0.5 w-1/4 h-full text-primary font-bold">
          <span className="material-symbols-outlined">home</span>
          <span className="text-label-caps font-label-caps">홈</span>
        </Link>
        <Link href="/#services" className="flex flex-col items-center justify-center gap-0.5 w-1/4 h-full text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">build</span>
          <span className="text-label-caps font-label-caps">서비스</span>
        </Link>
        <Link href="/#consult" className="flex flex-col items-center justify-center gap-0.5 w-1/4 h-full text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">photo_library</span>
          <span className="text-label-caps font-label-caps">문의</span>
        </Link>
        <div className="w-1/4 h-full flex items-center justify-center">
          {/* 상담 페이지가 아직 없다. 전화가 실제 전환 경로다. */}
          <a href={telHref} className="bg-deep-navy text-on-primary px-4 py-2 rounded-lg text-status-label font-status-label flex items-center gap-1 hover:bg-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">call</span>
            <span>전화상담</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
