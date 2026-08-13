/**
 * components/HeroBanner.tsx
 * ------------------------------------------------------------------------
 * 배경 이미지 위에 큰 글씨로 페이지 제목을 보여주는 대표 이미지 배너.
 * 예전엔 app/layout.tsx(모든 페이지 공통)에 있어서 어느 페이지에 들어가든
 * 항상 사이트 브랜드명("도배장판")만 나왔다 — 키워드 허브 페이지에 들어가도
 * 바로 아래 실제 제목("도배업체 지역별 시공 정보")과 안 맞아 어색했다
 * (요청: "페이지 타이틀 부분 제목과 일치하게 변경").
 *
 * 그래서 layout에서 빼고, 각 페이지가 자기 제목을 직접 넘겨서 쓰게 했다.
 * title을 그대로 <h1>으로 렌더링하므로, 이 컴포넌트를 쓰는 페이지는 별도로
 * 또 <h1>을 만들면 안 된다(중복 헤딩 방지).
 * ------------------------------------------------------------------------
 */
export default function HeroBanner({ title }: { title: string }) {
  return (
    <div className="relative h-32 w-full overflow-hidden bg-brand md:h-40">
      {/* eslint-disable-next-line @next/next/no-img-element -- 정적 export, next/image 최적화 서버 없음 */}
      <img src="/bg_images/1.jpg" alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center bg-brand/50 px-4">
        <h1 className="text-center text-2xl font-extrabold tracking-tight text-white md:text-3xl">{title}</h1>
      </div>
    </div>
  )
}
