import { ModuleProps } from "@/lib/schemas/modules";

export default function M11({ body }: ModuleProps<"M11">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">재료 정보</h2>
      <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-clean">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead className="bg-surface-container-low font-label-caps text-[12px] text-on-surface-variant">
            <tr>
              <th className="p-3 border-b border-border-subtle font-normal whitespace-nowrap">종류</th>
              <th className="p-3 border-b border-border-subtle font-normal">특징</th>
              <th className="p-3 border-b border-border-subtle font-normal">주요 용도</th>
              <th className="p-3 border-b border-border-subtle font-normal">한계점</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-[14px] text-on-surface divide-y divide-border-subtle">
            {body.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-surface-bright transition-colors">
                <td className="p-3 font-semibold text-primary whitespace-nowrap">{item.name}</td>
                <td className="p-3">{item.features}</td>
                <td className="p-3">{item.use}</td>
                <td className="p-3 text-on-surface-variant">{item.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
