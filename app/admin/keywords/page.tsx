"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { MAIN_CATEGORIES, REGIONS_DATA } from "@/lib/store";
import { KeywordPage, PageStatus } from "@/lib/types";

interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: string;
  allowedCategorySlugs?: string[];
}

export default function AdminKeywordsPage() {
  const [pages, setPages] = useState<KeywordPage[]>([]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Combobox Keyword Editor State
  const [editingPageId, setEditingPageId] = useState<string>("");
  const [editTitle, setEditTitle] = useState("");
  const [editBodyContent, setEditBodyContent] = useState("");
  const [editStatus, setEditStatus] = useState<PageStatus>("published");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAuth, resPages] = await Promise.all([
        fetch("/api/auth"),
        fetch("/api/keywords"),
      ]);

      const dataAuth = await resAuth.json();
      const dataPages = await resPages.json();

      let allowedSlugs: string[] | undefined = undefined;
      if (dataAuth.authenticated && dataAuth.user) {
        setCurrentUser(dataAuth.user);
        if (dataAuth.user.role !== "super_admin" && dataAuth.user.allowedCategorySlugs?.length) {
          allowedSlugs = dataAuth.user.allowedCategorySlugs;
        }
      }

      if (dataPages.success) {
        let keywordList: KeywordPage[] = dataPages.data;
        if (allowedSlugs) {
          keywordList = keywordList.filter((p) => allowedSlugs!.includes(p.categorySlug));
        }
        setPages(keywordList);

        if (keywordList.length > 0 && !editingPageId) {
          selectPageForEditing(keywordList[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load keyword pages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectPageForEditing = (page: KeywordPage) => {
    setEditingPageId(page.id);
    setEditTitle(page.title);
    setEditBodyContent(page.bodyContent || "");
    setEditStatus(page.status);
  };

  const handleComboboxChange = (id: string) => {
    const target = pages.find((p) => p.id === id);
    if (target) {
      selectPageForEditing(target);
    }
  };

  const handleSavePageContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPageId) return;

    setSaving(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPageId,
          title: editTitle,
          bodyContent: editBodyContent,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("키워드 페이지 본문글 및 제목이 성공적으로 저장되었습니다!");
        fetchData();
      } else {
        alert(data.message || "저장에 실패했습니다.");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      const matchCat = selectedCategory === "all" || p.categorySlug === selectedCategory;
      const matchStatus = selectedStatus === "all" || p.status === selectedStatus;
      const matchSearch =
        !searchQuery ||
        p.title.includes(searchQuery) ||
        p.categorySlug.includes(searchQuery) ||
        p.regionSlug.includes(searchQuery);
      return matchCat && matchStatus && matchSearch;
    });
  }, [pages, selectedCategory, selectedStatus, searchQuery]);

  const handleStatusChange = async (id: string, newStatus: PageStatus) => {
    try {
      const res = await fetch("/api/keywords", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkStatusChange = async (newStatus: PageStatus) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await handleStatusChange(id, newStatus);
    }
    setSelectedIds([]);
    fetchData();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPages.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const currentEditingPage = pages.find((p) => p.id === editingPageId);

  // Available categories for dropdown filter
  const availableCategories = useMemo(() => {
    if (currentUser && currentUser.role !== "super_admin" && currentUser.allowedCategorySlugs?.length) {
      return MAIN_CATEGORIES.filter((c) => currentUser.allowedCategorySlugs!.includes(c.slug));
    }
    return MAIN_CATEGORIES;
  }, [currentUser]);

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            키워드·페이지 운영 & 바디글 관리자 편집 (PRD 12.2)
          </h1>
          {currentUser && currentUser.role !== "super_admin" && (
            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold">
              🔒 계정 권한 전담 모드: {currentUser.name} (담당 카테고리 {availableCategories.length}개)
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          키워드 콤보박스 선택으로 세부 랜딩페이지 제목과 본문(바디글)을 수정 및 실시간 발행할 수 있습니다.
        </p>
      </div>

      {/* 1. Combobox Body Content Editor Section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>✍️ 키워드 페이지 본문(바디글) 콤보박스 편집기</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              원하는 키워드 페이지를 콤보박스에서 선택하고 본문 글을 자유롭게 수정·저장하세요.
            </p>
          </div>

          {currentEditingPage && (
            <div className="flex gap-2">
              <Link
                href={`/services/${currentEditingPage.categorySlug}/${currentEditingPage.regionSlug}`}
                target="_blank"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                실시간 페이지 미리보기 ↗
              </Link>
            </div>
          )}
        </div>

        <form onSubmit={handleSavePageContent} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Combobox for Page Selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                📌 편집할 키워드 페이지 선택 (콤보박스)
              </label>
              <select
                value={editingPageId}
                onChange={(e) => handleComboboxChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.status === "published" ? "발행" : "초안"}] {p.title} ({p.categorySlug}/{p.regionSlug})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                페이지 제목 (Title)
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                발행 상태 (Status)
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as PageStatus)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
              >
                <option value="published">published (발행)</option>
                <option value="draft">draft (초안)</option>
                <option value="seo_check">seo_check (SEO 검수)</option>
                <option value="archived">archived (보관)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              키워드 페이지 맞춤 본문 글 (Body Content Article)
            </label>
            <textarea
              rows={8}
              value={editBodyContent}
              onChange={(e) => setEditBodyContent(e.target.value)}
              placeholder="해당 키워드 랜딩페이지에 노출될 본문 글을 작성하세요."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 leading-relaxed font-sans"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-2"
            >
              {saving ? <span>저장 중...</span> : <span>💾 변경사항 저장하기</span>}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Filter & Keyword Matrix Table Section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              카테고리 필터
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="all">전체 허용 공정 ({availableCategories.length}개)</option>
              {availableCategories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              발행 상태 필터
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="all">전체 상태</option>
              <option value="published">발행됨 (published)</option>
              <option value="draft">초안 (draft)</option>
              <option value="seo_check">SEO 검수 (seo_check)</option>
              <option value="archived">보관됨 (archived)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              검색어 (지역/제목)
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="예: 강남, 문수리..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedStatus("all");
                setSearchQuery("");
              }}
              className="w-full py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium transition"
            >
              필터 초기화
            </button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-between text-xs text-blue-400">
            <span>선택된 {selectedIds.length}개 항목 일괄 상태 변경:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusChange("published")}
                className="px-3 py-1 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-500 transition"
              >
                발행 완료 (published)
              </button>
              <button
                onClick={() => handleBulkStatusChange("draft")}
                className="px-3 py-1 bg-amber-600 text-white rounded font-medium hover:bg-amber-500 transition"
              >
                초안 변경 (draft)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keywords Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            총 <strong className="text-slate-900 dark:text-slate-100">{filteredPages.length}</strong>개 페이지 검색됨
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">페이지 데이터 로딩 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredPages.length && filteredPages.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="py-3 px-4">키워드 랜딩 페이지</th>
                  <th className="py-3 px-4">카테고리 / 지역</th>
                  <th className="py-3 px-4">발행 상태</th>
                  <th className="py-3 px-4">1:1 상담문의 URL</th>
                  <th className="py-3 px-4 text-right">편집 & 미리보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {filteredPages.map((page) => {
                  const isSelected = selectedIds.includes(page.id);
                  const isEditingThis = page.id === editingPageId;
                  const reg = REGIONS_DATA.find((r) => r.slug === page.regionSlug);
                  const cat = MAIN_CATEGORIES.find((c) => c.slug === page.categorySlug);

                  return (
                    <tr
                      key={page.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                        isEditingThis ? "bg-blue-500/10 dark:bg-blue-950/40" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(page.id)}
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {page.title}
                        {isEditingThis && (
                          <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">
                            편집중
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <span className="font-mono text-blue-600 dark:text-blue-400">{cat?.name || page.categorySlug}</span> / {reg?.name || page.regionSlug}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={page.status}
                          onChange={(e) => handleStatusChange(page.id, e.target.value as PageStatus)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                            page.status === "published"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          <option value="published">published (발행)</option>
                          <option value="draft">draft (초안)</option>
                          <option value="seo_check">seo_check (검수)</option>
                          <option value="archived">archived (보관)</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        /services/{page.categorySlug}/{page.regionSlug}/consult
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            selectPageForEditing(page);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="px-2 py-1 bg-blue-600 text-white rounded font-medium text-[11px]"
                        >
                          본문편집
                        </button>
                        <Link
                          href={`/services/${page.categorySlug}/${page.regionSlug}`}
                          target="_blank"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          보기 ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
