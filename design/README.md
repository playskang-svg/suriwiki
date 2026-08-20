# design/

Google **Stitch** export 원본이 들어가는 폴더입니다.

## 현재 원본 위치

```
design/stitch_assets/
├── screen1_home.html + .png          홈 (모바일 앱형)
├── screen2_sink.html + .png          서비스 상세 (싱크대) → TOPIC 템플릿
├── screen4_cases.html + .png         시공사례 목록 (모바일)
├── screen5_main_door.html + .png     홈 (데스크톱 웹형) → LANDING 템플릿
└── screen6_cases_door.html + .png    시공사례 목록 (데스크톱)
```

## 사용 방법

1. **토큰 이식**: 각 HTML의 `<script id="tailwind-config">` 블록 값을 `tailwind.config.ts` 로 옮깁니다.
   → 추출 결과는 [`../docs/14-design-system.md`](../docs/14-design-system.md) §1 에 정리돼 있습니다.

2. **레이아웃 참조**: HTML 마크업을 그대로 복사하지 말고, 모듈 컴포넌트(`components/modules/M**.tsx`)로
   재구성합니다. 매핑표는 [`../docs/14-design-system.md`](../docs/14-design-system.md) §3.

3. **주의**
   - Stitch export는 `cdn.tailwindcss.com` 을 씁니다. 프로덕션에서는 빌드된 Tailwind를 사용하세요.
   - `10,000+`, `4.9`, `99%` 등은 **더미 데이터**입니다. 실제 근거 없이 렌더하지 마세요 (사실성 규칙 F3).
   - 브랜드가 "거북이홈마스터"와 "문수리 전문가" 두 가지로 섞여 있습니다.
     `config/site.ts` 한 곳에서 주입하도록 통일하세요.
   - 전화번호 `010-2288-1194` 는 원본에 있던 값입니다. 실제 값으로 교체하세요.

## 아이콘

Material Symbols Outlined (`FILL 0, wght 400, GRAD 0, opsz 24`).
Next.js에서는 `next/font` 대신 `<link>` 로 로드하거나 `material-symbols` 패키지를 사용합니다.
