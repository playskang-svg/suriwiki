import { ModuleProps } from "@/lib/schemas/modules";

export default function M14({ body }: ModuleProps<"M14">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">예상 소요 시간 및 비용</h2>
      
      {body.amounts !== null && (
        <div className="bg-primary-fixed/20 p-6 rounded-xl border border-primary-fixed flex flex-col items-center justify-center mb-6">
          <span className="font-label-caps text-[12px] text-primary mb-2">예상 비용</span>
          <span className="font-display-lg-mobile md:text-[48px] text-primary font-bold">{body.amounts}</span>
        </div>
      )}

      <div className="bg-surface-clean border border-border-subtle rounded-xl p-stack-md mb-4 shadow-sm">
        <h3 className="font-headline-md text-[18px] text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-trust-blue" aria-hidden="true">info</span>
          비용과 시간이 달라지는 이유
        </h3>
        <ul className="flex flex-col gap-3">
          {body.factors.map((factor, idx) => (
            <li key={idx} className="flex flex-col gap-1">
              <span className="font-label-caps text-[14px] text-on-surface font-semibold">{factor.name}</span>
              <span className="font-body-md text-[16px] text-on-surface-variant">{factor.effect}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="font-status-label text-[14px] text-on-surface-variant text-center bg-surface-container-low py-3 rounded-lg px-4">
        * {body.disclaimer}
      </p>
    </div>
  );
}
