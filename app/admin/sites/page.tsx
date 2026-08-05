"use client";

import Link from "next/link";
import { MAIN_CATEGORIES, getContactDistributions, getCompanyProfiles } from "@/lib/store";

export default function AdminSitesPage() {
  const distributions = getContactDistributions();
  const profiles = getCompanyProfiles();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          22개 메인사이트 카테고리 현황 (PRD 12.5 & 1장)
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          독립 도메인으로 분양 운영 가능한 22개 주요 공정별 메인사이트 현황 및 배포된 전담 팀 프로필
        </p>
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">총 분양 메인사이트</span>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">22개 카테고리</p>
          <span className="text-[11px] text-slate-400 mt-1 block">독립 도메인 및 세부 사이트 체계</span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">전체 활성 랜딩페이지</span>
          <p className="text-2xl font-extrabold text-emerald-500 mt-1">739개 활성화</p>
          <span className="text-[11px] text-emerald-500 mt-1 block">평균 33개 지역/공정 랜딩</span>
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
          <span className="text-xs text-slate-500">실시간 스토어 동기화</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">NO</th>
                <th className="py-3 px-4">카테고리명</th>
                <th className="py-3 px-4">Slug (식별자)</th>
                <th className="py-3 px-4">대표 분양 도메인</th>
                <th className="py-3 px-4">전담 팀장</th>
                <th className="py-3 px-4">활성 페이지 수</th>
                <th className="py-3 px-4">배포 연결 회사 프로필</th>
                <th className="py-3 px-4 text-right">바로가기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {MAIN_CATEGORIES.map((cat, idx) => {
                const siteDist = distributions.find(
                  (d) => d.scope === "site" && d.targetSiteId === cat.slug
                );
                const assignedProfile = siteDist
                  ? profiles.find((p) => p.id === siteDist.companyProfileId)
                  : profiles.find((p) => p.id === "cp_default");

                return (
                  <tr key={cat.slug} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {cat.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400">
                      {cat.slug}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {cat.domain}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {cat.teamLeader}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {cat.activeCount}개
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {assignedProfile?.companyName || "기본 HQ"}
                      </span>{" "}
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({assignedProfile?.phoneNumber})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
