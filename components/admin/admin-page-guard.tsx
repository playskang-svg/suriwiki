"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: string;
  allowedAdminPages?: string[];
}

/**
 * 관리자 페이지별 접근 권한 서버-무관 가드.
 *
 * - /admin/users(계정 관리)는 master_admin만 접근 가능 — 다른 역할은 사이드바에서 숨겨져도
 *   URL을 직접 입력해 들어올 수 있으므로 여기서 다시 한번 막는다.
 * - 그 외 페이지는 allowedAdminPages가 비어있으면(기본값) 기존과 동일하게 전체 허용하고,
 *   마스터 관리자가 명시적으로 목록을 지정한 계정만 그 목록으로 제한한다.
 */
export function AdminPageGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    if (pathname === "/admin/login" || pathname === "/admin/signup") {
      setState("allowed");
      return;
    }

    let cancelled = false;
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.authenticated || !data.user) {
          setState("denied");
          return;
        }
        const user: SessionUser = data.user;

        if (pathname === "/admin/users") {
          setState(user.role === "master_admin" ? "allowed" : "denied");
          return;
        }

        if (user.role === "master_admin") {
          setState("allowed");
          return;
        }

        if (user.allowedAdminPages && user.allowedAdminPages.length > 0) {
          setState(user.allowedAdminPages.includes(pathname) ? "allowed" : "denied");
        } else {
          setState("allowed");
        }
      })
      .catch(() => !cancelled && setState("denied"));

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (state === "loading") return null;

  if (state === "denied") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-4xl">🔒</span>
        <p className="text-lg font-bold text-white mt-4">이 페이지에 대한 접근 권한이 없습니다</p>
        <p className="text-sm text-slate-400 mt-2">
          권한이 필요하면 마스터 관리자에게 요청하세요.
        </p>
        <Link href="/admin" className="mt-6 text-blue-400 hover:underline text-sm font-semibold">
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
