import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface-clean/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="h-16 px-grid-margin-mobile md:px-grid-margin-desktop flex items-center justify-between gap-gutter max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-stack-sm">
          <Link href="/">
            <img 
              alt="Logo" 
              className="h-8 w-auto object-contain" 
              src="/brand/default/placeholder.svg" 
            />
          </Link>
          <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-full cursor-pointer hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
            <span className="font-status-label text-status-label text-on-surface-variant">강남구 역삼동</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">expand_more</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-low rounded-full transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden cursor-pointer">
            <img 
              alt="Profile" 
              className="w-full h-full object-cover" 
              src="/brand/default/placeholder.svg" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
