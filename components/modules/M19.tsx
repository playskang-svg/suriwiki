import { ModuleProps } from "@/lib/schemas/modules";
import Link from "next/link";

export default function M19({ body }: ModuleProps<"M19">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">실제 시공 사례</h2>
      <Link href={body.url} className="block bg-surface-clean border border-border-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
        <div className="flex flex-col sm:flex-row">
          {body.thumb_variant_id ? (
            <div className="w-full sm:w-48 aspect-video sm:aspect-square bg-surface-container flex items-center justify-center shrink-0">
              <span className="font-label-caps text-[12px] text-outline-variant">IMG {body.thumb_variant_id}</span>
            </div>
          ) : (
            <div className="w-full sm:w-48 aspect-video sm:aspect-square bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-outline-variant text-[32px]">image</span>
            </div>
          )}
          <div className="p-stack-md flex-1 flex flex-col justify-center">
            <span className="font-label-caps text-[12px] bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded w-fit mb-2">
              {body.area_label}
            </span>
            <span className="font-headline-md text-[18px] text-on-surface mb-4 group-hover:text-primary transition-colors">
              {body.one_line}
            </span>
            <div className="flex items-center gap-1 text-primary font-status-label text-[14px]">
              자세히 보기
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
