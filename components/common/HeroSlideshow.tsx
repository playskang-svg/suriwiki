import Image from "next/image";

export type HeroSlide = { url: string; alt: string };

/**
 * 히어로 배경 슬라이드쇼.
 *
 * 실제 시공 사진만 쓴다. 스톡 이미지나 자리표시자를 배경으로 깔지 않는다 (docs/17 §8).
 * 전환은 CSS 애니메이션으로만 한다 — 배경 장식에 자바스크립트를 붙일 이유가 없고,
 * 서버 컴포넌트로 두면 클라이언트 번들도 늘지 않는다.
 *
 * 첫 장은 priority 로 즉시 불러 LCP 를 잡고, 나머지는 지연 로드한다.
 *
 * 사진에는 이미 캡션·화살표가 얹혀 있다. 배경으로 깔면 그 글자가 헤드라인과 겹쳐 읽히므로
 * 살짝 블러를 준다(가장자리 흰 테두리를 막으려고 scale-110 을 함께 쓴다).
 * 사진의 내용은 사례 페이지에서 선명하게 보여준다.
 */
export default function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  if (!slides.length) return null;

  const total = slides.length;
  // 한 장이 머무는 시간(초). 총 주기는 total * HOLD.
  const HOLD = 5;
  const cycle = total * HOLD;

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {slides.map((s, i) => (
        <div
          key={s.url}
          className="hero-slide absolute inset-0"
          style={{
            animationDuration: `${cycle}s`,
            animationDelay: `${-i * HOLD}s`,
          }}
        >
          <Image
            src={s.url}
            alt=""
            fill
            sizes="100vw"
            priority={i === 0}
            className="object-cover scale-110 blur-[3px]"
          />
        </div>
      ))}
    </div>
  );
}
