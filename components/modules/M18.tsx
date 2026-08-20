import { ModuleProps } from "@/lib/schemas/modules";

export default function M18({ body }: ModuleProps<"M18">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">결과 및 한계</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-clean border border-border-subtle rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle">
            <span className="material-symbols-outlined text-trust-blue" aria-hidden="true">thumb_up</span>
            <span className="font-headline-md text-[18px] text-on-surface">개선된 점</span>
          </div>
          <ul className="list-disc list-inside font-body-md text-[16px] text-on-surface-variant flex flex-col gap-1">
            {body.improved.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="bg-surface-container-low border border-border-subtle rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle">
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">info</span>
            <span className="font-headline-md text-[18px] text-on-surface">작업의 한계</span>
          </div>
          <ul className="list-disc list-inside font-body-md text-[16px] text-on-surface-variant flex flex-col gap-1">
            {body.limits.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
