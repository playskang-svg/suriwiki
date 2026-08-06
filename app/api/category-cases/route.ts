import { NextResponse } from "next/server";
import {
  getCategoryCases,
  addCategoryCase,
  updateCategoryCase,
  deleteCategoryCase,
} from "@/lib/store";
import { ServiceCategorySlug } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as ServiceCategorySlug | null;
  const cases = getCategoryCases(category || undefined);
  return NextResponse.json({ success: true, data: cases });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categorySlug, regionLabel, title, description, beforeImageUrl, afterImageUrl } = body;

    if (!categorySlug || !title || !beforeImageUrl || !afterImageUrl) {
      return NextResponse.json(
        { success: false, message: "카테고리, 제목, 전·후 이미지는 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    const newCase = addCategoryCase({
      categorySlug,
      regionLabel: regionLabel || "",
      title,
      description: description || "",
      beforeImageUrl,
      afterImageUrl,
    });

    return NextResponse.json({ success: true, data: newCase });
  } catch (error) {
    return NextResponse.json({ success: false, message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "수정할 ID가 누락되었습니다." }, { status: 400 });
    }

    const updated = updateCategoryCase(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "해당 시공사례를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, message: "ID가 필요합니다." }, { status: 400 });
  }

  const success = deleteCategoryCase(id);
  return NextResponse.json({ success });
}
