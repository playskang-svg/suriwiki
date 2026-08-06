"use client";

import { useState, useEffect } from "react";
import { User, ServiceCategorySlug } from "@/lib/types";
import { MAIN_CATEGORIES } from "@/lib/store";

// components/admin/admin-sidebar.tsx의 NAV_ITEMS와 동일한 경로를 쓴다 — 여기서 체크한 페이지가
// 그대로 사이드바 노출 여부 + AdminPageGuard 접근 허용 목록이 된다.
const ADMIN_PAGE_OPTIONS = [
  { href: "/admin", label: "대시보드 KPI" },
  { href: "/admin/rankings", label: "네이버 순위 & 키워드 제안" },
  { href: "/admin/images", label: "섹션별 이미지 관리" },
  { href: "/admin/sites", label: "22개 메인사이트 & 분양 관리" },
  { href: "/admin/keywords", label: "키워드·페이지 운영" },
  { href: "/admin/links", label: "거미줄 내부링크" },
  { href: "/admin/contacts", label: "회사정보·연락처 배포" },
  { href: "/admin/guide", label: "이용방법 가이드" },
] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editAllowedCategories, setEditAllowedCategories] = useState<ServiceCategorySlug[]>([]);
  const [editAllowedPages, setEditAllowedPages] = useState<string[]>([]);
  const [editRole, setEditRole] = useState<User["role"]>("team_leader");
  const [saving, setSaving] = useState(false);

  // 신규 관리자 계정 직접 생성 폼 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<User["role"]>("team_leader");
  const [newCategories, setNewCategories] = useState<ServiceCategorySlug[]>([]);
  const [creating, setCreating] = useState(false);

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
    setEditAllowedPages(user.allowedAdminPages || []);
    setEditRole(user.role);
  };

  const toggleCategory = (slug: ServiceCategorySlug) => {
    setEditAllowedCategories((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const togglePage = (href: string) => {
    setEditAllowedPages((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
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
          allowedAdminPages: editAllowedPages,
          role: editRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("계정별 권한이 성공적으로 수정되었습니다!");
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

  const resetCreateForm = () => {
    setNewUsername("");
    setNewPassword("");
    setNewName("");
    setNewRole("team_leader");
    setNewCategories([]);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) {
      alert("아이디, 비밀번호, 이름은 필수입니다.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
          role: newRole,
          allowedCategorySlugs: newCategories,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`관리자 계정이 생성되었습니다. (아이디: ${newUsername})`);
        setShowCreateModal(false);
        resetCreateForm();
        fetchUsers();
      } else {
        alert(data.message || "생성에 실패했습니다.");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`${user.name} (@${user.username}) 계정을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/users?id=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.message || "삭제에 실패했습니다.");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>👥 관리자 계정 & 페이지별 권한 관리 (마스터 관리자 전용)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            신규 운영자 가입 신청을 승인하거나 직접 계정을 생성하고, 담당 카테고리와 접근 가능한
            관리자 페이지를 아이디별로 지정합니다.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>➕ 관리자 계정 직접 생성</span>
        </button>
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
                      {user.role === "master_admin" ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-bold">
                          마스터 관리자
                        </span>
                      ) : user.role === "super_admin" ? (
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
                      {user.role === "master_admin" || user.role === "super_admin" ? (
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
                      {user.role !== "master_admin" && user.allowedAdminPages && user.allowedAdminPages.length > 0 && (
                        <div className="mt-1 text-[10px] text-purple-300">
                          🔒 페이지 {user.allowedAdminPages.length}개로 제한됨
                        </div>
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
                      {user.role !== "master_admin" && (
                        <button
                          onClick={() => openPermissionModal(user)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-[11px]"
                        >
                          권한 지정
                        </button>
                      )}
                      {user.role !== "master_admin" && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded font-medium text-[11px]"
                        >
                          삭제
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
                      ) : user.status === "approved" && user.role !== "master_admin" ? (
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
                계정별 역할 · 카테고리 · 관리자 페이지 권한 지정
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

              <div>
                <label className="block font-bold text-slate-200 mb-2">
                  접근 허용 관리자 페이지 (비워두면 기존처럼 전체 허용)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  하나라도 체크하면 그 즉시 이 계정은 체크된 페이지만 사이드바에 보이고, 다른 관리자
                  페이지 URL로 직접 들어가도 접근이 막힙니다.
                </p>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 border border-slate-700 rounded-xl">
                  {ADMIN_PAGE_OPTIONS.map((page) => {
                    const isChecked = editAllowedPages.includes(page.href);
                    return (
                      <label
                        key={page.href}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition border ${
                          isChecked
                            ? "bg-purple-600/20 border-purple-500 text-white font-bold"
                            : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePage(page.href)}
                          className="rounded border-slate-700 text-purple-600"
                        />
                        <span>{page.label}</span>
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

      {/* 관리자 계정 직접 생성 모달 (마스터 관리자 전용) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-lg text-white">➕ 관리자 계정 직접 생성</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              여기서 만든 계정은 가입 승인 대기 없이 바로 로그인할 수 있는 상태(approved)로 생성됩니다.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">아이디 *</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    placeholder="예: gangnam_team"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">비밀번호 *</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">이름 / 팀장명 *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="예: 강남 문수리 팀장"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">역할</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as User["role"])}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                >
                  <option value="team_leader">현장 전담 팀장 (team_leader)</option>
                  <option value="site_owner">분양 사이트 소유자 (site_owner)</option>
                  <option value="super_admin">최고 관리자 (super_admin)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-2">담당 카테고리 (선택)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-900 border border-slate-700 rounded-xl">
                  {MAIN_CATEGORIES.map((cat) => {
                    const isChecked = newCategories.includes(cat.slug);
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
                          onChange={() =>
                            setNewCategories((prev) =>
                              prev.includes(cat.slug)
                                ? prev.filter((s) => s !== cat.slug)
                                : [...prev, cat.slug]
                            )
                          }
                          className="rounded border-slate-700 text-blue-600"
                        />
                        <span>{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  관리자 페이지별 접근 권한은 계정 생성 후 목록에서 &quot;권한 지정&quot;으로 설정하세요.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="px-4 py-2 bg-slate-700 rounded text-slate-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow"
                >
                  {creating ? "생성 중..." : "계정 생성"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
