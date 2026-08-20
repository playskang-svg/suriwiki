import { siteConfig } from "@/config/site";

export default function StatStrip() {
  const { stats } = siteConfig;

  // 사실성 규칙 F3: stats가 설정되어 있지 않으면 렌더링하지 않음
  if (!stats) return null;

  return (
    <section className="w-full bg-surface-clean border-b border-border-subtle py-stack-md">
      <div className="px-grid-margin-mobile md:px-grid-margin-desktop flex justify-between items-center max-w-5xl mx-auto divide-x divide-border-subtle">
        <div className="flex flex-col items-center flex-1 px-2">
          <span className="font-display-lg-mobile text-[24px] md:text-[32px] text-amber-point font-bold">{stats.count}</span>
          <span className="font-status-label text-status-label text-on-surface-variant text-center mt-1">누적 시공 건수</span>
        </div>
        <div className="flex flex-col items-center flex-1 px-2">
          <span className="font-display-lg-mobile text-[24px] md:text-[32px] text-amber-point font-bold">{stats.satisfaction}</span>
          <span className="font-status-label text-status-label text-on-surface-variant text-center mt-1 flex items-center gap-1">
            고객 만족도 <span className="material-symbols-outlined text-[14px] text-amber-point text-amber-point/80">star</span>
          </span>
        </div>
        <div className="flex flex-col items-center flex-1 px-2">
          <span className="font-display-lg-mobile text-[24px] md:text-[32px] text-amber-point font-bold">{stats.colorMatch}</span>
          <span className="font-status-label text-status-label text-on-surface-variant text-center mt-1">조색 일치율</span>
        </div>
      </div>
    </section>
  );
}
