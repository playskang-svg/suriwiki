"use client";

/** 키워드를 클릭하면 실제 네이버 검색 결과 화면이 새 탭으로 열리도록 한다. */
function naverSearchUrl(keyword: string): string {
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
}

const NEW_RANK1_KEYWORDS = [
  { keyword: "강남 벽지복원", catSlug: "byeokji-bokwon", regSlug: "gangnam" },
  { keyword: "강동 문필름시공", catSlug: "moon-film-sigong", regSlug: "gangnam" },
  { keyword: "강동 필름시공", catSlug: "film-sigong", regSlug: "gangnam" },
  { keyword: "경기 마루복원", catSlug: "maru-bokwon", regSlug: "bundang" },
  { keyword: "고양 도배복원", catSlug: "dobae-bokwon", regSlug: "mapo" },
  { keyword: "구로 부분도배", catSlug: "bubun-dobae", regSlug: "mapo" },
  { keyword: "구리 마루복원", catSlug: "maru-bokwon", regSlug: "gangnam" },
  { keyword: "군포 문수리", catSlug: "moon-suri", regSlug: "gunpo" },
  { keyword: "기흥 문지방수리", catSlug: "moonjibang-suri", regSlug: "suwon" },
  { keyword: "남동구 필름시공", catSlug: "film-sigong", regSlug: "incheon-namdong" },
  { keyword: "도봉 마루복원", catSlug: "maru-bokwon", regSlug: "mapo" },
  { keyword: "동대문 깨진문수리", catSlug: "kkaejin-moon-suri", regSlug: "seoul" },
  { keyword: "동탄 나무문수리", catSlug: "namu-moon-suri", regSlug: "suwon" },
  { keyword: "마포 부분도배", catSlug: "bubun-dobae", regSlug: "mapo" },
  { keyword: "마포 필름시공", catSlug: "film-sigong", regSlug: "mapo" },
  { keyword: "목동 깨진문수리", catSlug: "kkaejin-moon-suri", regSlug: "mapo" },
  { keyword: "미아 문필름시공", catSlug: "moon-film-sigong", regSlug: "mapo" },
  { keyword: "분당 도배복원", catSlug: "dobae-bokwon", regSlug: "bundang" },
  { keyword: "분당 보수도배", catSlug: "bosu-dobae", regSlug: "bundang" },
  { keyword: "서울 마루복원", catSlug: "maru-bokwon", regSlug: "seocho" },
  { keyword: "서울나무문수리", catSlug: "namu-moon-suri", regSlug: "gangnam" },
  { keyword: "성남 벽지복원", catSlug: "byeokji-bokwon", regSlug: "bundang" },
  { keyword: "성북구 문수리", catSlug: "moon-suri", regSlug: "seoul" },
  { keyword: "수원 벽지복원", catSlug: "byeokji-bokwon", regSlug: "suwon" },
  { keyword: "수원강마루보수", catSlug: "gangmaru-bosu", regSlug: "suwon" },
  { keyword: "수지 문지방수리", catSlug: "moonjibang-suri", regSlug: "suwon" },
  { keyword: "용인 문지방수리", catSlug: "moonjibang-suri", regSlug: "suwon" },
  { keyword: "의왕 문수리", catSlug: "moon-suri", regSlug: "gunpo" },
  { keyword: "의정부 깨진문수리", catSlug: "kkaejin-moon-suri", regSlug: "seoul" },
  { keyword: "의정부 마루복원", catSlug: "maru-bokwon", regSlug: "seoul" },
  { keyword: "인천 계양 문수리", catSlug: "moon-suri", regSlug: "incheon-namdong" },
  { keyword: "인천 문턱수리", catSlug: "moonteok-suri", regSlug: "incheon-namdong" },
  { keyword: "인천 미추홀 문수리", catSlug: "moon-suri", regSlug: "incheon-namdong" },
  { keyword: "인천검단 방문필름시공", catSlug: "bangmun-film-sigong", regSlug: "incheon-namdong" },
  { keyword: "인천나무문수리", catSlug: "namu-moon-suri", regSlug: "incheon-namdong" },
  { keyword: "인천미추홀 문지방수리", catSlug: "moonjibang-suri", regSlug: "incheon-namdong" },
  { keyword: "인천연수 문지방수리", catSlug: "moonjibang-suri", regSlug: "incheon-namdong" },
  { keyword: "판교 부분도배", catSlug: "bubun-dobae", regSlug: "bundang" },
  { keyword: "평택 마루복원", catSlug: "maru-bokwon", regSlug: "suwon" },
  { keyword: "화성 필름시공", catSlug: "film-sigong", regSlug: "suwon" },
];

export function NewRank1KeywordsShowcase() {
  return (
    <div className="space-y-4 font-sans">
      {/* Title & Badge */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>🆕 이번 주 새로운 1위 키워드</span>
        </h2>
        <span className="px-3 py-1 bg-red-500 text-white font-extrabold text-xs rounded-full shadow-sm animate-pulse">
          {NEW_RANK1_KEYWORDS.length} NEW
        </span>
      </div>

      {/* Pink Border Box Container matching reference screenshot */}
      <div className="bg-rose-500/5 dark:bg-rose-950/20 border-2 border-rose-400/40 dark:border-rose-500/40 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {NEW_RANK1_KEYWORDS.map((item, idx) => (
            <a
              key={idx}
              href={naverSearchUrl(item.keyword)}
              target="_blank"
              rel="noopener noreferrer"
              title={`네이버에서 "${item.keyword}" 검색 결과 보기`}
              className="bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl p-3 flex items-center justify-between shadow-xs transition duration-200 group"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-400 text-xs">🔍</span>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate">
                  {item.keyword}
                </span>
              </div>
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded tracking-tighter shrink-0 ml-1">
                NEW
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
