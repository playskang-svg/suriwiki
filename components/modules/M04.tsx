import { ModuleProps } from "@/lib/schemas/modules";

export default function M04({ body }: ModuleProps<"M04">) {
  return (
    <div className="bg-surface-container-low rounded-xl p-stack-md mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-sm">발생 원인</h2>
      <div className="flex flex-col gap-2 relative">
        {body.steps.map((step, idx) => (
          <div key={idx} className="flex flex-col gap-2">
            <div className="flex items-center gap-3 bg-surface-clean p-4 rounded-lg border border-border-subtle shadow-sm relative z-10">
              <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-[14px] shrink-0">
                {step.n}
              </div>
              <span className="font-body-md text-[16px] text-on-surface">{step.text}</span>
            </div>
            {idx < body.steps.length - 1 && (
              <div className="flex justify-center -my-2 z-0">
                <span className="material-symbols-outlined text-outline-variant" aria-hidden="true">arrow_downward</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {!body.observed && (
        <p className="mt-4 font-status-label text-[14px] text-on-surface-variant text-center">
          * 일반적인 발생 구조를 설명한 것입니다.
        </p>
      )}
    </div>
  );
}
