"use client";

import { useState } from "react";
import PageRenderer from "@/app/_render/PageRenderer";

const TEST_PAGE_MODULES = {
  M01: { answer: "하부 힌지만 손상됐다면 용접 보강으로 복원되는 경우가 많습니다.", qualifier: "다만 문틀 자체가 변형됐다면 교체 검토가 필요합니다." },
  M02: { problem: "문이 바닥에 끌려 닫히지 않음", judgement: "하부 피벗힌지 축 부식·탈락, 문짝·문틀은 정상", work: "힌지 절단 → 보강 철판 → 재용접 → 수평 조정", result: "개폐 정상, 끌림 해소" },
  M03: { items: [{ text: "문이 바닥에 끌린다", detail: "하부 3cm 구간 긁힘" }, { text: "완전히 닫히지 않는다" }] },
  M04: { steps: [{ n: 1, text: "빗물·청소수가 하부에 반복 유입" }, { n: 2, text: "피벗힌지 축 부식 진행" }, { n: 3, text: "축 지지력 상실 → 문짝 처짐" }], observed: true },
  M05: { grades: [{ level: "경미", desc: "약간의 끌림, 힌지 유격 있음", action: "조정으로 해결" }, { level: "부분손상", desc: "힌지 축 부식, 문짝은 정상", action: "힌지 보강·교체" }, { level: "심함", desc: "문틀 변형 동반", action: "교체 검토" }], case_grade: "부분손상" },
  M06: { observed: ["하부 피벗힌지 축이 부식되어 탈락", "문짝 뒤틀림 없음", "문틀 직각 유지"], conclusion: "힌지만 보강하면 복원 가능하다고 판단" },
  M07: { repair_when: ["힌지·부속만 손상", "문틀 직각 유지", "문짝 변형 없음"], replace_when: ["문틀 변형·부식이 넓음", "화재 성능 훼손", "반복 수리 이력"] },
  M08: { steps: [{ n: 1, title: "기존 힌지 절단", desc: "부식된 축 제거", image_variant_id: "iv_1" }, { n: 2, title: "보강 철판 부착", desc: "..." }] },
  M09: { items: [{ icon: "build", title: "힌지 보강 용접", desc: "..." }] },
  M10: { prepare: ["실리콘건", "커터", "마스킹테이프"], steps: [{ n: 1, title: "기존 실리콘 제거", desc: "..." }], stop_if: ["곰팡이가 벽 내부까지 번진 경우", "누수가 계속되는 경우"] },
  M11: { kind: "material", items: [{ name: "ABS", features: "내수성 강함", use: "욕실 문틀", limit: "충격에 깨질 수 있음" }] },
  M12: { kind: "tool", items: [{ name: "임팩드릴", features: "강한 회전력", use: "나사 체결", limit: "..." }] },
  M13: { axes: ["내수성", "비용", "시공성", "수명"], items: [{ name: "ABS", values: ["강함", "중", "쉬움", "김"] }, { name: "MDF", values: ["약함", "저", "쉬움", "짧음"] }], recommendation: "습기 있는 공간은 ABS, 건식 공간은 MDF도 가능" },
  M14: { factors: [{ name: "손상 범위", effect: "부위가 넓을수록 자재·시간 증가" }, { name: "접근성", effect: "고정 구조물이 있으면 철거 공정 추가" }, { name: "자재 종류", effect: "동일 규격 부속 수급 여부에 따라 달라짐" }, { name: "양생 시간", effect: "접착·용접 후 대기 시간 필요" }], disclaimer: "실제 비용은 현장 확인 후 안내드립니다.", amounts: "15만원~" },
  M15: { items: [{ text: "문을 반쯤 열었을 때 저절로 움직이는가" }, { text: "하부에 긁힌 자국이 있는가" }], safe: true },
  M16: { level: "warning", stop_conditions: ["전기 배선이 노출된 경우", "구조체 균열이 보이는 경우", "2m 이상 고소 작업"], message: "위 상황에서는 작업을 멈추고 전문가에게 문의하세요." },
  M17: { items: [{ text: "청소 후 하부 물기를 닦아냅니다" }, { text: "6개월마다 힌지 유격을 확인합니다" }] },
  M18: { improved: ["개폐 정상", "바닥 끌림 해소", "소음 감소"], limits: ["용접부 도장 색상이 미세하게 다름"] },
  M19: { case_id: "case_1", area_label: "김해 아파트", one_line: "하부 피벗힌지 절단 후 재용접으로 수평 복원", url: "/case/gimhae-firedoor-sag-01", thumb_variant_id: "iv_2" },
  M20: { focus: "judgement", items: [{ image_variant_id: "iv_3", role: "BEFORE", caption: "하부 3cm 끌림 자국" }, { image_variant_id: "iv_4", role: "DETAIL", caption: "피벗힌지 축 부식" }], compare: { before: "iv_5", after: "iv_6" } },
  M21: { items: [{ q: "용접 수리하면 얼마나 가나요?", a: "이 사례에서는 반영구적으로 사용 가능합니다." }] },
  M22: { items: [{ url: "/wiki/pivot-hinge", title: "피벗힌지란", relation: "material" }] },
  M23: { area_slug: "gimhae", area_label: "김해", case_count: 3, cases: [{ url: "/case/1", title: "사례 1", thumb: "iv_7" }], coverage_note: "김해·양산·부산 북구 방문 가능" },
  M24: { headline: "지금 상태를 사진으로 보내주시면 가능 여부를 먼저 알려드립니다", primary: { type: "photo_upload", label: "사진으로 상담하기" }, secondary: [{ type: "tel" }], rotation_key: "entrance-judge-c" }
};

const MODULE_ORDER = Object.keys(TEST_PAGE_MODULES);

export default function DevModulesPage() {
  const [isMobile, setIsMobile] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 h-16 bg-surface-container border-b border-border-subtle flex items-center justify-between px-4 z-50">
        <h1 className="font-headline-md text-on-surface">모듈 렌더링 테스트</h1>
        <button 
          onClick={() => setIsMobile(!isMobile)}
          className="bg-primary text-on-primary px-4 py-2 rounded-md font-label-caps"
        >
          {isMobile ? "데스크톱 뷰로 전환" : "모바일 뷰로 전환"}
        </button>
      </div>
      
      <div className="pt-24 pb-20 flex justify-center w-full">
        <div 
          className="bg-surface transition-all duration-300"
          style={{ width: isMobile ? "375px" : "1280px" }}
        >
          <div className="p-stack-md border border-border-subtle rounded-xl min-h-[500px]">
            <PageRenderer 
              title="모듈 개발 테스트 페이지"
              moduleOrder={MODULE_ORDER} 
              pageModules={TEST_PAGE_MODULES} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
