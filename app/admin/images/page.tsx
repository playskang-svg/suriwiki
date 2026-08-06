"use client";

import { useState, useEffect } from "react";
import { SiteImage, CategoryCase } from "@/lib/types";
import { MAIN_CATEGORIES } from "@/lib/store";

export default function AdminImagesPage() {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>("all");

  // Upload/Edit Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<SiteImage | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [section, setSection] = useState<SiteImage["section"]>("showcase");
  const [imgCategorySlug, setImgCategorySlug] = useState<string>("");
  const [isWatermarked, setIsWatermarked] = useState(true);
  const [uploading, setUploading] = useState(false);

  // 카테고리별 시공사례(BEFORE/AFTER) 관리 상태 — PRD 12장, 공정 허브 "시공 사례" 섹션과 직결
  const [caseCategory, setCaseCategory] = useState<string>(MAIN_CATEGORIES[0]?.slug || "");
  const [cases, setCases] = useState<CategoryCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CategoryCase | null>(null);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseRegionLabel, setCaseRegionLabel] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [caseBeforeUrl, setCaseBeforeUrl] = useState("");
  const [caseAfterUrl, setCaseAfterUrl] = useState("");
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/images");
      const data = await res.json();
      if (data.success) {
        setImages(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchCases = async (categorySlug: string) => {
    setLoadingCases(true);
    try {
      const res = await fetch(`/api/category-cases?category=${categorySlug}`);
      const data = await res.json();
      if (data.success) setCases(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    if (caseCategory) fetchCases(caseCategory);
  }, [caseCategory]);

  const openAddCaseModal = () => {
    setEditingCase(null);
    setCaseTitle("");
    setCaseRegionLabel("");
    setCaseDescription("");
    setCaseBeforeUrl("");
    setCaseAfterUrl("");
    setIsCaseModalOpen(true);
  };

  const openEditCaseModal = (c: CategoryCase) => {
    setEditingCase(c);
    setCaseTitle(c.title);
    setCaseRegionLabel(c.regionLabel);
    setCaseDescription(c.description);
    setCaseBeforeUrl(c.beforeImageUrl);
    setCaseAfterUrl(c.afterImageUrl);
    setIsCaseModalOpen(true);
  };

  const handleCaseImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    which: "before" | "after"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploadingFlag = which === "before" ? setUploadingBefore : setUploadingAfter;
    const setUrlFn = which === "before" ? setCaseBeforeUrl : setCaseAfterUrl;

    setUploadingFlag(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      const uploadedUrl = data.url || data.data?.url;
      if (res.ok && data.success && uploadedUrl) {
        setUrlFn(uploadedUrl);
      } else {
        alert(data.message || "이미지 업로드에 실패했습니다.");
      }
    } catch (err) {
      alert("이미지 업로드 처리 중 오류가 발생했습니다.");
    } finally {
      setUploadingFlag(false);
    }
  };

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle || !caseBeforeUrl || !caseAfterUrl) {
      alert("제목과 시공 전·후 사진은 필수입니다.");
      return;
    }

    try {
      const payload = {
        id: editingCase?.id,
        categorySlug: caseCategory,
        regionLabel: caseRegionLabel,
        title: caseTitle,
        description: caseDescription,
        beforeImageUrl: caseBeforeUrl,
        afterImageUrl: caseAfterUrl,
      };
      const method = editingCase ? "PUT" : "POST";
      const res = await fetch("/api/category-cases", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsCaseModalOpen(false);
        fetchCases(caseCategory);
      } else {
        alert(data.message || "저장에 실패했습니다.");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!confirm("이 시공사례를 삭제하시겠습니까? 해당 카테고리 허브 페이지에서 즉시 사라집니다.")) return;
    try {
      const res = await fetch(`/api/category-cases?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchCases(caseCategory);
    } catch (err) {
      alert("삭제 실패");
    }
  };

  const openAddModal = () => {
    setEditingImage(null);
    setTitle("");
    setUrl("");
    setAlt("");
    setSection("showcase");
    setImgCategorySlug("");
    setIsWatermarked(true);
    setIsModalOpen(true);
  };

  const openEditModal = (img: SiteImage) => {
    setEditingImage(img);
    setTitle(img.title);
    setUrl(img.url);
    setAlt(img.alt);
    setSection(img.section);
    setImgCategorySlug(img.categorySlug || "");
    setIsWatermarked(img.isWatermarked ?? true);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const uploadedUrl = data.url || data.data?.url;

      if (res.ok && data.success && uploadedUrl) {
        setUrl(uploadedUrl);
        if (!title) {
          setTitle(file.name.split(".")[0]);
        }
      } else {
        alert(data.message || "파일 업로드에 실패했습니다.");
      }
    } catch (err) {
      alert("파일 업로드 처리 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) {
      alert("이미지 파일 업로드(또는 URL)와 제목을 입력하세요.");
      return;
    }

    try {
      const payload = {
        id: editingImage?.id,
        section,
        title,
        url,
        alt: alt || title,
        isWatermarked,
        categorySlug: imgCategorySlug || undefined,
      };

      const method = editingImage ? "PUT" : "POST";
      const res = await fetch("/api/images", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(editingImage ? "이미지가 교체 저장되었습니다!" : "신규 이미지가 추가 등록되었습니다!");
        setIsModalOpen(false);
        fetchImages();
      } else {
        alert(data.message || "저장 실패");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 이미지를 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/images?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("이미지가 삭제되었습니다.");
        fetchImages();
      }
    } catch (err) {
      alert("삭제 실패");
    }
  };

  const filteredImages = selectedSection === "all"
    ? images
    : images.filter((img) => img.section === selectedSection);

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>🖼️ 메인페이지 섹션별 이미지 교체·삭제 관리 대시보드</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            히어로 배포 배너, 시공 전·후(BEFORE/AFTER) 섹션 및 공정 썸네일 이미지를 자유롭게 삭제, 교체, 업로드할 수 있습니다.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition text-xs flex items-center justify-center gap-2"
        >
          <span>➕ 섹션 이미지 신규 등록</span>
        </button>
      </div>

      {/* Section Filter Bar */}
      <div className="flex gap-2 border-b border-slate-700 pb-3 text-xs overflow-x-auto">
        <button
          onClick={() => setSelectedSection("all")}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            selectedSection === "all"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          전체 섹션 ({images.length})
        </button>
        <button
          onClick={() => setSelectedSection("hero")}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            selectedSection === "hero"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          히어로 메인 배너
        </button>
        <button
          onClick={() => setSelectedSection("showcase")}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            selectedSection === "showcase"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          BEFORE / AFTER 사례
        </button>
        <button
          onClick={() => setSelectedSection("categories")}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            selectedSection === "categories"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          공정별 카테고리
        </button>
      </div>

      {/* 카테고리별 시공사례(BEFORE/AFTER) 관리 — 공정 허브 페이지 "시공 사례" 섹션과 1:1로 연결 */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🏗️ 카테고리별 시공사례(BEFORE/AFTER) 관리</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              아래에서 올리는 사진·제목·설명은 <code className="text-blue-400">/services/{caseCategory}</code> 허브
              페이지의 &quot;시공 사례&quot; 섹션에 그대로 나타납니다.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={caseCategory}
              onChange={(e) => setCaseCategory(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white"
            >
              {MAIN_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              onClick={openAddCaseModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition"
            >
              ➕ 사례 추가
            </button>
          </div>
        </div>

        {loadingCases ? (
          <p className="text-xs text-slate-400 py-4">불러오는 중...</p>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
            {MAIN_CATEGORIES.find((c) => c.slug === caseCategory)?.name} 카테고리에 등록된 시공사례가 없습니다.
            &quot;사례 추가&quot; 버튼으로 첫 사례를 등록해 보세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((c) => (
              <div key={c.id} className="bg-slate-900/70 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative h-24 rounded-lg overflow-hidden border border-red-500/30">
                    <img src={c.beforeImageUrl} alt="before" className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded">BEFORE</span>
                  </div>
                  <div className="relative h-24 rounded-lg overflow-hidden border border-emerald-500/30">
                    <img src={c.afterImageUrl} alt="after" className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded">AFTER</span>
                  </div>
                </div>
                <p className="font-bold text-sm text-white truncate">{c.title}</p>
                {c.regionLabel && <p className="text-[11px] text-slate-400">{c.regionLabel}</p>}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openEditCaseModal(c)}
                    className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold rounded transition"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteCase(c.id)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-[11px] font-bold rounded transition"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images Grid Showcase */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">이미지 목록 로딩 중...</div>
      ) : filteredImages.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-800/40 rounded-xl border border-slate-700">
          등록된 이미지가 없습니다. 상단 버튼으로 이미지를 교체 또는 추가하세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg space-y-3 flex flex-col justify-between"
            >
              <div className="relative h-48 bg-slate-900 overflow-hidden group">
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                {/* Watermark Overlay Preview */}
                {img.isWatermarked && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur border border-amber-400/50 text-amber-300 font-extrabold text-[10px] rounded shadow tracking-wider">
                    WATERMARK: 예시 이미지
                  </div>
                )}

                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-600 text-white font-mono font-bold text-[10px] rounded">
                  섹션: {img.section}
                </div>
                {img.categorySlug && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#c5a059] text-slate-950 font-mono font-bold text-[10px] rounded">
                    {MAIN_CATEGORIES.find((c) => c.slug === img.categorySlug)?.name || img.categorySlug} 전용
                  </div>
                )}
              </div>

              <div className="p-4 space-y-2 flex-1">
                <h3 className="font-bold text-sm text-white">{img.title}</h3>
                <p className="text-xs text-slate-400 font-mono truncate">{img.url}</p>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-700/60 flex justify-between">
                  <span>등록일: {img.updatedAt}</span>
                  <span>{img.isWatermarked ? "워터마크 적용됨" : "일반 노출"}</span>
                </div>
              </div>

              <div className="p-4 pt-0 flex gap-2">
                <button
                  onClick={() => openEditModal(img)}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
                >
                  ✏️ 이미지 교체
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold rounded-lg transition"
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-lg text-white">
                {editingImage ? "이미지 삭제 & 교체 편집" : "섹션 이미지 신규 추가"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveImage} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">노출 섹션 선택 *</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value as SiteImage["section"])}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                >
                  <option value="hero">히어로 메인 배너 (Hero)</option>
                  <option value="showcase">BEFORE / AFTER 시공 사례 (Showcase)</option>
                  <option value="categories">공정 카테고리 썸네일 (Categories)</option>
                  <option value="process">시공 가이드 섹션 (Process)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">적용 대상</label>
                <select
                  value={imgCategorySlug}
                  onChange={(e) => setImgCategorySlug(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">전체 홈 공용 (기본)</option>
                  {MAIN_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name} 카테고리 페이지 전용
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  히어로 배너를 특정 공정 카테고리로 지정하면 해당 카테고리 페이지 최상단에만 노출됩니다.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">이미지 제목 / 설명 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="예: 문틀 습기 파손 복원 BEFORE"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              {/* Upload File or Direct URL */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-300">이미지 파일 직접 선택 업로드</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
                {uploading && <p className="text-blue-400 animate-pulse font-bold">📂 서버로 이미지 업로드 중...</p>}

                <label className="block font-semibold text-slate-400 pt-1">업로드된 파일 경로 (또는 직접 입력)</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="https://... 또는 /uploads/..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono"
                />
              </div>

              {url && (
                <div className="relative h-32 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                  <img src={url} alt="미리보기" className="w-full h-full object-cover" />
                  {isWatermarked && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 text-amber-300 font-bold text-[10px] rounded border border-amber-400/50">
                      예시 이미지
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isWatermarked}
                  onChange={(e) => setIsWatermarked(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600"
                />
                <span className="font-bold text-amber-400">&apos;예시 이미지&apos; 워터마크 표시 마크업 적용</span>
              </label>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 rounded text-slate-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow"
                >
                  {editingImage ? "교체 저장하기" : "신규 추가하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 카테고리별 시공사례 등록/수정 모달 */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-lg text-white">
                {editingCase ? "시공사례 수정" : "새 시공사례 추가"} — {MAIN_CATEGORIES.find((c) => c.slug === caseCategory)?.name}
              </h3>
              <button onClick={() => setIsCaseModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCase} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">사례 제목 *</label>
                <input
                  type="text"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  required
                  placeholder="예: 강남구 아파트 문틀 습기 부식 정밀 복원"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">지역/현장 라벨</label>
                <input
                  type="text"
                  value={caseRegionLabel}
                  onChange={(e) => setCaseRegionLabel(e.target.value)}
                  placeholder="예: 강남구 아파트 현장"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block font-bold text-red-400">시공 전(BEFORE) 사진 *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCaseImageUpload(e, "before")}
                    className="w-full text-[11px] text-slate-400 file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-500 cursor-pointer"
                  />
                  {uploadingBefore && <p className="text-red-400 animate-pulse">업로드 중...</p>}
                  {caseBeforeUrl && (
                    <div className="relative h-24 rounded-lg overflow-hidden border border-red-500/30">
                      <img src={caseBeforeUrl} alt="시공전 미리보기" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block font-bold text-emerald-400">시공 후(AFTER) 사진 *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCaseImageUpload(e, "after")}
                    className="w-full text-[11px] text-slate-400 file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                  />
                  {uploadingAfter && <p className="text-emerald-400 animate-pulse">업로드 중...</p>}
                  {caseAfterUrl && (
                    <div className="relative h-24 rounded-lg overflow-hidden border border-emerald-500/30">
                      <img src={caseAfterUrl} alt="시공후 미리보기" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">현장 설명</label>
                <textarea
                  rows={3}
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  placeholder="현장 상황과 시공 내용을 간단히 적어주세요."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCaseModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 rounded text-slate-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={uploadingBefore || uploadingAfter}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow"
                >
                  {editingCase ? "수정 저장하기" : "등록하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
