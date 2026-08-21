/**
 * OG 이미지 — 브랜드명·태그라인에서 즉석 생성한다 (docs/17-swappable-config.md §8-2).
 *
 * 파일로 그려두면 사이트를 복제할 때마다 새로 만들어야 한다. 설정에서 렌더하면 교체할 파일이 0개다.
 * 사진을 쓰지 않는 이유도 있다 — OG 이미지에 시공 사진을 넣으면 그 사진이 어느 CASE 것인지
 * 추적되지 않은 채 모든 공유 링크에 붙는다 (F1·D5 가 막으려는 상황).
 */
import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';

export const alt = `${siteConfig.brand.name} - ${siteConfig.brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          backgroundColor: '#00236f',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 72,
            height: 72,
            borderRadius: 16,
            border: '5px solid #ffffff',
            marginBottom: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: '#fea619' }} />
        </div>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>
          {siteConfig.brand.name}
        </div>
        <div style={{ fontSize: 36, marginTop: 20, color: '#b6c4ff', lineHeight: 1.4 }}>
          {siteConfig.brand.tagline}
        </div>
      </div>
    ),
    size
  );
}
