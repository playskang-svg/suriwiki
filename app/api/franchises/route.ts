import { NextResponse } from "next/server";
import { getSiteFranchises, assignSiteFranchise } from "@/lib/store";
import { ServiceCategorySlug } from "@/lib/types";

// 카테고리(메인사이트) 분양 현황 — PRD 9장. 계약/결제 자동화 전, 조회·수동 배정 골격만 제공한다.
export async function GET() {
  return NextResponse.json({ success: true, data: getSiteFranchises() });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { categorySlug, status, ownerUserId, customDomain, notes } = body as {
      categorySlug: ServiceCategorySlug;
      status?: "unsold" | "reserved" | "sold";
      ownerUserId?: string;
      customDomain?: string;
      notes?: string;
    };

    if (!categorySlug) {
      return NextResponse.json({ success: false, message: "categorySlug가 필요합니다." }, { status: 400 });
    }

    const updated = assignSiteFranchise(categorySlug, { status, ownerUserId, customDomain, notes });
    if (!updated) {
      return NextResponse.json({ success: false, message: "해당 카테고리를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
