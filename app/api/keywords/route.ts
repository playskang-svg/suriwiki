import { NextResponse } from "next/server";
import { getKeywordPages, updateKeywordPageContent, updateKeywordPageStatus } from "@/lib/store";

export async function GET() {
  const pages = getKeywordPages();
  return NextResponse.json({ success: true, data: pages });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, bodyContent, title, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "키워드 페이지 ID가 누락되었습니다." }, { status: 400 });
    }

    if (bodyContent !== undefined) {
      const updated = updateKeywordPageContent(id, bodyContent, title, status);
      if (!updated) {
        return NextResponse.json({ success: false, message: "해당 키워드 페이지를 찾을 수 없습니다." }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    if (status) {
      updateKeywordPageStatus(id, status);
      return NextResponse.json({ success: true, message: "상태가 변경되었습니다." });
    }

    return NextResponse.json({ success: false, message: "변경할 내용이 없습니다." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
