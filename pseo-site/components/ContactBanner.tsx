/**
 * components/ContactBanner.tsx
 * ------------------------------------------------------------------------
 * 요구사항 3-3: 서론과 본론(첫 H2) 사이에 들어가는 클릭 유도 연락처 배너.
 * app/api/og/[keyword]/[slug]/route.tsx가 만든 동적 썸네일을 그대로 이미지로 쓴다
 * (OG 메타태그용 이미지와 본문 배너 이미지가 완전히 동일한 URL 하나를 공유).
 * ------------------------------------------------------------------------
 */
interface ContactBannerProps {
  imageSrc: string
  phone: string
  regionLabel: string
  keyword: string
  /** 같은 배너를 본문 중간·하단에도 반복 배치할 때 스크린리더용 라벨이 겹치지 않게 구분 */
  label?: string
}

export default function ContactBanner({ imageSrc, phone, regionLabel, keyword, label }: ContactBannerProps) {
  const telHref = `tel:${phone.replace(/[^0-9]/g, '')}`
  return (
    <a
      href={telHref}
      className="group relative my-8 block aspect-[1200/960] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
      aria-label={`${regionLabel} ${keyword} 무료 상담 전화 ${phone}${label ? ` (${label})` : ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 정적 export라 next/image 최적화 서버가 없어 원본 img를 그대로 쓴다 */}
      <img
        src={imageSrc}
        alt={`${regionLabel} ${keyword} 상담 배너 - ${phone}`}
        loading="lazy"
        width={1200}
        height={960}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <span className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/60 via-black/10 to-transparent px-4 pb-5 pt-10">
        <span className="rounded-full bg-cta px-6 py-3 text-base font-bold text-white shadow-lg md:text-lg">
          지금 클릭하고 무료 상담받기 →
        </span>
      </span>
    </a>
  )
}
