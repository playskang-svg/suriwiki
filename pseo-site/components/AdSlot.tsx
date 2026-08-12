/**
 * components/AdSlot.tsx
 * ------------------------------------------------------------------------
 * 요구사항 5(절대 원칙): 광고 수익 슬롯. 위치별로 높이를 px 단위로 완전히
 * 고정(min/max 동일값 + overflow:hidden)해서, 본문이 얼마나 길어지든 광고
 * 크리에이티브가 늦게 뜨든 이 박스의 바깥 레이아웃은 절대 밀리지 않는다.
 * globals.css의 .ad-container(contain: layout paint size)가 한 번 더 방어한다.
 * ------------------------------------------------------------------------
 */
type AdPosition = 'top' | 'middle' | 'bottom'

// IAB 표준 배너 규격 기준 위치별 고정 높이(px).
const AD_HEIGHT: Record<AdPosition, number> = {
  top: 100, // 728x90 리더보드 + 여백
  middle: 300, // 300x250 정사각 배너 + 여백
  bottom: 100,
}

const AD_LABEL: Record<AdPosition, string> = {
  top: '상단 광고',
  middle: '중단 광고',
  bottom: '하단 광고',
}

export default function AdSlot({ position }: { position: AdPosition }) {
  const height = AD_HEIGHT[position]
  return (
    <div
      data-ad-slot={position}
      className="ad-container mx-auto flex w-full max-w-3xl items-center justify-center overflow-hidden border border-dashed border-slate-200 bg-slate-50"
      style={{ height, minHeight: height, maxHeight: height }}
    >
      {/*
        TODO: 여기에 애드센스(<ins class="adsbygoogle">)나 CPA 광고 스크립트를 삽입한다.
        높이가 위 style로 강제 고정되어 있으므로 크리에이티브 로드가 늦거나 실패해도
        주변 레이아웃은 흔들리지 않는다.
      */}
      <span className="select-none text-xs text-slate-300">
        {AD_LABEL[position]} 영역 ({height}px 고정)
      </span>
    </div>
  )
}
