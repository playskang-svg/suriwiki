import Link from "next/link";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-clean/90 backdrop-blur-xl shadow-[0_-1px_8px_rgba(0,0,0,0.04)] md:hidden">
      <div className="flex justify-between items-center h-16 px-4">
        <Link href="/" className="flex flex-col items-center justify-center gap-0.5 w-1/4 h-full text-primary font-bold">
          <span className="material-symbols-outlined">home</span>
          <span className="text-label-caps font-label-caps">홈</span>
        </Link>
        <Link href="/services" className="flex flex-col items-center justify-center gap-0.5 w-1/4 h-full text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">build</span>
          <span className="text-label-caps font-label-caps">서비스</span>
        </Link>
        <Link href="/cases" className="flex flex-col items-center justify-center gap-0.5 w-1/4 h-full text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">photo_library</span>
          <span className="text-label-caps font-label-caps">시공사례</span>
        </Link>
        <div className="w-1/4 h-full flex items-center justify-center">
          <Link href="/consult" className="bg-deep-navy text-on-primary px-4 py-2 rounded-lg text-status-label font-status-label flex items-center gap-1 hover:bg-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span>상담하기</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
