import { ModuleProps } from "@/lib/schemas/modules";

export default function M17({ body }: ModuleProps<"M17">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">관리 및 예방</h2>
      <div className="bg-surface-clean border border-border-subtle rounded-xl p-stack-md shadow-sm">
        <ul className="flex flex-col gap-4">
          {body.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-point text-[24px] shrink-0" aria-hidden="true">lightbulb</span>
              <span className="font-body-md text-[16px] text-on-surface mt-0.5">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
