"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드 KPI (12.1)", icon: "📊" },
  { href: "/admin/rankings", label: "네이버 순위 & 키워드 제안", icon: "💚" },
  { href: "/admin/images", label: "섹션별 이미지 관리", icon: "🖼️" },
  { href: "/admin/sites", label: "22개 메인사이트 현황 (12.5)", icon: "🌐" },
  { href: "/admin/keywords", label: "키워드·페이지 운영 (12.2)", icon: "📑" },
  { href: "/admin/links", label: "거미줄 내부링크 (12.3)", icon: "🕸️" },
  { href: "/admin/contacts", label: "회사정보·연락처 배포 (12.4)", icon: "🏢" },
  { href: "/admin/users", label: "사용자 승인 및 권한 (RBAC)", icon: "👥" },
  { href: "/admin/guide", label: "이용방법 가이드 (12.6)", icon: "📖" },
] as const;

interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: string;
  allowedCategorySlugs?: string[];
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  if (pathname === "/admin/login" || pathname === "/admin/signup") {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isSuperAdmin = !currentUser || currentUser.role === "super_admin";

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900 text-slate-200 p-5 flex flex-col justify-between min-h-screen font-sans">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            수
          </div>
          <div>
            <span className="font-bold text-sm text-white block leading-none">
              수리위키 센터
            </span>
            <span className="text-[11px] text-blue-400 font-mono block mt-1">
              v2.3 RBAC Engine
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            시스템 메뉴
          </p>
          {NAV_ITEMS.map((item) => {
            if (item.href === "/admin/users" && !isSuperAdmin) {
              return null;
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="px-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-200">{currentUser?.name || "관리자"}</p>
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-mono font-bold">
              {currentUser?.role === "super_admin" ? "최고관리자" : "전담팀장"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">@{currentUser?.username || "admin"}</p>

          {currentUser?.allowedCategorySlugs && currentUser.allowedCategorySlugs.length > 0 && (
            <p className="text-[10px] text-emerald-400 mt-1 truncate">
              담당: {currentUser.allowedCategorySlugs.join(", ")}
            </p>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700/80 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
