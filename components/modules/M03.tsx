import { ModuleProps } from "@/lib/schemas/modules";

export default function M03({ body }: ModuleProps<"M03">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">문제 증상</h2>
      <ul className="flex flex-col gap-3">
        {body.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-[20px] mt-0.5" aria-hidden="true">error</span>
            <div className="flex flex-col">
              <span className="font-body-md text-[16px] text-on-surface">{item.text}</span>
              {item.detail && <span className="font-status-label text-[14px] text-on-surface-variant">{item.detail}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
