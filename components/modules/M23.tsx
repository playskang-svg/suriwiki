import { ModuleProps } from "@/lib/schemas/modules";
import Link from "next/link";

export default function M23({ body }: ModuleProps<"M23">) {
  if (body.case_count === 0) return null;

  return (
    <div className="mb-stack-md bg-tertiary text-white rounded-xl p-stack-md shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="font-headline-md text-[24px] mb-0 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-point" aria-hidden="true">location_on</span>
          {body.area_label} 출장 수리
        </h2>
        <span className="font-status-label text-[14px] bg-tertiary-container px-3 py-1.5 rounded-full">
          {body.coverage_note}
        </span>
      </div>
      
      <p className="font-body-md text-[16px] text-outline-variant mb-4">
        {body.area_label} 지역에서 수행한 <strong>{body.case_count}건</strong>의 실제 사례가 있습니다.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {body.cases.map((c, idx) => (
          <Link key={idx} href={c.url} className="bg-tertiary-container rounded-lg overflow-hidden hover:bg-tertiary-container/80 transition-colors flex flex-col group">
            {c.thumb ? (
              <div className="aspect-video bg-surface/10 flex items-center justify-center relative">
                <span className="font-label-caps text-[12px] text-white/50">IMG {c.thumb}</span>
              </div>
            ) : (
              <div className="aspect-video bg-surface/10 flex items-center justify-center relative">
                <span className="material-symbols-outlined text-white/30 text-[32px]">image</span>
              </div>
            )}
            <div className="p-3">
              <span className="font-body-md text-[14px] line-clamp-2 group-hover:text-primary-fixed-dim transition-colors">{c.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
