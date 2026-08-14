import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-900">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-slate-600">주소가 정확한지 확인해 주세요.</p>
      {/* 이 404.html은 모든 키워드 프로젝트에 그대로 복사되므로(scripts/split-by-keyword.mjs)
          "홈"은 항상 루트 프로젝트를 가리키는 절대 URL이어야 한다. */}
      <Link href={SITE_URL} className="mt-6 text-brand underline underline-offset-4">
        홈으로 돌아가기
      </Link>
    </div>
  )
}
