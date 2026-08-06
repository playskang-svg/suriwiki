"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { NewRank1KeywordsShowcase } from "@/components/admin/new-rank1-keywords";
import { TopRankKeywordsWidget } from "@/components/admin/top-rank-keywords";
import {
  getKeywordPages,
  getKeywordSuggestions,
  refreshNaverRankings,
  MAIN_CATEGORIES,
} from "@/lib/store";
import { KeywordPage, KeywordSuggestion } from "@/lib/types";

export default function AdminRankingsPage() {
  const [pages, setPages] = useState<KeywordPage[]>(() => getKeywordPages());
  const suggestions: KeywordSuggestion[] = getKeywordSuggestions();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [rankFilter, setRankFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshRankings = () => {
    setRefreshing(true);
    setTimeout(() => {
      const updated = refreshNaverRankings();
      setPages([...updated]);
      setRefreshing(false);
    }, 600);
  };

  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      const matchCat = selectedCategory === "all" || p.categorySlug === selectedCategory;
      let matchRank = true;
      if (rankFilter === "top1") matchRank = p.naverRank?.currentRank === 1;
      else if (rankFilter === "top5") matchRank = Boolean(p.naverRank && p.naverRank.currentRank > 0 && p.naverRank.currentRank <= 5);
      else if (rankFilter === "top10") matchRank = Boolean(p.naverRank && p.naverRank.currentRank > 0 && p.naverRank.currentRank <= 10);
      return matchCat && matchRank;
    });
  }, [pages, selectedCategory, rankFilter]);

  const top1Count = pages.filter((p) => p.naverRank?.currentRank === 1).length;
  const top5Count = pages.filter((p) => p.naverRank && p.naverRank.currentRank > 0 && p.naverRank.currentRank <= 5).length;
  const validCount = pages.filter((p) => p.naverRank && p.naverRank.currentRank > 0 && p.naverRank.currentRank <= 10).length;

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Title & Refresh Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>💚 네이버 키워드 노출 순위 현황 & AI 제안 (PRD 12.1 & 12.2)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            22개 메인사이트 × 964개 세부 키워드의 네이버 검색 실시간 순위 추적 및 신규 꿀키워드 추천 엔진
          </p>
        </div>

        <button
          onClick={handleRefreshRankings}
          disabled={refreshing}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
        >
          {refreshing ? (
            <span>네이버 순위 조회 중...</span>
          ) : (
            <>
              <span>🔄 네이버 실시간 순위 다시조회</span>
            </>
          )}
        </button>
      </div>

      {/* Naver Ranking Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">네이버 1위 점유 키워드</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{top1Count}개 키워드</p>
          <span className="text-[11px] text-emerald-400 mt-1 block">모바일 통합검색 최상단</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium font-mono">네이버 TOP 5 노출 키워드</span>
          <p className="text-2xl font-extrabold text-blue-400 mt-1">{top5Count}개 키워드</p>
          <span className="text-[11px] text-blue-400 mt-1 block">1페이지 상단 노출</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">네이버 유효 키워드 (TOP 10)</span>
          <p className="text-2xl font-extrabold text-purple-400 mt-1">{validCount}개 키워드</p>
          <span className="text-[11px] text-purple-400 mt-1 block">유효 유입 발생 구간</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">총 추적 키워드 수</span>
          <p className="text-2xl font-extrabold text-slate-100 mt-1">{pages.length}개</p>
          <span className="text-[11px] text-slate-500 mt-1 block">최종 확인: 2026-08-05 19:00</span>
        </div>
      </div>

      {/* NEW: 이번 주 새로운 1위 키워드 40 NEW Showcase */}
      <NewRank1KeywordsShowcase />

      {/* 검색 1위 키워드 전체 (실데이터 기반, 클릭 시 네이버 검색으로 이동) */}
      <TopRankKeywordsWidget />

      {/* AI Keyword Suggestions Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
              AI HIGH-CONVERSION KEYWORDS
            </span>
            <h2 className="text-lg font-bold text-white mt-1">
              ✨ 미개척 꿀키워드 & 신규 지역×공정 확장 제안 모듈
            </h2>
          </div>
          <span className="text-xs text-slate-400">검색량 대비 경쟁 강도가 낮은 고수익 키워드 추천</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((sug) => (
            <div
              key={sug.id}
              className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono text-blue-400 font-bold">
                    {sug.categorySlug} / {sug.regionSlug}
                  </span>
                  <h3 className="font-bold text-sm text-white mt-0.5">
                    💡 &quot;{sug.suggestedKeyword}&quot;
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded">
                  경쟁: {sug.competitionLevel === "low" ? "낮음(낮음)" : "보통"}
                </span>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 leading-relaxed">
                {sug.reason}
              </p>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-400">
                  월간 검색량: <strong className="text-white font-mono">{sug.monthlySearchVolume.toLocaleString()}회</strong>
                </span>
                <Link
                  href="/admin/keywords"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[11px] transition shadow"
                >
                  페이지 즉시 생성 &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Naver Search Rank Matrix Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-3">
          <h2 className="font-bold text-base text-slate-100">
            네이버 검색 노출 순위 현황 전체 매트릭스
          </h2>

          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs"
            >
              <option value="all">전체 공정 (22개)</option>
              {MAIN_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs"
            >
              <option value="all">전체 순위</option>
              <option value="top1">1위 노출 전용</option>
              <option value="top5">TOP 5 이내</option>
              <option value="top10">TOP 10 이내 (유효)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">키워드 랜딩 페이지</th>
                <th className="py-3 px-4">공정 / 지역</th>
                <th className="py-3 px-4">네이버 현재 순위</th>
                <th className="py-3 px-4">순위 변동</th>
                <th className="py-3 px-4">노출 상태</th>
                <th className="py-3 px-4">월간 검색량 (PC+모바일)</th>
                <th className="py-3 px-4 text-right">미리보기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredPages.map((page) => {
                const rank = page.naverRank;
                const cat = MAIN_CATEGORIES.find((c) => c.slug === page.categorySlug);

                return (
                  <tr key={page.id} className="hover:bg-slate-700/40">
                    <td className="py-3 px-4 font-bold text-white">{page.title}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      <span className="text-blue-400">{cat?.name || page.categorySlug}</span> / {page.regionSlug}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm">
                      {rank && rank.currentRank > 0 ? (
                        <span className={rank.currentRank === 1 ? "text-emerald-400" : rank.currentRank <= 5 ? "text-blue-400" : "text-slate-200"}>
                          네이버 {rank.currentRank}위
                        </span>
                      ) : (
                        <span className="text-slate-500">순위 밖</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {rank && rank.rankDelta > 0 ? (
                        <span className="text-emerald-400">▲{rank.rankDelta}</span>
                      ) : rank && rank.rankDelta < 0 ? (
                        <span className="text-red-400">▼{Math.abs(rank.rankDelta)}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {rank?.naverStatus === "top1" ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-bold">
                          1위 노출
                        </span>
                      ) : rank?.naverStatus === "top5" ? (
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded font-bold">
                          상위 노출
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/30 rounded font-bold">
                          색인 수집 완료
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {rank ? (rank.pcSearchVolume + rank.mobileSearchVolume).toLocaleString() : 0}회
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/services/${page.categorySlug}/${page.regionSlug}`}
                        target="_blank"
                        className="text-blue-400 hover:underline font-medium"
                      >
                        페이지 확인 ↗
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
