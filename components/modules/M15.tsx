import { ModuleProps } from "@/lib/schemas/modules";

export default function M15({ body }: ModuleProps<"M15">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">안전한 자가 확인법</h2>
      <div className="bg-surface-clean border border-border-subtle rounded-xl p-stack-md shadow-sm">
        <ul className="flex flex-col gap-3">
          {body.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-trust-blue text-[24px] shrink-0" aria-hidden="true">check_circle</span>
              <span className="font-body-md text-[16px] text-on-surface mt-0.5">{item.text}</span>
            </li>
          ))}
        </ul>
        {body.safe && (
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">verified_user</span>
            <span className="font-status-label text-[14px]">비전문가가 직접 확인해도 안전한 항목들입니다.</span>
          </div>
        )}
      </div>
    </div>
  );
}
