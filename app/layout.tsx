import type { Metadata } from "next";
import "./globals.css";

// 전역 메타데이터 기본값. 페이지별 override는 PRD 6.2(메타데이터)에 따라
// 각 page.tsx의 generateMetadata에서 처리한다.
export const metadata: Metadata = {
  title: "수리위키(SooriWiki)",
  description: "우리 동네 수리 전문가를 찾는 가장 빠른 방법",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="text-slate-900 antialiased">{children}</body>
    </html>
  );
}
