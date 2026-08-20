import { ModuleProps } from "@/lib/schemas/modules";

export default function M10({ body }: ModuleProps<"M10">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">셀프 시공 절차</h2>
      <div className="bg-surface-container-low p-4 rounded-xl mb-4 border border-border-subtle">
        <h3 className="font-headline-md text-[18px] text-on-surface mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-trust-blue" aria-hidden="true">home_repair_service</span>
          준비물
        </h3>
        <ul className="list-disc list-inside font-body-md text-[16px] text-on-surface-variant">
          {body.prepare.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-4 relative mb-4">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-surface-variant z-0" />
        {body.steps.map((step, idx) => (
          <div key={idx} className="flex gap-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[14px] shrink-0 mt-1 shadow-sm">
              {step.n}
            </div>
            <div className="flex-1 bg-surface-clean border border-border-subtle p-4 rounded-xl shadow-sm flex flex-col gap-1">
              <span className="font-headline-md text-[18px] text-on-surface">{step.title}</span>
              <span className="font-body-md text-[16px] text-on-surface-variant">{step.desc}</span>
            </div>
          </div>
        ))}
      </div>
      {body.stop_if.length > 0 && (
        <div className="bg-error-container p-4 rounded-xl border border-error-container/20">
          <h3 className="font-headline-md text-[18px] text-on-error-container mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-error" aria-hidden="true">warning</span>
            다음 상황에서는 즉시 중단하세요
          </h3>
          <ul className="list-disc list-inside font-body-md text-[16px] text-on-error-container">
            {body.stop_if.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
