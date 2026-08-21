"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type MenuItem = { label: string; href: string };

/**
 * 모바일 햄버거 메뉴.
 *
 * 데스크톱은 헤더에 메뉴를 그대로 펼치고, 좁은 화면에서는 이 버튼만 남긴다.
 * 열려 있는 동안 배경 스크롤을 잠그되 body 의 overflow 를 건드리지 않는다 —
 * 이 프로젝트는 그것 때문에 휠 스크롤이 통째로 죽은 전력이 있다.
 * position: fixed 오버레이로 덮는 방식이라 문서 스크롤 설정을 바꿀 필요가 없다.
 */
export default function MobileMenu({ items, telHref, phone }: { items: MenuItem[]; telHref: string; phone: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-controls="mobile-menu-panel"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-low transition-colors"
      >
        <span className="material-symbols-outlined">{open ? "close" : "menu"}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-16 bg-black/40 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-menu-panel"
            className="fixed inset-x-0 top-16 z-50 bg-surface-clean border-t border-border-subtle shadow-lg"
          >
            <nav className="flex flex-col p-2">
              {items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3.5 rounded-lg font-headline-md text-[17px] text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors flex items-center justify-between"
                >
                  {item.label}
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_right</span>
                </Link>
              ))}
              <a
                href={telHref}
                onClick={() => setOpen(false)}
                className="mt-2 mx-2 mb-2 px-4 py-3.5 rounded-xl bg-primary text-on-primary font-headline-md text-[17px] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
                {phone}
              </a>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
