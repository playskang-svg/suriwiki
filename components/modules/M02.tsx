import { ModuleProps } from "@/lib/schemas/modules";

export default function M02({ body }: ModuleProps<"M02">) {
  return (
    <div className="bg-surface-clean rounded-xl p-stack-md border border-border-subtle shadow-sm mb-stack-md grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <span className="font-label-caps text-[12px] text-on-surface-variant">문제</span>
        <span className="font-body-md text-[16px] text-on-surface">{body.problem}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-label-caps text-[12px] text-on-surface-variant">진단</span>
        <span className="font-body-md text-[16px] text-on-surface">{body.judgement}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-label-caps text-[12px] text-on-surface-variant">작업</span>
        <span className="font-body-md text-[16px] text-on-surface">{body.work}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-label-caps text-[12px] text-on-surface-variant">결과</span>
        <span className="font-body-md text-[16px] text-on-surface">{body.result}</span>
      </div>
    </div>
  );
}
