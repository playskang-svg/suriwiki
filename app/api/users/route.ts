import { NextResponse } from "next/server";
import {
  getUsers,
  updateUserStatus,
  updateUserPermissions,
  createUserDirect,
  deleteUser,
} from "@/lib/store";

/** 요청 쿠키에서 세션 사용자를 읽어 role을 확인한다 (마스터 전용 작업 서버측 방어용). */
function getSessionRole(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/sooriwiki_session=([^;]+)/);
  if (!match) return null;
  try {
    const session = JSON.parse(decodeURIComponent(match[1]));
    return session.role || null;
  } catch {
    return null;
  }
}

export async function GET() {
  const users = getUsers().map(({ password, ...u }) => u);
  return NextResponse.json({ success: true, data: users });
}

// 마스터 관리자가 승인 절차 없이 즉시 사용 가능한 관리자 계정을 직접 생성한다.
export async function POST(request: Request) {
  if (getSessionRole(request) !== "master_admin") {
    return NextResponse.json(
      { success: false, message: "마스터 관리자만 계정을 생성할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { username, password, name, role, allowedCategorySlugs, allowedAdminPages } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { success: false, message: "아이디, 비밀번호, 이름은 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    const result = createUserDirect({
      username,
      password,
      name,
      role: role || "team_leader",
      allowedCategorySlugs: allowedCategorySlugs || [],
      allowedAdminPages: allowedAdminPages || [],
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    const { password: _pw, ...safeUser } = result.user!;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error) {
    return NextResponse.json({ success: false, message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, allowedCategorySlugs, role, allowedAdminPages } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "유저 ID가 필요합니다." }, { status: 400 });
    }

    if (status) {
      updateUserStatus(id, status);
    }

    if (allowedCategorySlugs || role || allowedAdminPages !== undefined) {
      updateUserPermissions(id, allowedCategorySlugs || [], role, allowedAdminPages);
    }

    return NextResponse.json({ success: true, message: "사용자 권한이 성공적으로 수정되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (getSessionRole(request) !== "master_admin") {
    return NextResponse.json(
      { success: false, message: "마스터 관리자만 계정을 삭제할 수 있습니다." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, message: "ID가 필요합니다." }, { status: 400 });
  }

  const success = deleteUser(id);
  return NextResponse.json({ success });
}
