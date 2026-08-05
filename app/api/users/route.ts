import { NextResponse } from "next/server";
import { getUsers, updateUserStatus, updateUserPermissions } from "@/lib/store";

export async function GET() {
  const users = getUsers().map(({ password, ...u }) => u);
  return NextResponse.json({ success: true, data: users });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, allowedCategorySlugs, role } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "유저 ID가 필요합니다." }, { status: 400 });
    }

    if (status) {
      updateUserStatus(id, status);
    }

    if (allowedCategorySlugs || role) {
      updateUserPermissions(id, allowedCategorySlugs || [], role);
    }

    return NextResponse.json({ success: true, message: "사용자 권한이 성공적으로 수정되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
