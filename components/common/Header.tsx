import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import areasData from "@/data/areas.json";

// 서비스 지역 표기. 최상위 지역(시도·독립시)만 쓴다 — 구·동까지 나열하면 헤더가 넘친다.
const TOP_AREAS = areasData.areas.filter(a => a.parent === null).map(a => a.label);
const SERVICE_AREA_LABEL =
  TOP_AREAS.length > 3
    ? `${TOP_AREAS.slice(0, 3).join(" · ")} 외 ${TOP_AREAS.length - 3}곳`
    : TOP_AREAS.join(" · ");

export default function Header() {
  const telHref = `tel:${siteConfig.contact.phone.replace(/[^0-9]/g, "")}`;

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
          {/*
            원래 "강남구 역삼동" 이 하드코딩돼 있었다 (Stitch 목업 잔재).
            위치 감지도 선택 기능도 없으면서 그 지역을 서비스하는 것처럼 보였다.
            실제 서비스 지역(프로필 area_scope → data/areas.json)을 그대로 표기한다.
            누를 수 없는 표시이므로 cursor-pointer 를 붙이지 않는다.
          */}
          <div className="hidden sm:flex items-center gap-1 bg-surface-container-low px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
            <span className="font-status-label text-status-label text-on-surface-variant">
              {SERVICE_AREA_LABEL}
            </span>
          </div>
        </div>
        {/*
            알림·프로필 아이콘이 있었지만 알림 기능도 로그인도 없어 아무 동작을 하지 않았다.
            동작하지 않는 UI 는 두지 않는다 (docs/17 §8-5). 실제 전환 경로인 전화로 대체한다.
        */}
        <div className="flex items-center gap-2">
          {/* 목록으로 갈 수 있는 상시 메뉴. 없으면 홈에서 링크된 페이지 말고는 도달할 방법이 없다. */}
          <nav className="hidden md:flex items-center gap-1 mr-2">
            <Link href="/" className="px-3 py-2 rounded-lg font-status-label text-status-label text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">
              홈
            </Link>
            <Link href="/cases" className="px-3 py-2 rounded-lg font-status-label text-status-label text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">
              시공 사례
            </Link>
          </nav>
          <a
            href={telHref}
            className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-full font-status-label text-status-label hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            <span className="hidden sm:inline">{siteConfig.contact.phone}</span>
            <span className="sm:hidden">전화</span>
          </a>
        </div>
      </div>
    </header>
  );
}
