/**
 * 관리자 전용 이용방법 가이드. PRD 12.6 참고.
 * 로그인한 관리자만 접근 가능하며, 선명한 고대비 텍스트 스타일링 적용.
 */

const ROLE_GUIDES = [
  {
    role: "최고 관리자 (Super Admin)",
    steps: [
      "22개 메인사이트 전체, 분양 팀장 계정 및 공정/지역 키워드 매트릭스를 관리합니다 (PRD 2.1).",
      "회사정보·연락처 배포(12.4)에서 사이트 간 연락처 지정 우선순위(페이지 &gt; 사이트 &gt; 기본 HQ)를 총괄 관리합니다.",
      "품질 게이트(5.3)를 통과하지 못한 키워드 페이지의 일괄 발행 및 예외 승인을 검토합니다.",
    ],
  },
  {
    role: "운영 관리자 (Operator)",
    steps: [
      "키워드·페이지 운영(12.2)에서 콤보박스로 세부 키워드를 선택하고 제목 및 맞춤 바디글(본문)을 수정·저장합니다.",
      "964개 세부 키워드 페이지의 발행 상태(published, draft, seo_check 등)를 일괄/개별로 변경합니다.",
      "1:1 상담 수신함에서 방문자가 신청한 파손 사진 및 견적 문의 내역을 확인하고 진행 상태(new &rarr; contacted &rarr; completed)를 변경합니다.",
    ],
  },
  {
    role: "현장 전문가·분양 팀장 (Team Master)",
    steps: [
      "자기 팀이 담당하는 분양 사이트 카테고리의 대표 연락처, 상호명, 영업시간 및 상담 준비사항 안내문을 등록합니다.",
      "현장 시공 전·후 비교 사진(BEFORE/AFTER)을 카테고리별로 업로드하여 랜딩페이지 품질을 강화합니다.",
    ],
  },
] as const;

const GLOSSARY = [
  { term: "메인사이트 (Main Site)", desc: "문수리, 마루복원, 필름시공 등 22개 공정 카테고리 단위의 독립 도메인 시스템." },
  { term: "세부사이트 (Keyword Page)", desc: "메인사이트 하위의 지역×공정 랜딩페이지 (예: /services/moon-suri/gangnam). 실제 검색엔진 SEO 색인 대상." },
  { term: "상담문의 페이지 (Consult Page)", desc: "세부 키워드 페이지 1개당 반드시 1:1로 결합 생성되는 전용 견적 신청 페이지 (.../consult/)." },
  { term: "회사 프로필 (Company Profile)", desc: "상호, 대표자명(기본: 홍길동), 사업자등록번호, 대표번호, 영업시간 등을 등록한 중앙 소스." },
  { term: "배포 대상 지정 (Contact Distribution)", desc: "등록된 회사 프로필을 어느 메인사이트 또는 개별 키워드 페이지에 노출할지 지정하는 타겟팅 매핑." },
] as const;

export default function AdminGuidePage() {
  return (
    <div className="max-w-4xl space-y-8 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">수리위키 관리자 이용방법 가이드 (PRD 12.6)</h1>
        <p className="mt-1 text-sm text-slate-400">
          본 가이드는 최고 관리자 및 운영 관리자의 이해를 돕기 위한 전용 안내문입니다. (검색엔진 미노출 noindex 적용)
        </p>
      </div>

      {/* 1. Role Guides */}
      <section className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4 shadow-lg">
        <h2 className="text-lg font-bold text-blue-400 border-b border-slate-700 pb-3 flex items-center gap-2">
          <span>👥 역할별 사용 지침</span>
        </h2>
        <div className="space-y-6 pt-2">
          {ROLE_GUIDES.map((g) => (
            <div key={g.role} className="space-y-2">
              <h3 className="font-bold text-sm text-white bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/60 inline-block">
                {g.role}
              </h3>
              <ol className="list-decimal space-y-1.5 pl-6 text-xs text-slate-300 leading-relaxed">
                {g.steps.map((step, idx) => (
                  <li key={idx} dangerouslySetInnerHTML={{ __html: step }} />
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Glossary */}
      <section className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4 shadow-lg">
        <h2 className="text-lg font-bold text-blue-400 border-b border-slate-700 pb-3 flex items-center gap-2">
          <span>📖 핵심 용어집 (Glossary)</span>
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          {GLOSSARY.map((item) => (
            <div key={item.term} className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/60 space-y-1">
              <dt className="font-bold text-white text-sm">{item.term}</dt>
              <dd className="text-slate-400 leading-relaxed">{item.desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 3. Operational Troubleshooting */}
      <section className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4 shadow-lg">
        <h2 className="text-lg font-bold text-blue-400 border-b border-slate-700 pb-3 flex items-center gap-2">
          <span>⚙️ 주요 운영 가이드 및 트러블슈팅</span>
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-xs text-slate-300 leading-relaxed pt-2">
          <li>
            <strong className="text-white">바디글(본문) 수정 방법:</strong> [키워드·페이지 운영] 메뉴로 이동 후 상단 콤보박스에서 편집하고 싶은 키워드를 선택하고 제목과 본문을 작성한 뒤 저장 버튼을 누르면 실시간 반영됩니다.
          </li>
          <li>
            <strong className="text-white">회사정보 배포 우선순위:</strong> 세부 키워드 페이지 지정(Page Override) &gt; 메인사이트 전체 지정(Site Default) &gt; 수리위키 마스터 본사 프로필 (대표자: 홍길동).
          </li>
          <li>
            <strong className="text-white">1:1 상담 수신 확인:</strong> 고객이 세부 키워드 상담 페이지에서 접수한 사진 및 연락처는 관리자 대시보드([대시보드 KPI]) 실시간 수신함에서 확인할 수 있습니다.
          </li>
        </ul>
      </section>
    </div>
  );
}
