import Link from "next/link";

/** PRD 4.3(링크 품질 규칙) — 모든 색인 페이지에 브레드크럼을 서버 렌더링한다. */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="breadcrumb" className="mx-auto max-w-6xl px-4 py-3 text-sm text-slate-500 font-medium">
      {items.map((item, i) => (
        <span key={item.label}>
          {item.href ? (
            <Link href={item.href} className="hover:text-emerald-700 transition">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-800 font-semibold">{item.label}</span>
          )}
          {i < items.length - 1 && <span className="mx-2 text-slate-300">›</span>}
        </span>
      ))}
    </nav>
  );
}
