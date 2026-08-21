import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface-clean/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="h-16 px-grid-margin-mobile md:px-grid-margin-desktop flex items-center justify-between gap-gutter max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-stack-sm">
          <Link href="/">
            {siteConfig.assets?.logo ? (
              <img
                alt={siteConfig.brand.name}
                className="h-8 w-auto object-contain"
                src={siteConfig.assets.logo}
              />
            ) : (
              // 로고 파일이 없으면 자리표시자를 끼우지 않고 브랜드명을 글자로 쓴다 (docs/17 §8-5)
              <span className="font-title-lg text-title-lg text-primary font-bold">
                {siteConfig.brand.name}
              </span>
            )}
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
          {/* 프로필 사진이 없는 상태다. 자리표시자 이미지 대신 아이콘을 쓴다. */}
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden cursor-pointer">
            <span className="material-symbols-outlined text-on-primary text-[20px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
