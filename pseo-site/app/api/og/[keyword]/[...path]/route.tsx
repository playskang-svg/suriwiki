/**
 * app/api/og/[keyword]/[...path]/route.tsx
 * ------------------------------------------------------------------------
 * "{지역}+{키워드}" / "상담 문의 라벨" / "전화번호" 3단 구성을 배경 이미지 위에
 * 합성한 동적 썸네일. (동네 시공 현수막 스타일 — 지역은 포인트 컬러, 나머지는
 * 흰색, 전부 굵은 글자 + 검정 외곽선으로 어떤 배경 사진 위에서도 눈에 띄게 한다)
 *
 *  1) 메타 태그의 OG Image로 쓰인다 (app/[keyword]/[...path]/page.tsx의 generateMetadata)
 *  2) 본문 서론과 본론(H2) 사이 '연락처 배너'로도 그대로 재사용된다 (components/ContactBanner.tsx)
 *
 * 전화번호는 PageData.thumbnailPhone을 쓴다 — pseo_page_listings.thumbnail_phone에
 * 값을 넣으면 본문 상담번호(phone)와 별개로 썸네일에만 다른 번호를 박을 수 있다.
 *
 * [...path]인 이유: 페이지가 지역 계층을 전부 슬래시로 펼치는 구조라
 * (/도배장판/충청남도/천안시/백석동), 썸네일 경로도 그대로 맞춘다.
 * output:'export'는 쿼리스트링 방식 API를 지원하지 않아 generateStaticParams로
 * 모든 조합을 빌드 시점에 정적 이미지로 미리 구워낸다.
 * ------------------------------------------------------------------------
 */
import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { getPageData, getStaticParamsList } from '@/lib/supabase'
import { pickBgImageDataUrl } from '@/lib/bg-images'
import { getOgFont } from '@/lib/og-font'
import { stripOgExtension, withOgExtension } from '@/lib/og-url'
import { decodeParam, decodeParamPath } from '@/lib/params'
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/lib/constants'
import { shortenRegionNameForThumbnail } from '@/lib/region-short-name'

// 썸네일 문구/색상 상수 — 필요하면 이 두 값만 바꾸면 톤이 통째로 바뀐다.
const THUMBNAIL_LABEL = '무료 상담 문의' // 참고 이미지의 "24시간 상담 문의" 같은 자리. 사실 확인이 안 되는 "24시간" 등은 넣지 않았다 — 실제 운영시간에 맞게 바꿔서 쓰면 된다.
const ACCENT_COLOR = '#2EE6C5' // 지역명에 쓰는 포인트 컬러 (참고 이미지의 민트색)
const STROKE_COLOR = '#0A0F1E'

// public/bg_images, public/fonts를 fs로 직접 읽으므로 edge가 아닌 nodejs 런타임이 필요하다.
export const runtime = 'nodejs'
export const dynamic = 'force-static'

interface RouteContext {
  params: { keyword: string; path: string[] }
}

export async function generateStaticParams() {
  const list = await getStaticParamsList()
  // 마지막 세그먼트에 .webp를 심어서, 중첩 경로에서 "충청남도"가 파일이면서
  // 동시에 폴더여야 하는 충돌(EISDIR)을 피한다 — lib/og-url.ts 설명 참고.
  return list.map(({ keyword, path }) => ({ keyword, path: withOgExtension(path) }))
}

// next/og(Satori)는 CSS -webkit-text-stroke를 지원하지 않는다(실제로 빌드해서 확인함 —
// 아무 외곽선도 안 그려짐). 그래서 같은 글자를 8방향으로 살짝 오프셋한 "외곽선색" 레이어를
// 깔고, 그 위에 진짜 색상 글자를 한 번 더 올리는 방식으로 스트로크 효과를 흉내낸다.
const STROKE_OFFSETS: [number, number][] = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
]

function StrokedText({
  text,
  color,
  fontSize,
  strokeWidth,
}: {
  text: string
  color: string
  fontSize: number
  strokeWidth: number
}) {
  return (
    <div style={{ position: 'relative', display: 'flex' }}>
      {/* 보이지 않는 원본 — flex 흐름에 남아 이 박스의 실제 크기를 잡아준다 */}
      <div style={{ display: 'flex', fontSize, color, opacity: 0 }}>{text}</div>
      {STROKE_OFFSETS.map(([dx, dy]) => (
        <div
          key={`${dx}-${dy}`}
          style={{
            position: 'absolute',
            top: dy * strokeWidth,
            left: dx * strokeWidth,
            display: 'flex',
            fontSize,
            color: STROKE_COLOR,
          }}
        >
          {text}
        </div>
      ))}
      <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex', fontSize, color }}>{text}</div>
    </div>
  )
}

export async function GET(_request: Request, { params }: RouteContext) {
  const data = await getPageData(decodeParam(params.keyword), stripOgExtension(decodeParamPath(params.path)))
  if (!data) {
    return new Response('Not Found', { status: 404 })
  }

  const seed = `${data.keyword.slug}:${data.path.join('/')}`
  const bgDataUrl = pickBgImageDataUrl(seed)
  const fontData = await getOgFont()

  // 썸네일에는 참고 이미지("서울" + "벽지"처럼)와 동일하게 전체 주소 체인이 아니라
  // "현재 지역명"만 쓴다 — regionLabel(충청남도 천안시 불당동 불당아이파크 같은 풀 체인)은
  // <title>/H1 등 SEO 텍스트용이고, 이미지에 그대로 쓰면 글자가 작아져서 안 어울린다.
  // 시/도 중에서도 "서울특별시"/"세종특별자치시"처럼 유난히 긴 정식 명칭은 썸네일 안에서
  // 줄바꿈되며 아래 문구와 겹쳐 보이므로, 썸네일에서만 축약형을 쓴다(다른 곳은 정식 명칭 그대로).
  const thumbnailRegionName = shortenRegionNameForThumbnail(data.region.name)
  const titleLength = thumbnailRegionName.length + data.keyword.display_name.length
  // 그래도 지역명이나 키워드가 유난히 길 때를 대비해 단계적으로 줄인다.
  const titleFontSize = titleLength > 16 ? 76 : titleLength > 10 ? 92 : 108

  const png = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#16264D',
          fontFamily: fontData ? 'OgFont' : undefined,
        }}
      >
        {bgDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Satori 렌더용 소스 이미지, 실제 DOM에 그려지는 <img>가 아니라 alt가 필요 없다
          <img
            src={bgDataUrl}
            alt=""
            width={OG_IMAGE_WIDTH}
            height={OG_IMAGE_HEIGHT}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}

        {/* 텍스트 가독성을 위한 그라디언트 스크림 (아래로 갈수록 짙어짐) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: 'linear-gradient(180deg, rgba(10,15,30,0.15) 0%, rgba(10,15,30,0.65) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '40px',
          }}
        >
          {/* 1줄: 지역명(포인트 컬러) + 키워드(흰색) — 굵은 글자 + 검정 외곽선(stroke) (요구사항 3-2)
              지역명이 길면(예: "전남광주통합특별시") 자동으로 줄바꿈될 수 있다 — 그래서
              캔버스 자체를 세로로 넉넉하게 키우고(OG_IMAGE_HEIGHT), 아래 라벨과의 간격도
              넓게 잡아 2줄이 되어도 겹치지 않게 한다. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', marginRight: 24 }}>
              <StrokedText text={thumbnailRegionName} color={ACCENT_COLOR} fontSize={titleFontSize} strokeWidth={6} />
            </div>
            <StrokedText text={data.keyword.display_name} color="#FFFFFF" fontSize={titleFontSize} strokeWidth={6} />
          </div>

          {/* 2줄: 상담 문의 라벨 */}
          <div style={{ display: 'flex', marginTop: 64 }}>
            <StrokedText text={THUMBNAIL_LABEL} color="#FFFFFF" fontSize={44} strokeWidth={3} />
          </div>

          {/* 3줄: 전화번호 — 썸네일 전용 입력값(thumbnailPhone)을 쓴다. 배지 없이 큼직한 외곽선 글자로만 강조 */}
          <div style={{ display: 'flex', marginTop: 28 }}>
            <StrokedText text={data.thumbnailPhone} color="#FFFFFF" fontSize={104} strokeWidth={7} />
          </div>
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      fonts: fontData ? [{ name: 'OgFont', data: fontData, weight: 400, style: 'normal' }] : undefined,
    }
  )

  // next/og(ImageResponse)는 PNG만 만들 수 있어서, sharp로 한 번 더 WebP로 변환한다.
  const pngBuffer = Buffer.from(await png.arrayBuffer())
  const webpBuffer = await sharp(pngBuffer).webp({ quality: 92 }).toBuffer()

  // Response의 BodyInit 타입에 Node Buffer가 바로 안 맞아 Uint8Array로 감싼다.
  return new Response(new Uint8Array(webpBuffer), {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
