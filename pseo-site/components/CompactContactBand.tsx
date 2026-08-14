/**
 * components/CompactContactBand.tsx
 * ------------------------------------------------------------------------
 * 본문 중간·하단에 들어가는 낮은 높이의 배너 — 첫 배너(ContactBanner, 목차 다음
 * 큰 썸네일)와 달리 지역명·전화번호 정도만 짧게 보여준다
 * (요청: "그 밑에 이미지들은 배너형태로 높이가 낮은 사이즈로 연락처와
 * 지역명정도만 넣은 이미지로").
 *
 * imageSrc를 prop으로 받는다 — 지금은 배경 이미지 로테이션(lib/bg-images.ts)을
 * 쓰지만, 나중에 실제 시공 사진이 생기면 그 값만 그 사진 경로로 바꾸면 된다
 * (요청: "나중에 관련 시공 사진으로 넣을 수도 있게").
 * ------------------------------------------------------------------------
 */
interface CompactContactBandProps {
  imageSrc: string | null
  phone: string
  regionLabel: string
  keyword: string
  label?: string
}

export default function CompactContactBand({ imageSrc, phone, regionLabel, keyword, label }: CompactContactBandProps) {
  const telHref = `tel:${phone.replace(/[^0-9]/g, '')}`
  return (
    <a
      href={telHref}
      className="group relative my-8 flex h-24 w-full items-center overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md md:h-28"
      aria-label={`${regionLabel} ${keyword} 무료 상담 전화 ${phone}${label ? ` (${label})` : ''}`}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- 정적 export, next/image 최적화 서버 없음
        <img
          src={imageSrc}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-brand" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />

      <div className="relative flex w-full items-center justify-between gap-3 px-5">
        <span className="text-base font-bold text-white md:text-lg">{regionLabel} {keyword}</span>
        <span className="flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-bold text-white shadow md:text-base">
          {phone} →
        </span>
      </div>
    </a>
  )
}
