"use client";

import { useState, useEffect } from "react";
import { User, ServiceCategorySlug } from "@/lib/types";
import { MAIN_CATEGORIES } from "@/lib/store";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editAllowedCategories, setEditAllowedCategories] = useState<ServiceCategorySlug[]>([]);
  const [editRole, setEditRole] = useState<User["role"]>("team_leader");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (id: string, status: User["status"]) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    }
  };

  const openPermissionModal = (user: User) => {
    setEditingUserId(user.id);
    setEditAllowedCategories(user.allowedCategorySlugs || []);
    setEditRole(user.role);
  };

  const toggleCategory = (slug: ServiceCategorySlug) => {
    setEditAllowedCategories((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUserId,
          allowedCategorySlugs: editAllowedCategories,
          role: editRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("계정별 담당 카테고리 권한이 성공적으로 수정되었습니다!");
        setEditingUserId(null);
        fetchUsers();
      } else {
        alert(data.message || "수정에 실패했습니다.");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <span>👥 사용자 승인 및 계정별 권한 관리</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          신규 운영자 가입 신청을 승인하고, 각 아이디(계정)별로 담당할 22개 메인사이트 카테고리를 지정합니다.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">전체 회원 계정</span>
          <p className="text-2xl font-extrabold text-white mt-1">{users.length}명</p>
          <span className="text-[11px] text-slate-400 mt-1 block">최고 관리자 및 팀장 계정</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium font-mono">가입 승인 대기 중</span>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">
            {users.filter((u) => u.status === "pending").length}명
          </p>
          <span className="text-[11px] text-amber-400 mt-1 block">승인 요청 처리 필요</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">활성 승인 회원</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">
            {users.filter((u) => u.status === "approved").length}명
          </p>
          <span className="text-[11px] text-emerald-400 mt-1 block">정상 로그인 및 대시보드 이용 중</span>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <h2 className="font-bold text-base text-slate-100">
            등록된 계정 목록 및 담당 카테고리 현황
          </h2>
          <span className="text-xs text-slate-400">아이디별 권한 선택 및 관리</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">사용자 목록 로딩 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">가입일</th>
                  <th className="py-3 px-4">아이디 (Username)</th>
                  <th className="py-3 px-4">성함 / 팀장명</th>
                  <th className="py-3 px-4">역할 (Role)</th>
                  <th className="py-3 px-4">담당 허용 카테고리 (Scope)</th>
                  <th className="py-3 px-4">승인 상태</th>
                  <th className="py-3 px-4 text-right">권한 및 승인 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/40">
                    <td className="py-3 px-4 text-slate-400 font-mono">{user.createdAt}</td>
                    <td className="py-3 px-4 font-bold text-blue-400 font-mono">{user.username}</td>
                    <td className="py-3 px-4 font-semibold text-white">{user.name}</td>
                    <td className="py-3 px-4">
                      {user.role === "super_admin" ? (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded font-bold">
                          최고 관리자
                        </span>
                      ) : user.role === "team_leader" ? (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded font-bold">
                          현장 팀장
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-500/10 text-slate-300 border border-slate-500/30 rounded font-bold">
                          분양 소유자
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.role === "super_admin" ? (
                        <span className="text-emerald-400 font-bold">전체 22개 사이트 (Full)</span>
                      ) : user.allowedCategorySlugs && user.allowedCategorySlugs.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {user.allowedCategorySlugs.map((slug) => {
                            const cat = MAIN_CATEGORIES.find((c) => c.slug === slug);
                            return (
                              <span
                                key={slug}
                                className="px-1.5 py-0.5 bg-slate-900 text-blue-300 rounded border border-slate-700 font-mono text-[10px]"
                              >
                                {cat?.name || slug}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-amber-400 italic">미지정 (카테고리 선택 필요)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.status === "approved" ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-bold">
                          승인됨 (approved)
                        </span>
                      ) : user.status === "pending" ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-bold animate-pulse">
                          승인 대기 (pending)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded font-bold">
                          거절/비활성 (rejected)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {user.role !== "super_admin" && (
                        <button
                          onClick={() => openPermissionModal(user)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-[11px]"
                        >
                          카테고리 권한 지정
                        </button>
                      )}

                      {user.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(user.id, "approved")}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px]"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(user.id, "rejected")}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-medium text-[11px]"
                          >
                            거절
                          </button>
                        </>
                      ) : user.status === "approved" && user.role !== "super_admin" ? (
                        <button
                          onClick={() => handleUpdateStatus(user.id, "rejected")}
                          className="px-2.5 py-1 bg-slate-700 hover:bg-red-950/60 text-slate-300 hover:text-red-400 rounded font-medium text-[11px]"
                        >
                          비활성화
                        </button>
                      ) : user.status === "rejected" ? (
                        <button
                          onClick={() => handleUpdateStatus(user.id, "approved")}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded font-medium text-[11px]"
                        >
                          재승인
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permission Assignment Modal */}
      {editingUserId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-lg text-white">
                계정별 담당 메인사이트 카테고리 권한 지정
              </h3>
              <button
                onClick={() => setEditingUserId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePermissions} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">사용자 역할</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as User["role"])}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                >
                  <option value="team_leader">현장 전담 팀장 (team_leader)</option>
                  <option value="site_owner">분양 사이트 소유자 (site_owner)</option>
                  <option value="super_admin">최고 관리자 (super_admin)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-2">
                  접수 및 편집 허용 22개 메인사이트 카테고리 선택 (아이디별 권한)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-3 bg-slate-900 border border-slate-700 rounded-xl">
                  {MAIN_CATEGORIES.map((cat) => {
                    const isChecked = editAllowedCategories.includes(cat.slug);
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

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className="px-4 py-2 bg-slate-700 rounded text-slate-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow"
                >
                  {saving ? "저장 중..." : "권한 지정 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
