"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { KpiCard } from "@/components/admin/kpi-card";
import { NewRank1KeywordsShowcase } from "@/components/admin/new-rank1-keywords";
import { TopRankKeywordsWidget } from "@/components/admin/top-rank-keywords";
import { getDashboardKpi, MAIN_CATEGORIES, getKeywordSuggestions } from "@/lib/store";

interface Lead {
  id: string;
  categorySlug: string;
  regionSlug: string;
  customerName: string;
  customerPhone: string;
  content: string;
  imageUrl?: string;
  submittedAt: string;
  status: "new" | "contacted" | "completed" | "cancelled";
  utmSource?: string;
}

export default function AdminDashboardPage() {
  const kpi = getDashboardKpi();
  const suggestions = getKeywordSuggestions();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch("/api/consultations");
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (id: string, status: Lead["status"]) => {
    try {
      const res = await fetch("/api/consultations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      }
    } catch (err) {
      alert("상태 변경 실패");
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("정말 이 상담 신청 내역을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/consultations?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("삭제되었습니다.");
        fetchLeads();
      }
    } catch (err) {
      alert("삭제 실패");
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Top Title & User Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>⚙️ 수리위키 통합 운영 & 상담·이미지 관리 대시보드</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            22개 메인사이트 · 964개 키워드 페이지 실시간 운영 및 1:1 전화 상담 신청 접수함
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/images"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1"
          >
            <span>🖼️ 메인/섹션 이미지 교체</span>
          </Link>
          <Link
            href="/admin/keywords"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
          >
            <span>📋 키워드 본문 수정</span>
          </Link>
          <Link
            href="/admin/contacts"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1"
          >
            <span>⚙️ 회사정보 배포</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="메인사이트" value={kpi.siteCount} delta={kpi.siteCountDelta} />
        <KpiCard label="세부사이트 (키워드 페이지)" value={kpi.keywordPageCount} delta={kpi.keywordPageCountDelta} />
        <KpiCard label="총 제작 항목" value={kpi.totalItemCount} delta={kpi.totalItemCountDelta} />
        <KpiCard
          label="네이버 유효키워드 (TOP 10)"
          value={kpi.naverValidKeywordCount}
          delta={kpi.naverValidKeywordCountDelta}
          emphasize
        />
        <KpiCard label="네이버 1위 점유 키워드" value={kpi.naverTopRankKeywordCount} />
        <KpiCard label="이번 주 신규 키워드" value={kpi.newKeywordThisWeekCount} />
      </div>

      {/* NEW: 이번 주 새로운 1위 키워드 40 NEW Showcase */}
      <NewRank1KeywordsShowcase />

      {/* 검색 1위 키워드 전체 (실데이터 기반, 클릭 시 네이버 검색으로 이동) */}
      <TopRankKeywordsWidget />

      {/* AI Keyword Suggestions Preview Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-blue-950/80 border border-slate-700 rounded-xl p-5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold rounded">
              AI KEYWORD RECOMMENDATIONS
            </span>
            <h3 className="font-bold text-sm text-white">✨ 미개척 꿀키워드 제안 ({suggestions.length}건)</h3>
          </div>
          <Link href="/admin/rankings" className="text-xs text-blue-400 hover:underline font-semibold">
            전체 순위 및 제안 보기 &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {suggestions.slice(0, 2).map((sug) => (
            <div key={sug.id} className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/70 space-y-1">
              <span className="text-[10px] text-blue-400 font-mono">{sug.categorySlug} / {sug.regionSlug}</span>
              <p className="font-bold text-white">&quot;{sug.suggestedKeyword}&quot;</p>
              <p className="text-slate-400 text-[11px] truncate">{sug.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Consultation Leads Inbox (전화 상담 신청) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>📥 1:1 상담 신청 실시간 수신함</span>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white text-xs font-mono rounded-full font-bold">
                {leads.length}건
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              고객이 상담폼에서 전송한 성함, 연락처, 현장 상태 내용을 확인하고 전화로 안내하세요.
            </p>
          </div>

          <button
            onClick={fetchLeads}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-xs transition"
          >
            🔄 새로고침
          </button>
        </div>

        {loadingLeads ? (
          <div className="py-8 text-center text-xs text-slate-400">상담 내역 불러오는 중...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-700">
            현재 수신된 상담 내역이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">접수시간</th>
                  <th className="py-3 px-4">유입 키워드 (공정/지역)</th>
                  <th className="py-3 px-4">고객명 / 연락처</th>
                  <th className="py-3 px-4">문의 내용</th>
                  <th className="py-3 px-4">진행 상태</th>
                  <th className="py-3 px-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {leads.map((lead) => {
                  const catName = MAIN_CATEGORIES.find((c) => c.slug === lead.categorySlug)?.name || lead.categorySlug;
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-slate-400 font-mono">{lead.submittedAt}</td>
                      <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                        {lead.regionSlug} {catName}
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-slate-100">
                        <div className="font-bold">{lead.customerName}</div>
                        <a href={`tel:${lead.customerPhone}`} className="text-slate-400 font-mono hover:underline">
                          {lead.customerPhone}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
                        {lead.content}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value as Lead["status"])}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                            lead.status === "new"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                              : lead.status === "contacted"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          <option value="new">신규 (new)</option>
                          <option value="contacted">상담 진행 (contacted)</option>
                          <option value="completed">시공 완료 (completed)</option>
                          <option value="cancelled">취소됨 (cancelled)</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded text-[11px] font-semibold transition"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
