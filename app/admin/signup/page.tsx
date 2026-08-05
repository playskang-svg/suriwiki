"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MAIN_CATEGORIES } from "@/lib/store";
import { ServiceCategorySlug } from "@/lib/types";

export default function AdminSignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"team_leader" | "site_owner">("team_leader");
  const [selectedCategories, setSelectedCategories] = useState<ServiceCategorySlug[]>(["moon-suri"]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const toggleCategory = (slug: ServiceCategorySlug) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (selectedCategories.length === 0) {
      setError("담당 희망 카테고리를 최소 1개 이상 선택해 주세요.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          name,
          role,
          requestedCategories: selectedCategories,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
      } else {
        setError(data.message || "가입 신청에 실패했습니다.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 py-12">
      <div className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">수리위키 운영자 가입 신청</h1>
          <p className="text-xs text-slate-400">
            분양 사이트 소유자 및 전담 팀장 전용 계정 신청 (최고 관리자 승인 후 사용)
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        {successMsg ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="font-bold text-lg text-white">가입 신청 완료!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{successMsg}</p>
            <div className="pt-2">
              <Link
                href="/admin/login"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition inline-block"
              >
                로그인 페이지로 이동
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">희망 아이디 *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="예: team_gangnam"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">비밀번호 *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="비밀번호 입력"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">신청자 성함 / 팀장명 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="예: 홍길동 팀장"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">신청 역할</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "team_leader" | "site_owner")}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="team_leader">현장 전담 팀장 (team_leader)</option>
                  <option value="site_owner">분양 사이트 소유자 (site_owner)</option>
                </select>
              </div>
            </div>

            {/* Requested Category Selection Checkboxes */}
            <div className="space-y-2 pt-2">
              <label className="block font-bold text-slate-200">
                담당 희망 22개 메인사이트 카테고리 선택 (중복 가능)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-900 border border-slate-700 rounded-xl">
                {MAIN_CATEGORIES.map((cat) => {
                  const isChecked = selectedCategories.includes(cat.slug);
                  return (
                    <label
                      key={cat.slug}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition border ${
                        isChecked
                          ? "bg-blue-600/20 border-blue-500 text-white font-bold"
                          : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat.slug)}
                        className="rounded border-slate-700 text-blue-600"
                      />
                      <span>{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center gap-2"
            >
              {loading ? <span>가입 신청 처리 중...</span> : <span>가입 신청하기</span>}
            </button>
          </form>
        )}

        <div className="text-center pt-2 text-xs">
          <Link href="/admin/login" className="text-slate-400 hover:text-slate-200 transition">
            ← 이미 계정이 있으신가요? 로그인 페이지로
          </Link>
        </div>
      </div>
    </div>
  );
}
