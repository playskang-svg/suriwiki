import { NextResponse } from "next/server";
import {
  getCompanyProfiles,
  addCompanyProfile,
  updateCompanyProfile,
  deleteCompanyProfile,
} from "@/lib/store";

export async function GET() {
  const profiles = getCompanyProfiles();
  return NextResponse.json({ success: true, data: profiles });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, representativeName, businessRegistrationNo, phoneNumber, operatingHours, serviceRegions, prepInstructions } = body;

    if (!companyName || !phoneNumber) {
      return NextResponse.json({ success: false, message: "회사명과 전화번호는 필수 입력항목입니다." }, { status: 400 });
    }

    const newProfile = addCompanyProfile({
      teamId: body.teamId || "team_custom",
      companyName,
      representativeName: representativeName || "",
      businessRegistrationNo: businessRegistrationNo || "",
      phoneNumber,
      operatingHours: operatingHours || "평일 09:00 ~ 18:00",
      serviceRegions: serviceRegions || ["전국"],
      prepInstructions: prepInstructions || "",
    });

    return NextResponse.json({ success: true, data: newProfile });
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

    const updated = updateCompanyProfile(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "해당 프로필을 찾을 수 없습니다." }, { status: 404 });
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

  const success = deleteCompanyProfile(id);
  if (!success) {
    return NextResponse.json({ success: false, message: "기본 프로필은 삭제할 수 없거나 해당 프로필을 찾을 수 없습니다." }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "삭제되었습니다." });
}
