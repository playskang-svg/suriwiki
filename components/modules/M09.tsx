import { ModuleProps } from "@/lib/schemas/modules";

export default function M09({ body }: ModuleProps<"M09">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">일반 해결방법</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {body.items.map((item, idx) => (
          <div key={idx} className="bg-surface-clean border border-border-subtle p-4 rounded-xl shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">{item.icon}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-headline-md text-[18px] text-on-surface">{item.title}</span>
              <span className="font-body-md text-[16px] text-on-surface-variant">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
