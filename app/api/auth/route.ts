import { NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const user = getUserByUsername(username);

    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    if (user.status === "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "최고 관리자의 가입 승인을 대기 중인 계정입니다. 승인 후 로그인 가능합니다.",
        },
        { status: 403 }
      );
    }

    if (user.status === "rejected") {
      return NextResponse.json(
        { success: false, message: "가입 승인이 거절되거나 비활성화된 계정입니다." },
        { status: 403 }
      );
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      allowedCategorySlugs: user.allowedCategorySlugs || [],
      allowedAdminPages: user.allowedAdminPages || [],
    };

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    response.cookies.set({
      name: "suriwiki_session",
      value: JSON.stringify(sessionUser),
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "로그아웃되었습니다." });
  response.cookies.delete("suriwiki_session");
  return response;
}

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/suriwiki_session=([^;]+)/);

  if (match) {
    try {
      const user = JSON.parse(decodeURIComponent(match[1]));
      return NextResponse.json({ authenticated: true, user });
    } catch {
      // JSON parse error
    }
  }

  return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
}
