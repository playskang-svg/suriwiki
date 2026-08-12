import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 신뢰감을 주는 네이비(brand) + 클릭을 유도하는 코랄레드(cta) 2색 체계.
        // 지역 시공업체 사이트 특성상 화려함보다 "전문성 + 즉시 연락"이 핵심이라
        // 색은 최소화하고 CTA에만 강한 대비를 준다.
        brand: {
          DEFAULT: '#16264D',
          dark: '#0F1B38',
        },
        cta: {
          DEFAULT: '#FF3B30',
          dark: '#C4281F',
        },
      },
    },
  },
  plugins: [],
}

export default config
