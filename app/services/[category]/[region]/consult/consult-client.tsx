"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { MAIN_CATEGORIES, REGIONS_DATA } from "@/lib/store";
import { CompanyProfile } from "@/lib/types";

// PRD 11.2 상담문의 페이지: 세부 키워드 페이지 1개당 1개씩 자동 생성되는 전용 전환 페이지.
// 노출되는 연락처는 반드시 관리자(12.4 회사정보·연락처 배포 관리)에서 등록·배포한 값이어야 하며,
// 클라이언트 번들에서 lib/store.ts를 직접 호출하면 파일시스템 DB를 읽지 못해 항상 기본 시드값만
// 보이는 문제가 있었기 때문에 /api/company-profile을 통해서만 값을 가져온다.
function ConsultContent({ params }: { params: { category: string; region: string } }) {
  const searchParams = useSearchParams();
  const utmSource = searchParams.get("utm_source") || "direct_keyword_cta";

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);

  const category = MAIN_CATEGORIES.find((c) => c.slug === params.category) || {
    name: "문수리",
    slug: params.category,
  };
  const region = REGIONS_DATA.find((r) => r.slug === params.region) || {
    name: params.region === "gangnam" ? "강남구" : params.region === "gunpo" ? "군포시" : params.region,
    slug: params.region,
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/company-profile?category=${params.category}&region=${params.region}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setCompany(data.data);
      })
      .catch((err) => console.error("Failed to load company profile:", err));
    return () => {
      cancelled = true;
    };
  }, [params.category, params.region]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !content) {
      alert("이름, 연락처, 상담 내용은 필수 입력 항목입니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug: params.category,
          regionSlug: params.region,
          customerName,
          customerPhone,
          content,
          utmSource,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmittedLeadId(data.data.id);
      } else {
        alert(data.message || "상담 접수에 실패했습니다.");
      }
    } catch (err) {
      alert("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const parentHref = `/services/${params.category}/${params.region}`;

  if (!company) {
    return <div className="min-h-screen bg-white text-slate-900 p-8">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <SiteHeader companyProfile={company} categorySlug={params.category} regionSlug={params.region} />

      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-10 space-y-8">
        {/* Keyword Header Banner */}
        <div className="text-center space-y-3 bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/30 p-6 md:p-8 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="inline-block px-3 py-1 bg-emerald-100/90 text-emerald-900 border border-emerald-300 rounded-full text-xs font-bold shadow-xs">
            {region.name} × {category.name} 1:1 전용 상담 센터
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            {region.name} <span className="text-emerald-700">{category.name}</span> 빠른 상담 및 견적 신청
          </h1>
          <p className="text-xs md:text-sm text-slate-600">
            지역과 현장 상황을 남겨주시면 <strong className="text-slate-900 font-extrabold">{company.companyName}</strong>의 담당 마스터가 5분 내 연락드립니다.
          </p>
        </div>

        {/* Quick Phone & Direct Call CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={`tel:${company.phoneNumber.replace(/[^0-9]/g, "")}`}
            className="p-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-center transition shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div className="text-left">
              <span className="text-[10px] block opacity-90 font-normal">긴급 출동 / 즉시 전화 연결</span>
              <span className="text-sm font-mono">{company.phoneNumber}</span>
            </div>
          </a>

          <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs space-y-1 flex flex-col justify-center shadow-xs">
            <span className="font-bold text-slate-800">운영 및 상담 시간</span>
            <span className="text-slate-600">{company.operatingHours}</span>
          </div>
        </div>

        {/* Preparation Guide Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-xs">
          <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>시공 팀장의 안내 사항</span>
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed font-mono">
            &quot;{company.prepInstructions || "현장 상황과 지역, 연락 가능한 시간을 남겨주시면 빠르게 안내해 드립니다."}&quot;
          </p>
        </div>

        {/* Consultation Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>온라인 견적 상담 신청서</span>
            <span className="text-xs text-slate-500 font-normal">비공개 1:1 안전 접수</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  고객 성함 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="예: 홍길동"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                현장 상태 및 수리 요청 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="예: 안방 문틀 하단이 습기로 부식되어 필름이 일어났습니다. 방문 복원 비용과 가능한 날짜가 궁금합니다."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>접수 처리 중...</span>
              ) : (
                <>
                  <span>{region.name} {category.name} 무료 상담 신청하기</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center pt-2">
          <Link href={parentHref} className="text-xs text-slate-500 hover:text-slate-900 transition underline">
            ← {region.name} {category.name} 전용 시공 안내 페이지(홈)로 이동하기
          </Link>
        </div>
      </main>

      {/* Confirmation Modal */}
      {submittedLeadId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">상담 신청이 완료되었습니다!</h3>
              <p className="text-xs text-slate-600">
                접수번호: <code className="text-emerald-800 font-mono font-bold">{submittedLeadId}</code>
              </p>
              <p className="text-xs text-slate-600 leading-relaxed pt-2">
                <strong className="text-slate-900 font-bold">{company.companyName}</strong>의 마스터 팀장이 내용 확인 후
                <span className="text-emerald-700 font-bold"> {customerPhone}</span> (으)로 5분 이내 전화를 드립니다.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <Link
                href={parentHref}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
              >
                확인
              </Link>
              <a
                href={`tel:${company.phoneNumber.replace(/[^0-9]/g, "")}`}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition shadow-xs"
              >
                지금 즉시 전화하기
              </a>
            </div>
          </div>
        </div>
      )}

      <SiteFooter company={company} />
    </div>
  );
}

export function ConsultPageClient({ params }: { params: { category: string; region: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white p-8">로딩 중...</div>}>
      <ConsultContent params={params} />
    </Suspense>
  );
}
