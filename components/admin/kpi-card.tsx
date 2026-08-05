/** PRD 12.1 운영 KPI 카드. 대시보드페이지_1~3.png 레퍼런스의 카드형 지표를 그대로 옮긴다. */
export function KpiCard({
  label,
  value,
  delta,
  emphasize = false,
}: {
  label: string;
  value: number | string;
  delta?: number;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        emphasize ? "border-brand bg-brand/5" : "border-black/10 bg-white"
      }`}
    >
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm text-black/60">{label}</p>
      {typeof delta === "number" && (
        <p className="mt-2 text-xs font-semibold text-blue-600">
          ▲ +{delta} 전주 대비
        </p>
      )}
    </div>
  );
}
