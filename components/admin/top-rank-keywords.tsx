"use client";

import { useEffect, useState } from "react";
import { KeywordPage } from "@/lib/types";
import { MAIN_CATEGORIES, REGIONS_DATA } from "@/lib/store";

function naverSearchUrl(keyword: string): string {
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
}

function keywordLabel(page: KeywordPage): string {
  const cat = MAIN_CATEGORIES.find((c) => c.slug === page.categorySlug)?.name || page.categorySlug;
  const reg = REGIONS_DATA.find((r) => r.slug === page.regionSlug)?.name || page.regionSlug;
  return `${reg} ${cat}`;
}

/**
 * 검색 1위 키워드 위젯 (PRD 12.1, 대시보드페이지_5.png 벤치마킹).
 * 레퍼런스처럼 고정 숫자를 박아넣지 않고, 실제 키워드 페이지 데이터(getKeywordPages)에서
 * naverRank.currentRank === 1 인 항목만 실시간으로 집계해 보여준다 — 실제 순위가 바뀌면
 * 개수와 목록이 그대로 같이 바뀐다. 각 키워드를 클릭하면 네이버 검색 결과가 새 탭으로 열린다.
 */
export function TopRankKeywordsWidget() {
  const [pages, setPages] = useState<KeywordPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/keywords")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPages(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const topRankPages = pages.filter((p) => p.naverRank?.currentRank === 1);

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>🥇 검색 1위 키워드</span>
        </h2>
        <span className="px-3 py-1 bg-amber-500 text-white font-extrabold text-xs rounded-full shadow-sm">
          {loading ? "…" : `${topRankPages.length}개 · 네이버 검색 1위`}
        </span>
      </div>

      <div className="bg-amber-500/5 dark:bg-amber-950/20 border-2 border-amber-400/40 dark:border-amber-500/40 rounded-2xl p-5 md:p-6 shadow-sm max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-slate-400">불러오는 중...</p>
        ) : topRankPages.length === 0 ? (
          <p className="text-xs text-slate-400">현재 네이버 검색 1위로 집계된 키워드가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {topRankPages.map((page) => (
              <a
                key={page.id}
                href={naverSearchUrl(keywordLabel(page))}
                target="_blank"
                rel="noopener noreferrer"
                title={`네이버에서 "${keywordLabel(page)}" 검색 결과 보기`}
                className="bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex items-center gap-1.5 shadow-xs transition duration-200 group"
              >
                <span className="text-slate-400 text-xs">🔍</span>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                  {keywordLabel(page)}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
