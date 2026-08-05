import { NextResponse } from "next/server";
import {
  getContactDistributions,
  setContactDistribution,
  deleteContactDistribution,
} from "@/lib/store";

export async function GET() {
  const distributions = getContactDistributions();
  return NextResponse.json({ success: true, data: distributions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyProfileId, scope, targetSiteId, targetPageId } = body;

    if (!companyProfileId || !scope) {
      return NextResponse.json({ success: false, message: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    const dist = setContactDistribution({
      companyProfileId,
      scope,
      targetSiteId: scope === "site" ? targetSiteId : undefined,
      targetPageId: scope === "page" ? targetPageId : undefined,
    });

    return NextResponse.json({ success: true, data: dist });
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

  deleteContactDistribution(id);
  return NextResponse.json({ success: true, message: "배포 설정이 삭제되었습니다." });
}
