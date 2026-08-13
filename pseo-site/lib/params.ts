/**
 * lib/params.ts
 * ------------------------------------------------------------------------
 * Next.js가 정적 렌더링 시점에 동적 라우트 params를 퍼센트 인코딩된 상태로
 * 넘기는 경우가 있다(한글 세그먼트에서 실제로 확인됨 — "충청남도"가
 * "%EC%B6%A9%EC%B2%AD%EB%82%A8%EB%8F%84"로 들어옴). generateStaticParams가
 * 준 원본 값과 다르면 DB 조회가 전부 실패하므로, params를 쓰는 모든 곳에서
 * 이 헬퍼로 한 번 디코딩하고 시작한다.
 * ------------------------------------------------------------------------
 */
export function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value // 이미 디코딩된 값이 들어와도(%가 없으면) 에러 없이 그대로 통과
  }
}

export function decodeParamPath(path: string[]): string[] {
  return path.map(decodeParam)
}
