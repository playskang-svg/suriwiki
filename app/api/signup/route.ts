import { NextResponse } from "next/server";
import { signUpUser } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, name, role, requestedCategories } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { success: false, message: "아이디, 비밀번호, 성함은 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    const result = signUpUser({
      username,
      password,
      name,
      role: role || "team_leader",
      allowedCategorySlugs: requestedCategories || ["moon-suri"],
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "회원가입 신청이 완료되었습니다! 최고 관리자의 승인 후 로그인하실 수 있습니다.",
      data: result.user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
