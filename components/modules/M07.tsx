import { ModuleProps } from "@/lib/schemas/modules";

export default function M07({ body }: ModuleProps<"M07">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">수리 vs 교체 기준</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-clean border border-border-subtle rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 border-b border-border-subtle pb-2">
            <span className="material-symbols-outlined text-trust-blue" aria-hidden="true">build</span>
            <span className="font-headline-md text-[18px] text-on-surface">수리 가능</span>
          </div>
          <ul className="flex flex-col gap-2">
            {body.repair_when.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-trust-blue text-[18px] mt-0.5" aria-hidden="true">check</span>
                <span className="font-body-md text-[16px] text-on-surface-variant">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-surface-clean border border-border-subtle rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 border-b border-border-subtle pb-2">
            <span className="material-symbols-outlined text-secondary" aria-hidden="true">autorenew</span>
            <span className="font-headline-md text-[18px] text-on-surface">교체 필요</span>
          </div>
          <ul className="flex flex-col gap-2">
            {body.replace_when.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5" aria-hidden="true">priority_high</span>
                <span className="font-body-md text-[16px] text-on-surface-variant">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
