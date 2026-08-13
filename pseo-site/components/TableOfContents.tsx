/**
 * components/TableOfContents.tsx
 * ------------------------------------------------------------------------
 * 본론(H2/H3) 소제목에서 자동으로 뽑아낸 목차. 새 DB 필드 없이 이미 있는
 * pseo_content_sections.heading_template에서 그대로 생성하므로, 본문과
 * 목차가 어긋날 일이 없다 (요청: "썸네일 바로 앞에는 목차도 나와야돼").
 * ------------------------------------------------------------------------
 */
export interface TocItem {
  id: string
  text: string
  level: 'h2' | 'h3'
}

export default function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null

  let counter = 0
  const numbered = items.map((item) => ({ ...item, number: item.level === 'h2' ? ++counter : null }))

  return (
    <nav aria-label="목차" className="my-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-base font-bold text-slate-900">목차</p>
      <ol className="mt-3 space-y-2 text-base">
        {numbered.map((item) => (
          <li key={item.id} className={item.level === 'h3' ? 'ml-5 text-slate-500' : 'text-slate-700'}>
            <a href={`#${item.id}`} className="hover:text-brand hover:underline underline-offset-2">
              {item.number ? `${item.number}. ` : '– '}
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
