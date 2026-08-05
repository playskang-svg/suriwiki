"use client";

import { useState, useEffect } from "react";
import { SiteImage } from "@/lib/types";

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
  const [isWatermarked, setIsWatermarked] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  const openAddModal = () => {
    setEditingImage(null);
    setTitle("");
    setUrl("");
    setAlt("");
    setSection("showcase");
    setIsWatermarked(true);
    setIsModalOpen(true);
  };

  const openEditModal = (img: SiteImage) => {
    setEditingImage(img);
    setTitle(img.title);
    setUrl(img.url);
    setAlt(img.alt);
    setSection(img.section);
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
    </div>
  );
}
