"use client";

import { useState, useEffect } from "react";
import { CompanyProfile, ContactDistribution } from "@/lib/types";
import { MAIN_CATEGORIES } from "@/lib/store";

export default function AdminContactsPage() {
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [distributions, setDistributions] = useState<ContactDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create profile state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<CompanyProfile> | null>(null);

  // Add distribution state
  const [distProfileId, setDistProfileId] = useState("");
  const [distScope, setDistScope] = useState<"site" | "page">("site");
  const [distTargetSite, setDistTargetSite] = useState("");
  const [distTargetPage, setDistTargetPage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resP, resD] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/distributions"),
      ]);
      const dataP = await resP.json();
      const dataD = await resD.json();

      if (dataP.success) setProfiles(dataP.data);
      if (dataD.success) setDistributions(dataD.data);
    } catch (err) {
      console.error("Failed to load contact data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile?.companyName || !editingProfile?.phoneNumber) {
      alert("회사명과 전화번호는 필수 입력항목입니다.");
      return;
    }

    const isEdit = Boolean(editingProfile.id);
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch("/api/contacts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProfile),
      });
      const data = await res.json();
      if (data.success) {
        setShowProfileModal(false);
        setEditingProfile(null);
        fetchData();
      } else {
        alert(data.message || "저장에 실패했습니다.");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("이 회사 프로필을 삭제하시겠습니까? 관련된 배포 설정도 함께 제거됩니다.")) return;
    try {
      const res = await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("삭제 실패");
    }
  };

  const handleAddDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distProfileId) {
      alert("배포할 회사 프로필을 선택해주세요.");
      return;
    }

    if (distScope === "site" && !distTargetSite) {
      alert("배포 대상 메인사이트를 선택해주세요.");
      return;
    }

    if (distScope === "page" && !distTargetPage) {
      alert("배포 대상 세부 키워드 페이지 경로를 입력해주세요. (예: moon-suri/gangnam)");
      return;
    }

    try {
      const res = await fetch("/api/distributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyProfileId: distProfileId,
          scope: distScope,
          targetSiteId: distScope === "site" ? distTargetSite : undefined,
          targetPageId: distScope === "page" ? distTargetPage : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDistTargetPage("");
        fetchData();
      } else {
        alert(data.message || "배포 설정 등록에 실패했습니다.");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleDeleteDistribution = async (id: string) => {
    try {
      const res = await fetch(`/api/distributions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      alert("삭제 실패");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title & Breadcrumb */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          회사정보·연락처 배포 관리 (PRD 12.4 & 11.3)
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          회사 및 팀 정보는 한 곳에서 등록하고, 어느 분양 사이트 / 세부 키워드 페이지에 노출할지 배포 대상을 제어합니다.
        </p>
      </div>

      {/* 1. Registered Profiles Section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              1. 등록된 회사/팀 프로필 목록
            </h2>
            <p className="text-xs text-slate-500">
              배포 대상에 지정될 핵심 주소, 사업자번호, 대표 연락처 및 영업시간 관리
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProfile({
                companyName: "",
                representativeName: "",
                businessRegistrationNo: "",
                phoneNumber: "",
                operatingHours: "평일 08:00 ~ 20:00",
                serviceRegions: ["서울 전지역"],
                prepInstructions: "",
              });
              setShowProfileModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>새 프로필 등록</span>
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">데이터를 불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-5 bg-slate-50 dark:bg-slate-900/50 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-800 mb-1">
                        {p.id}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {p.companyName}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      대표 {p.representativeName || "-"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-400 w-16">대표번호:</span>
                      <strong className="text-blue-600 dark:text-blue-400 text-sm">{p.phoneNumber}</strong>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-400 w-16">사업자번호:</span>
                      <span>{p.businessRegistrationNo || "미등록"}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-400 w-16 flex-shrink-0">영업시간:</span>
                      <span>{p.operatingHours}</span>
                    </p>
                    {p.prepInstructions && (
                      <p className="mt-2 p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 italic">
                        &quot;{p.prepInstructions}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingProfile(p);
                      setShowProfileModal(true);
                    }}
                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded text-xs transition"
                  >
                    수정
                  </button>
                  {p.id !== "cp_default" && (
                    <button
                      onClick={() => handleDeleteProfile(p.id)}
                      className="px-2.5 py-1 bg-red-100 dark:bg-red-950/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded text-xs transition"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Distribution Mapping Rules Section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
          2. 노출 대상 배포 규칙 설정 (Distribution Mapping)
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          우선순위: 세부 키워드 페이지 배포(Page Override) &gt; 메인사이트 전체 배포(Site Scope) &gt; 기본 HQ 프로필
        </p>

        {/* Add Distribution Form */}
        <form
          onSubmit={handleAddDistribution}
          className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            ➕ 새 배포 대상 지정하기
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                노출할 회사 프로필
              </label>
              <select
                value={distProfileId}
                onChange={(e) => setDistProfileId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="">-- 프로필 선택 --</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.companyName} ({p.phoneNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                배포 범위 (Scope)
              </label>
              <select
                value={distScope}
                onChange={(e) => setDistScope(e.target.value as "site" | "page")}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="site">메인사이트 전체 (Site)</option>
                <option value="page">특정 세부 키워드 페이지 (Page Override)</option>
              </select>
            </div>

            {distScope === "site" ? (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  타겟 메인사이트 (카테고리)
                </label>
                <select
                  value={distTargetSite}
                  onChange={(e) => setDistTargetSite(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">-- 카테고리 선택 --</option>
                  {MAIN_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name} ({cat.domain})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  타겟 페이지 경로 (`category/region`)
                </label>
                <input
                  type="text"
                  value={distTargetPage}
                  onChange={(e) => setDistTargetPage(e.target.value)}
                  placeholder="예: moontle-suri/gunpo"
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            )}

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
              >
                배포 규칙 추가
              </button>
            </div>
          </div>
        </form>

        {/* Existing Distribution List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">범위 (Scope)</th>
                <th className="py-3 px-4">노출 대상 (Target)</th>
                <th className="py-3 px-4">배포 연결 프로필</th>
                <th className="py-3 px-4">노출 대표번호</th>
                <th className="py-3 px-4 rounded-r-lg text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {distributions.map((d) => {
                const profile = profiles.find((p) => p.id === d.companyProfileId);
                return (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4">
                      {d.scope === "page" ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded font-semibold">
                          Page Override
                        </span>
                      ) : d.targetSiteId ? (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded font-semibold">
                          Site Default
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 rounded font-semibold">
                          Global Fallback
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {d.targetPageId
                        ? `/services/${d.targetPageId}`
                        : d.targetSiteId
                        ? `[카테고리] ${MAIN_CATEGORIES.find((c) => c.slug === d.targetSiteId)?.name || d.targetSiteId}`
                        : "전체 시스템 기본값"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {profile?.companyName || "미연결"}
                    </td>
                    <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-bold">
                      {profile?.phoneNumber || "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.id !== "dist_default" && (
                        <button
                          onClick={() => handleDeleteDistribution(d.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating / Editing Profile */}
      {showProfileModal && editingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {editingProfile.id ? "회사 프로필 수정" : "새 회사 프로필 등록"}
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">상호/회사명 *</label>
                  <input
                    type="text"
                    value={editingProfile.companyName || ""}
                    onChange={(e) =>
                      setEditingProfile({ ...editingProfile, companyName: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">대표자명</label>
                  <input
                    type="text"
                    value={editingProfile.representativeName || ""}
                    onChange={(e) =>
                      setEditingProfile({ ...editingProfile, representativeName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">노출 대표 전화번호 *</label>
                  <input
                    type="text"
                    value={editingProfile.phoneNumber || ""}
                    onChange={(e) =>
                      setEditingProfile({ ...editingProfile, phoneNumber: e.target.value })
                    }
                    required
                    placeholder="예: 010-1234-5678 또는 010-4684-8838"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">사업자등록번호</label>
                  <input
                    type="text"
                    value={editingProfile.businessRegistrationNo || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        businessRegistrationNo: e.target.value,
                      })
                    }
                    placeholder="123-45-67890"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">영업시간</label>
                <input
                  type="text"
                  value={editingProfile.operatingHours || ""}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, operatingHours: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">상담 전 준비사항 안내문</label>
                <textarea
                  rows={3}
                  value={editingProfile.prepInstructions || ""}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, prepInstructions: e.target.value })
                  }
                  placeholder="고객이 상담 신청 페이지에서 볼 준비사항 안내"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-200"
                >
                  취소
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
