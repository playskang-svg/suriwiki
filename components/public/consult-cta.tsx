import Link from "next/link";

/**
 * 지역×공정 페이지에서 상담문의 페이지로 넘어가는 CTA. PRD 11.1 11번 항목.
 * 반드시 실제 링크(<a>)로 렌더링하고, 모달/클라이언트 전용 렌더링으로 대체하지 않는다.
 */
export function ConsultCta({
  consultHref,
  label = "상담하기",
}: {
  consultHref: string;
  label?: string;
}) {
  return (
    <Link
      href={consultHref}
      className="inline-block rounded-full bg-emerald-700 hover:bg-emerald-800 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition"
    >
      {label}
    </Link>
  );
}
