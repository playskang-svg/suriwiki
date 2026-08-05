"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Root Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-6 text-center space-y-4 font-sans">
      <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xl">
        ⚠️
      </div>
      <h2 className="text-xl font-bold text-white">페이지를 로드하는 중 일시적 문제 발생</h2>
      <p className="text-xs text-slate-400 max-w-md">
        {error.message || "페이지 컴포넌트를 불러오는 중 일시적인 세션 오류가 발생했습니다."}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow transition"
      >
        페이지 다시 시도
      </button>
    </div>
  );
}
