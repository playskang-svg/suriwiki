import { ModuleProps } from "@/lib/schemas/modules";

export default function M13({ body }: ModuleProps<"M13">) {
  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">비교 및 선택 기준</h2>
      <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-clean mb-4">
        <table className="w-full text-center border-collapse min-w-[500px]">
          <thead className="bg-surface-container-low font-label-caps text-[12px] text-on-surface-variant">
            <tr>
              <th className="p-3 border-b border-border-subtle font-normal text-left">구분</th>
              {body.items.map((item, idx) => (
                <th key={idx} className="p-3 border-b border-border-subtle font-semibold text-on-surface text-center">
                  {item.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-body-md text-[14px] text-on-surface divide-y divide-border-subtle">
            {body.axes.map((axis, axisIdx) => (
              <tr key={axisIdx} className="hover:bg-surface-bright transition-colors">
                <td className="p-3 font-semibold text-primary text-left bg-surface-container-lowest/50">{axis}</td>
                {body.items.map((item, itemIdx) => (
                  <td key={itemIdx} className="p-3 border-l border-border-subtle/50">
                    {item.values[axisIdx]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-primary-fixed/30 p-4 rounded-xl border border-primary-fixed flex items-start gap-3">
        <span className="material-symbols-outlined text-primary mt-0.5" aria-hidden="true">lightbulb</span>
        <div className="flex flex-col">
          <span className="font-label-caps text-[12px] text-primary mb-1">추천 기준</span>
          <span className="font-body-md text-[16px] text-on-surface">{body.recommendation}</span>
        </div>
      </div>
    </div>
  );
}
