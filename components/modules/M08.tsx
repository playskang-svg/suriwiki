import { ModuleProps } from "@/lib/schemas/modules";

export default function M08({ body }: ModuleProps<"M08">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">실제 작업 공정</h2>
      <div className="flex flex-col gap-6 relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-surface-variant z-0" />
        {body.steps.map((step, idx) => (
          <div key={idx} className="flex gap-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[14px] shrink-0 mt-1 shadow-sm">
              {step.n}
            </div>
            <div className="flex-1 bg-surface-clean border border-border-subtle p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-1">
                <span className="font-headline-md text-[18px] text-on-surface">{step.title}</span>
                <span className="font-body-md text-[16px] text-on-surface-variant">{step.desc}</span>
              </div>
              {step.image_variant_id && (
                <div className="w-full md:w-32 aspect-video md:aspect-square bg-surface-container rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center text-outline-variant font-label-caps text-[12px]">
                  IMG {step.image_variant_id}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
