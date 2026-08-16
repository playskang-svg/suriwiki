"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-6 text-center space-y-4 font-sans">
        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-xl">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-900">전역 시스템 오류</h2>
        <p className="text-xs text-slate-500 max-w-md">
          {error.message || "시스템을 로드하는 중 오류가 발생했습니다."}
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
        >
          새로고침
        </button>
      </body>
    </html>
  );
}
