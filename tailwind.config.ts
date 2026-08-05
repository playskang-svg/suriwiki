import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // PRD 벤치마킹 기준(빛가람 레퍼런스)의 브랜드 그린을 기본값으로 둔다.
        // 실제 사이트별 색상은 12.4 회사정보 배포 관리에서 사이트 단위로 override 예정.
        brand: {
          DEFAULT: "#3f7a56",
          dark: "#173425",
        },
      },
    },
  },
  plugins: [],
};

export default config;
