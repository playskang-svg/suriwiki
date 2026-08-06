"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MAIN_CATEGORIES } from "@/lib/store";
import { ContactDistribution, CompanyProfile, SiteFranchise, User } from "@/lib/types";

const STATUS_LABEL: Record<SiteFranchise["status"], { label: string; className: string }> = {
  unsold: { label: "미분양 (HQ 운영)", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  reserved: { label: "협의 중", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  sold: { label: "분양 완료", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

/**
 * 22개 메인사이트(카테고리) 현황 + 분양 관리 골격 (PRD 9장, 12.5).
 * 지금 당장 결제·계약 자동화까지는 없지만, 나중에 특정 카테고리를 팀·업체에 분양할 때
 * 바로 쓸 수 있도록 상태(미분양/협의중/분양완료)·소유자 배정 구조를 미리 마련해 둔다.
 */
export default function AdminSitesPage() {
  const [distributions, setDistributions] = useState<ContactDistribution[]>([]);
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [franchises, setFranchises] = useState<SiteFranchise[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resD, resP, resF, resU, resAuth] = await Promise.all([
        fetch("/api/distributions"),
        fetch("/api/contacts"),
        fetch("/api/franchises"),
        fetch("/api/users"),
        fetch("/api/auth"),
      ]);
      const [dataD, dataP, dataF, dataU, dataAuth] = await Promise.all([
        resD.json(),
        resP.json(),
        resF.json(),
        resU.json(),
        resAuth.json(),
      ]);
      if (dataD.success) setDistributions(dataD.data);
      if (dataP.success) setProfiles(dataP.data);
      if (dataF.success) setFranchises(dataF.data);
      if (dataU.success) setUsers(dataU.data);
      if (dataAuth.authenticated) setCurrentRole(dataAuth.user.role);
    } catch (err) {
      console.error("Failed to load site data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const isMasterAdmin = currentRole === "master_admin";
  const soldCount = franchises.filter((f) => f.status === "sold").length;

  const handleAssign = async (
    categorySlug: string,
    updates: Partial<Pick<SiteFranchise, "status" | "ownerUserId">>
  ) => {
    try {
      const res = await fetch("/api/franchises", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorySlug, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAll();
      } else {
        alert(data.message || "저장에 실패했습니다.");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          22개 메인사이트 카테고리 현황 & 분양 관리 (PRD 9장 & 12.5)
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          독립 도메인으로 분양 운영 가능한 22개 주요 공정별 메인사이트 현황, 배포된 전담 팀 프로필과
          분양 상태를 관리합니다.
        </p>
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">총 메인사이트 카테고리</span>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {MAIN_CATEGORIES.length}개 카테고리
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">독립 도메인 및 세부 사이트 체계</span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">분양 완료</span>
          <p className="text-2xl font-extrabold text-emerald-500 mt-1">{soldCount}개</p>
          <span className="text-[11px] text-emerald-500 mt-1 block">
            나머지 {MAIN_CATEGORIES.length - soldCount}개는 HQ 직영 운영 중
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">회사/팀 프로필 연결률</span>
          <p className="text-2xl font-extrabold text-purple-500 mt-1">100%</p>
          <span className="text-[11px] text-purple-500 mt-1 block">PRD 11.3 배포 원칙 준수</span>
        </div>
      </div>

      {/* 22 Main Site Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            PRD 12.5 22개 키워드 카테고리 현황 전체 표
          </h2>
          <span className="text-xs text-slate-500">
            {isMasterAdmin ? "마스터 관리자 — 분양 배정 가능" : "실시간 스토어 동기화"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">NO</th>
                <th className="py-3 px-4">카테고리명</th>
                <th className="py-3 px-4">대표 분양 도메인</th>
                <th className="py-3 px-4">배포 연결 회사 프로필</th>
                <th className="py-3 px-4">분양 상태</th>
                <th className="py-3 px-4">분양 소유자</th>
                <th className="py-3 px-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    불러오는 중...
                  </td>
                </tr>
              ) : (
                MAIN_CATEGORIES.map((cat, idx) => {
                  const siteDist = distributions.find(
                    (d) => d.scope === "site" && d.targetSiteId === cat.slug
                  );
                  const assignedProfile = siteDist
                    ? profiles.find((p) => p.id === siteDist.companyProfileId)
                    : profiles.find((p) => p.id === "cp_default");
                  const franchise = franchises.find((f) => f.categorySlug === cat.slug);
                  const owner = franchise?.ownerUserId
                    ? users.find((u) => u.id === franchise.ownerUserId)
                    : undefined;
                  const statusInfo = STATUS_LABEL[franchise?.status || "unsold"];
                  const isEditing = editingCategory === cat.slug;

                  return (
                    <tr key={cat.slug} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {cat.name}
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">{cat.slug}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{cat.domain}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {assignedProfile?.companyName || "기본 HQ"}
                        </span>{" "}
                        <span className="text-[11px] text-slate-400 font-mono">({assignedProfile?.phoneNumber})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold border ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {owner ? `${owner.name} (@${owner.username})` : "-"}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {isMasterAdmin &&
                          (isEditing ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <select
                                defaultValue={franchise?.status || "unsold"}
                                onChange={(e) =>
                                  handleAssign(cat.slug, { status: e.target.value as SiteFranchise["status"] })
                                }
                                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-[11px]"
                              >
                                <option value="unsold">미분양</option>
                                <option value="reserved">협의 중</option>
                                <option value="sold">분양 완료</option>
                              </select>
                              <select
                                defaultValue={franchise?.ownerUserId || ""}
                                onChange={(e) => handleAssign(cat.slug, { ownerUserId: e.target.value || undefined })}
                                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-[11px]"
                              >
                                <option value="">소유자 미지정</option>
                                {users
                                  .filter((u) => u.role === "site_owner" || u.role === "team_leader")
                                  .map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name} (@{u.username})
                                    </option>
                                  ))}
                              </select>
                              <button
                                onClick={() => setEditingCategory(null)}
                                className="px-2 py-1 bg-slate-700 rounded text-[11px] text-white"
                              >
                                완료
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingCategory(cat.slug)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-[11px]"
                            >
                              분양 배정
                            </button>
                          ))}
                        <Link
                          href={`/services/${cat.slug}`}
                          target="_blank"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          허브 이동 ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
