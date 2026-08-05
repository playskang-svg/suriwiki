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
      className="inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
    >
      {label}
    </Link>
  );
}
