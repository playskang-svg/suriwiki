import { ModuleProps } from "@/lib/schemas/modules";

export default function M06({ body }: ModuleProps<"M06">) {
  return (
    <div className="mb-stack-md border-l-4 border-primary bg-surface-container-low p-stack-md rounded-r-xl">
      <h2 className="font-headline-md text-[20px] text-on-surface mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" aria-hidden="true">psychology</span>
        전문가 진단
      </h2>
      <ul className="list-disc list-inside mb-4 font-body-md text-[16px] text-on-surface-variant flex flex-col gap-1">
        {body.observed.map((obs, idx) => (
          <li key={idx}>{obs}</li>
        ))}
      </ul>
      <div className="font-headline-md text-[18px] text-primary bg-primary-fixed/50 p-3 rounded-lg">
        결론: {body.conclusion}
      </div>
    </div>
  );
}
