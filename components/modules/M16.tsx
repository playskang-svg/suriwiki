import { ModuleProps } from "@/lib/schemas/modules";

export default function M16({ body }: ModuleProps<"M16">) {
  return (
    <div className="mb-stack-md">
      <div className="bg-error-container p-stack-md rounded-xl border-l-4 border-error shadow-sm">
        <h2 className="font-headline-md text-[20px] text-on-error-container mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-error" aria-hidden="true">warning</span>
          전문가 확인 필수 조건
        </h2>
        <ul className="list-disc list-inside mb-4 font-body-md text-[16px] text-on-error-container flex flex-col gap-1">
          {body.stop_conditions.map((cond, idx) => (
            <li key={idx}>{cond}</li>
          ))}
        </ul>
        <div className="font-headline-md text-[16px] text-on-error-container bg-error/10 p-3 rounded-lg font-semibold">
          {body.message}
        </div>
      </div>
    </div>
  );
}
