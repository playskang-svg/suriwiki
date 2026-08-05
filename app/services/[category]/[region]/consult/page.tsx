"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { getDistributedCompanyProfile, MAIN_CATEGORIES, REGIONS_DATA } from "@/lib/store";
import { CompanyProfile } from "@/lib/types";

function ConsultContent({ params }: { params: { category: string; region: string } }) {
  const searchParams = useSearchParams();
  const utmSource = searchParams.get("utm_source") || "direct_keyword_cta";

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [content, setContent] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
    const profile = getDistributedCompanyProfile(params.category, params.region);
    setCompany(profile);
  }, [params.category, params.region]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File Size Validation - Max 10MB
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      alert("⚠️ 파일 용량이 너무 큽니다! (최대 10MB 이하의 이미지 파일만 첨부 가능합니다)");
      e.target.value = "";
      return;
    }

    // Instant local preview
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Server upload pipeline
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const publicUrl = data.url || data.data?.url;
        if (publicUrl) setUploadedUrl(publicUrl);
      } else {
        alert(data.message || "이미지 업로드 용량 제한을 초과했습니다. 10MB 이하로 첨부해 주세요.");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      // Fallback: local reader preview remains available!
    } finally {
      setUploading(false);
    }
  };

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
          imageUrl: uploadedUrl || photoPreview || undefined,
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
    return <div className="min-h-screen bg-slate-900 text-white p-8">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <SiteHeader companyProfile={company} categorySlug={params.category} regionSlug={params.region} />

      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-10 space-y-8">
        {/* Keyword Header Banner */}
        <div className="text-center space-y-3 bg-gradient-to-br from-slate-800 to-blue-950/60 p-6 md:p-8 rounded-2xl border border-slate-700/80 shadow-xl">
          <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold">
            {region.name} × {category.name} 1:1 전용 상담 센터
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {region.name} <span className="text-blue-400">{category.name}</span> 빠른 상담 및 견적 신청
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            사진 2장 첨부 시 <strong className="text-white">{company.companyName}</strong>의 담당 마스터가 5분 내 무료 진단 및 견적을 전달드립니다.
          </p>
        </div>

        {/* Quick Phone & Direct Call CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={`tel:${company.phoneNumber.replace(/[^0-9]/g, "")}`}
            className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-center transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div className="text-left">
              <span className="text-[10px] block opacity-80 font-normal">긴급 출동 / 즉시 전화 연결</span>
              <span className="text-sm font-mono">{company.phoneNumber}</span>
            </div>
          </a>

          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl text-xs space-y-1 flex flex-col justify-center">
            <span className="font-semibold text-slate-300">운영 및 상담 시간</span>
            <span className="text-slate-400">{company.operatingHours}</span>
            <span className="text-blue-400 text-[11px] pt-1">주말 및 공휴일 긴급 상담 가능</span>
          </div>
        </div>

        {/* Preparation Guide Card */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-2">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>시공 팀장의 안내 사항</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            &quot;{company.prepInstructions || "현장 파손 부위와 주변이 함께 나오도록 사진을 찍어주시면 원인 파악과 자재 준비가 훨씬 빨라집니다."}&quot;
          </p>
        </div>

        {/* Consultation Form */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-slate-700/80 pb-3 flex items-center justify-between">
            <span>온라인 견적 상담 신청서</span>
            <span className="text-xs text-slate-400 font-normal">비공개 1:1 안전 접수</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  고객 성함 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="예: 홍길동"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  연락처 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                현장 상태 및 수리 요청 내용 <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="예: 안방 문틀 하단이 습기로 부식되어 필름이 일어났습니다. 방문 복원 비용과 가능한 날짜가 궁금합니다."
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* Photo Attachment Preview & Server Upload */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                현장 사진 첨부 (최대 10MB 용량 제한)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
              />
              {uploading && <p className="text-[11px] text-blue-400 mt-1 animate-pulse">📂 현장 사진 서버 업로드 처리 중...</p>}
              {photoPreview && (
                <div className="mt-3 relative w-36 h-36 rounded-xl border border-slate-700 overflow-hidden bg-slate-950 shadow-md">
                  <img src={photoPreview} alt="현장 사진 미리보기" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setUploadedUrl(null);
                    }}
                    className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center gap-2"
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
          <Link href={parentHref} className="text-xs text-slate-400 hover:text-slate-200 transition underline">
            ← {region.name} {category.name} 전용 시공 안내 페이지(홈)로 이동하기
          </Link>
        </div>
      </main>

      {/* Confirmation Modal */}
      {submittedLeadId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">상담 신청이 완료되었습니다!</h3>
              <p className="text-xs text-slate-300">
                접수번호: <code className="text-blue-400 font-mono font-bold">{submittedLeadId}</code>
              </p>
              <p className="text-xs text-slate-400 leading-relaxed pt-2">
                <strong className="text-white">{company.companyName}</strong>의 마스터 팀장이 내용 확인 후 
                <span className="text-blue-400 font-bold"> {customerPhone}</span> (으)로 5분 이내 전화를 드립니다.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-700 flex gap-3">
              <Link
                href={parentHref}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition"
              >
                확인
              </Link>
              <a
                href={`tel:${company.phoneNumber.replace(/[^0-9]/g, "")}`}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
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

export default function ConsultPage({ params }: { params: { category: string; region: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white p-8">로딩 중...</div>}>
      <ConsultContent params={params} />
    </Suspense>
  );
}
