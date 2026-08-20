import { ModuleProps } from "@/lib/schemas/modules";
import Link from "next/link";

export default function M22({ body }: ModuleProps<"M22">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">관련 콘텐츠</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {body.items.map((item, idx) => (
          <Link key={idx} href={item.url} className="bg-surface-clean border border-border-subtle rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between min-h-[120px]">
            <span className="font-label-caps text-[12px] text-primary mb-2 uppercase">{item.relation}</span>
            <span className="font-headline-md text-[18px] text-on-surface group-hover:text-primary transition-colors flex-1">{item.title}</span>
            <div className="flex justify-end mt-2">
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors" aria-hidden="true">arrow_forward</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
