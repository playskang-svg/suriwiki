import { ModuleProps } from "@/lib/schemas/modules";

export default function M05({ body }: ModuleProps<"M05">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">상태 구분</h2>
      <div className="flex flex-col gap-3">
        {body.grades.map((grade, idx) => {
          const isCurrent = grade.level === body.case_grade;
          return (
            <div key={idx} className={`flex items-stretch rounded-xl overflow-hidden border ${isCurrent ? 'border-primary shadow-md' : 'border-border-subtle bg-surface-clean'}`}>
              <div className={`w-2 shrink-0 ${isCurrent ? 'bg-primary' : 'bg-surface-variant'}`} />
              <div className="p-4 flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-headline-md text-[18px] ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>{grade.level}</span>
                  {isCurrent && <span className="font-label-caps text-[12px] bg-primary-fixed text-primary px-2 py-0.5 rounded">현재 상태</span>}
                </div>
                <span className="font-body-md text-[16px] text-on-surface-variant">{grade.desc}</span>
                <span className="font-status-label text-[14px] text-on-surface mt-1 border-t border-border-subtle pt-2">조치: {grade.action}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
