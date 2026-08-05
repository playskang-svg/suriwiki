"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { MAIN_CATEGORIES, REGIONS_DATA, getDistributedCompanyProfile, getSiteImages } from "@/lib/store";

// Popular Before/After Showcase Items with Direct Links
const POPULAR_SHOWCASE_ITEMS = [
  {
    id: "case_01",
    categorySlug: "moontle-gyoche",
    regionSlug: "gangnam",
    title: "강남구 아파트 문틀 습기 부식 & 0.1mm 정밀 교체",
    categoryName: "문틀교체",
    regionName: "강남구",
    beforeImg: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
    afterImg: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    desc: "욕실 하부 습기로 겉면이 부풀어 오른 문틀을 기존 래핑과 동일 색상으로 정밀 교체 완공",
    rating: 5.0,
    reviewCount: 42,
  },
  {
    id: "case_02",
    categorySlug: "maru-bokwon",
    regionSlug: "bundang",
    title: "성남 분당 아파트 강마루 찍힘 & 원상복구 컬러 매칭",
    categoryName: "마루복원",
    regionName: "성남 분당구",
    beforeImg: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80",
    afterImg: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=600&q=80",
    desc: "무거운 물건 낙하로 푹 파인 마루 바닥을 뜯어내지 않고 나무결 커스텀 조색 복원",
    rating: 4.9,
    reviewCount: 38,
  },
  {
    id: "case_03",
    categorySlug: "bubun-dobae",
    regionSlug: "mapo",
    title: "마포구 신혼집 실크 벽지 찢김 & 부분 도배 복원",
    categoryName: "부분도배",
    regionName: "마포구",
    beforeImg: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80",
    afterImg: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    desc: "반려동물 및 이삿짐 파손 벽면을 전체 교체 없이 동일 롤 무늬 부분 복원 완료",
    rating: 5.0,
    reviewCount: 51,
  },
  {
    id: "case_04",
    categorySlug: "film-sigong",
    regionSlug: "incheon-namdong",
    title: "인천 남동구 방문/샷시 친환경 인테리어 필름 래핑",
    categoryName: "필름시공",
    regionName: "인천 남동구",
    beforeImg: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
    afterImg: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=600&q=80",
    desc: "빛바랜 체리색 방문 5개 및 샷시 프레임을 현대적인 매트 화이트 필름으로 래핑",
    rating: 4.9,
    reviewCount: 29,
  },
  {
    id: "case_05",
    categorySlug: "moonteok-suri",
    regionSlug: "seocho",
    title: "서초구 아파트 방문 문턱 제거 & 바닥 단차 수평 수리",
    categoryName: "문턱수리",
    regionName: "서초구",
    beforeImg: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80",
    afterImg: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    desc: "로봇청소기 및 노약자 이동을 방해하는 튀어나온 문턱 제거 후 수평 평탄화 매감",
    rating: 5.0,
    reviewCount: 64,
  },
  {
    id: "case_06",
    categorySlug: "moon-suri",
    regionSlug: "suwon",
    title: "수원시 아파트 방문 처짐 & 하부 긁힘 래치 교정",
    categoryName: "문수리",
    regionName: "수원시",
    beforeImg: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
    afterImg: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=600&q=80",
    desc: "잘 닫히지 않고 소음이 발생하던 방문 경첩 교체 및 마찰 부위 정밀 대패 가공",
    rating: 4.8,
    reviewCount: 33,
  },
];

export default function HomePage() {
  const companyProfile = getDistributedCompanyProfile();
  const siteImages = getSiteImages();

  // Collaboration Form State
  const [collabName, setCollabName] = useState("");
  const [collabPhone, setCollabPhone] = useState("");
  const [collabRegion, setCollabRegion] = useState("seoul");
  const [collabCategory, setCollabCategory] = useState("moontle-gyoche");
  const [collabMessage, setCollabMessage] = useState("");
  const [collabSubmitting, setCollabSubmitting] = useState(false);

  const handleCollabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabName || !collabPhone) {
      alert("성함과 연락처를 입력해 주세요.");
      return;
    }

    setCollabSubmitting(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug: collabCategory,
          regionSlug: collabRegion,
          customerName: `[협업/파트너문의] ${collabName}`,
          customerPhone: collabPhone,
          content: `협업신청 지역: ${collabRegion} / 분야: ${collabCategory}\n내용: ${collabMessage}`,
          utmSource: "main_collaboration_section",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("협업 문의가 성공적으로 접수되었습니다. 담당 마스터 팀장이 확인 후 연락드리겠습니다!");
        setCollabName("");
        setCollabPhone("");
        setCollabMessage("");
      } else {
        alert(data.message || "접수 실패");
      }
    } catch (err) {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setCollabSubmitting(false);
    }
  };

  const heroImage = siteImages.find((img) => img.section === "hero")?.url ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";

  return (
    <div className="min-h-screen bg-[#0d1724] text-slate-100 flex flex-col font-sans selection:bg-[#c5a059] selection:text-white relative">
      <SiteHeader companyProfile={companyProfile} categoryName="수리위키" />

      <main className="flex-1 space-y-24 pb-24">
        {/* 1. HERO BANNER - SooriWiki Official Main Header */}
        <section id="hero" className="relative min-h-[580px] bg-slate-950 flex flex-col justify-between overflow-hidden border-b border-slate-800">
          <div className="absolute inset-0 z-0">
            <img
              src={heroImage}
              alt="수리위키 메인 히어로"
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a121d] via-[#0a121d]/90 to-[#0a121d]/70"></div>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl w-full px-6 py-20 my-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#c5a059]/20 border border-[#c5a059]/50 rounded-full text-[#e8c87b] text-xs font-extrabold">
              <span>★</span>
              <span>수도권 22개 시공 공정관 × 964개 전속 키워드 현장 통합 인프라</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none">
                수리위키
              </h1>
              <p className="text-xl md:text-2xl font-bold text-[#e8c87b]">
                대한민국 1등 집수리·복원 지식 백과 & 수도권 현장 전문가 연합
              </p>
            </div>

            <p className="text-base md:text-lg text-slate-300 max-w-3xl leading-relaxed">
              문틀, 마루, 도배, 필름, 타일, 계단, 문지방 수리까지. 누수·습기·손상 부위를 뜯어내지 않고 
              <strong> 0.1mm 정밀 보수 기술</strong>로 신축처럼 완벽하게 원상복구합니다.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href="#consult-regions"
                className="px-8 py-4 bg-gradient-to-r from-[#c5a059] to-[#b08b38] hover:from-[#d4af37] hover:to-[#c5a059] text-slate-950 font-black rounded-full shadow-2xl transition duration-200 text-sm flex items-center justify-center gap-2"
              >
                <span>⚡ 지역별 시공문의 신청</span>
                <span className="text-lg">&rarr;</span>
              </a>

              <a
                href="#showcase"
                className="px-8 py-4 bg-[#142334]/90 hover:bg-[#1f354d] text-white border border-slate-600 rounded-full font-bold transition text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <span>📸 인기 시공사례 보기</span>
              </a>

              <a
                href="#collaborate"
                className="px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 rounded-full font-semibold transition text-sm"
              >
                <span>🤝 파트너/협업문의</span>
              </a>
            </div>

            {/* Live Stats */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl border-t border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">수도권 전속 지역</span>
                <span className="text-lg font-black text-white">40개 시·군·구</span>
              </div>
              <div>
                <span className="text-slate-400 block">검증 기술 마스터</span>
                <span className="text-lg font-black text-[#e8c87b]">22개 공정 연합</span>
              </div>
              <div>
                <span className="text-slate-400 block">누적 완공 시공</span>
                <span className="text-lg font-black text-white">12,480건+</span>
              </div>
              <div>
                <span className="text-slate-400 block">고객 만족 평점</span>
                <span className="text-lg font-black text-emerald-400">★ 4.95 / 5.0</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 bg-[#070e17]/90 border-t border-slate-800 px-4 py-3 text-center text-xs text-slate-300">
            <span className="font-bold text-[#c5a059]">안내:</span> 현장 작업 중에는 전화 연결이 어려울 수 있습니다. 사진과 지역·수리 내역을 남겨주시면 5분 내 친절 상담 도와드립니다.
          </div>
        </section>

        {/* 2. POPULAR BEFORE/AFTER SHOWCASE GRID ("인기 시공사례") */}
        <section id="showcase" className="mx-auto max-w-7xl px-4 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-4 gap-2">
            <div>
              <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider">POPULAR SHOWCASE CASES</span>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                🔥 수리위키 인기 시공사례 (BEFORE & AFTER)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                클릭하시면 해당 시공 및 지역 전용 상세 페이지로 즉시 이동합니다.
              </p>
            </div>
            <a href="#services" className="text-xs text-[#e8c87b] hover:underline font-bold">
              22개 전체 공정 목록 보기 &rarr;
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {POPULAR_SHOWCASE_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={`/services/${item.categorySlug}/${item.regionSlug}`}
                className="group bg-[#142334]/80 hover:bg-[#1a2d42] border border-slate-700/80 hover:border-[#c5a059] rounded-2xl overflow-hidden shadow-xl transition duration-300 flex flex-col justify-between"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-[#c5a059]/20 text-[#e8c87b] border border-[#c5a059]/40 text-[11px] font-bold rounded-lg">
                      {item.regionName} / {item.categoryName}
                    </span>
                    <span className="text-xs text-amber-400 font-bold font-mono">
                      ★ {item.rating} ({item.reviewCount})
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-[#e8c87b] transition line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                {/* Before/After Dual Image Comparison Card */}
                <div className="p-4 pt-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative h-36 bg-slate-950 rounded-xl overflow-hidden border border-red-500/30">
                      <img
                        src={item.beforeImg}
                        alt={`${item.title} 시공전`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-extrabold rounded shadow">
                        BEFORE
                      </span>
                    </div>

                    <div className="relative h-36 bg-slate-950 rounded-xl overflow-hidden border border-emerald-500/30">
                      <img
                        src={item.afterImg}
                        alt={`${item.title} 시공후`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded shadow">
                        AFTER
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="group-hover:text-white transition">상세 사례 및 견적 확인</span>
                    <span className="text-[#c5a059] font-bold group-hover:translate-x-1 transition font-mono">&rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. REGIONAL CONSTRUCTION INQUIRY GRID ("시공문의 - 지역 대표 아이템 DB 연동") */}
        <section id="consult-regions" className="mx-auto max-w-7xl px-4 space-y-8">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider">REGIONAL CONSTRUCTION INQUIRY</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              📍 수도권 지역별 대표 시공문의
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              원하시는 지역 박스 내 시공 아이템을 선택하시면 해당 지역 전용 1:1 상담 접수로 바로 연결됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {REGIONS_DATA.map((reg) => {
              // Get DB registered categories for this region
              const regionCategories = MAIN_CATEGORIES.slice(0, 5);

              return (
                <div
                  key={reg.slug}
                  className="bg-[#142334]/90 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-xl hover:border-[#c5a059] transition duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#c5a059] uppercase font-mono">{reg.parentRegionSlug}</span>
                      <h3 className="font-extrabold text-lg text-white">{reg.name} 시공센터</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded">
                      당일 출동 가능
                    </span>
                  </div>

                  {/* Representative Registered Items from DB */}
                  <div className="space-y-2 text-xs">
                    <span className="text-slate-400 text-[11px] block font-semibold">대표 시공 항목 (클릭 시 1:1 문의):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {regionCategories.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/services/${cat.slug}/${reg.slug}/consult`}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-[#c5a059] hover:text-slate-950 border border-slate-700 hover:border-[#c5a059] text-slate-200 rounded-lg font-bold transition duration-150"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <Link
                      href={`/services/moontle-gyoche/${reg.slug}`}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      지역 전체 공정 관람 &rarr;
                    </Link>

                    <Link
                      href={`/services/moontle-gyoche/${reg.slug}/consult`}
                      className="px-3.5 py-1.5 bg-[#c5a059] hover:bg-[#b08b38] text-slate-950 font-extrabold rounded-lg text-xs transition shadow"
                    >
                      시공 문의하기
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. COLLABORATION & PARTNER MASTER INQUIRY SECTION ("협업문의") */}
        <section id="collaborate" className="mx-auto max-w-7xl px-4">
          <div className="bg-gradient-to-br from-[#142334] via-[#0f1b29] to-[#172b40] border-2 border-[#c5a059]/40 rounded-3xl p-8 md:p-12 shadow-2xl space-y-8">
            <div className="max-w-3xl space-y-3">
              <span className="px-3.5 py-1 bg-[#c5a059]/20 border border-[#c5a059]/50 text-[#e8c87b] font-mono text-xs font-bold rounded-full">
                PARTNER & COLLABORATION INQUIRY
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                🤝 수리위키 지역별 시공 기술 마스터 & 파트너 협업 문의
              </h2>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                각 지역의 자재 공급처, 인테리어 업체, 기술 시공 마스터(문수리, 도배, 필름, 마루, 타일)와의 
                상생 인프라 협업을 환영합니다. 접수해 주시면 수리위키 마스터 센터에서 직접 연락드립니다.
              </p>
            </div>

            <form onSubmit={handleCollabSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">성함 / 업체명 *</label>
                  <input
                    type="text"
                    value={collabName}
                    onChange={(e) => setCollabName(e.target.value)}
                    required
                    placeholder="예: 홍길동 (강남 마루기술 마스터)"
                    className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white text-sm focus:border-[#c5a059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">연락처 *</label>
                  <input
                    type="tel"
                    value={collabPhone}
                    onChange={(e) => setCollabPhone(e.target.value)}
                    required
                    placeholder="010-0000-0000"
                    className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white text-sm font-mono focus:border-[#c5a059] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">희망 협업 지역 *</label>
                    <select
                      value={collabRegion}
                      onChange={(e) => setCollabRegion(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-[#c5a059]"
                    >
                      {REGIONS_DATA.map((r) => (
                        <option key={r.slug} value={r.slug}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">전문 시공 분야 *</label>
                    <select
                      value={collabCategory}
                      onChange={(e) => setCollabCategory(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-[#c5a059]"
                    >
                      {MAIN_CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">협업 제안 내용 / 문의사항</label>
                  <textarea
                    rows={5}
                    value={collabMessage}
                    onChange={(e) => setCollabMessage(e.target.value)}
                    placeholder="기술 협업, 현장 오더 분양, 자재 공급, 단체 시공 제안 등 자유롭게 기재해 주세요."
                    className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white text-sm focus:border-[#c5a059] focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={collabSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-[#c5a059] to-[#b08b38] hover:from-[#d4af37] hover:to-[#c5a059] text-slate-950 font-extrabold rounded-xl shadow-xl transition duration-200 text-sm flex items-center justify-center gap-2"
                >
                  {collabSubmitting ? "접수 처리 중..." : "🤝 파트너 협업 신청 접수하기"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* 5. 4-STEP STANDARD PROCESS ("시공 절차") */}
        <section id="process" className="mx-auto max-w-7xl px-4 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider">STANDARD PROCESS</span>
            <h2 className="text-3xl font-extrabold text-white">
              🛠️ 수리위키 4단계 표준 시공 절차
            </h2>
            <p className="text-xs text-slate-400">
              사진 접수부터 마감 및 A/S 보증까지 투명하고 빠른 프로세스를 약속합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#142334]/80 border border-slate-700 rounded-2xl p-6 space-y-3 relative">
              <span className="text-3xl font-black text-[#c5a059] font-mono">01</span>
              <h3 className="font-extrabold text-base text-white">사진 접수 & 진단</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                파손 부위 전경 1장, 근접 1장을 문자로 전송하시면 담당 기술 마스터가 상태를 정밀 진단합니다.
              </p>
            </div>

            <div className="bg-[#142334]/80 border border-slate-700 rounded-2xl p-6 space-y-3 relative">
              <span className="text-3xl font-black text-[#c5a059] font-mono">02</span>
              <h3 className="font-extrabold text-base text-white">투명 정찰제 견적</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                추가금 없는 정찰제 견적가를 5분 내 산출해 드리며, 시공 일정 및 원상복구 방안을 확정합니다.
              </p>
            </div>

            <div className="bg-[#142334]/80 border border-slate-700 rounded-2xl p-6 space-y-3 relative">
              <span className="text-3xl font-black text-[#c5a059] font-mono">03</span>
              <h3 className="font-extrabold text-base text-white">전속 마스터 출동</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                해당 지역 전속 기술팀장이 전문 장비를 지참하여 현장에 방문해 0.1mm 정밀 보수를 진행합니다.
              </p>
            </div>

            <div className="bg-[#142334]/80 border border-slate-700 rounded-2xl p-6 space-y-3 relative">
              <span className="text-3xl font-black text-[#c5a059] font-mono">04</span>
              <h3 className="font-extrabold text-base text-white">완공 검수 & A/S</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                고객 직접 최종 검수 후 시공 품질 보증서를 발급해 드리며, 철저한 사후 관리 A/S를 제공합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 6. WHY SOORI WIKI & REGIONAL EXPERT TRAINING ("왜 좋은지 & 지역별 전문가 양성") */}
        <section id="why-us" className="mx-auto max-w-7xl px-4 space-y-12">
          <div className="bg-[#142334]/60 border border-slate-700 rounded-3xl p-8 md:p-12 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-4 gap-4">
              <div>
                <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider">WHY CHOOSE US</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">
                  💡 왜 수리위키를 선택해야 할까요?
                </h2>
              </div>
              <span className="text-xs text-[#e8c87b] font-mono font-bold border border-[#c5a059]/40 bg-[#c5a059]/10 px-3 py-1 rounded-full">
                검증된 수도권 대표 시공 브랜드
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-2">
                <span className="text-2xl">🎯</span>
                <h3 className="font-bold text-white text-base">0.1mm 정밀 복원 커스텀 기술</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  비싼 전체 교체 없이 파손 부위만 국소 마감하여 비용을 70% 이상 절감합니다.
                </p>
              </div>

              <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-2">
                <span className="text-2xl">⚡</span>
                <h3 className="font-bold text-white text-base">수도권 30분 당일 긴급 출동</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  지역별 전속 마스터 거점이 구축되어 있어 긴급 문의 시 당일 출동이 가능합니다.
                </p>
              </div>

              <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-2">
                <span className="text-2xl">🛡️</span>
                <h3 className="font-bold text-white text-base">100% 현장 품질 보증제</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  대표자 실명제 및 투명 정찰제 가격 정책으로 끝까지 책임 시공합니다.
                </p>
              </div>
            </div>

            {/* Regional Master Training Showcase */}
            <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>🎓 수리위키 지역별 시공 전문가/마스터 양성 센터</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  수리위키는 체계적인 현장 실습 및 0.1mm 조색·복원 교육과정을 거친 정식 마스터만을 
                  지역 거점에 배치하여 동일한 최고 수준의 시공 퀄리티를 유지합니다.
                </p>
              </div>
              <a
                href="#collaborate"
                className="px-6 py-3 bg-[#c5a059] hover:bg-[#b08b38] text-slate-950 font-bold rounded-xl text-xs transition shrink-0"
              >
                마스터 교육 & 파트너 가입 문의 &rarr;
              </a>
            </div>
          </div>
        </section>

        {/* 7. ALL 22 CATEGORIES OVERVIEW */}
        <section id="services" className="mx-auto max-w-7xl px-4 space-y-6">
          <div className="flex items-end justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider">ALL 22 CATEGORIES</span>
              <h2 className="text-2xl font-bold text-white mt-1">
                22개 메인 공정 카테고리
              </h2>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">원하는 공정을 클릭하시면 전용 출장관으로 연결됩니다.</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {MAIN_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/services/${cat.slug}/gangnam`}
                className="group p-4 bg-[#142334]/80 hover:bg-[#1a2d42] border border-slate-700/80 hover:border-[#c5a059] rounded-2xl transition duration-200 flex flex-col justify-between space-y-3 shadow-lg"
              >
                <div className="w-10 h-10 rounded-xl bg-[#c5a059]/20 text-[#e8c87b] border border-[#c5a059]/30 flex items-center justify-center font-bold text-sm group-hover:scale-110 transition">
                  {cat.name.substring(0, 1)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-[#e8c87b] transition">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{cat.domain}</p>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{cat.teamLeader}</span>
                  <span className="text-[#e8c87b] font-bold font-mono">{cat.activeCount}개</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Chat/Consult Button */}
      <a
        href="#consult-regions"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#142638] hover:bg-[#1c334b] text-[#c5a059] border-2 border-[#c5a059] rounded-full shadow-2xl flex items-center justify-center transition hover:scale-110"
        aria-label="1:1 시공문의"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </a>

      <SiteFooter company={companyProfile} />
    </div>
  );
}
