import { NextResponse } from "next/server";
import { addConsultationLead, getConsultationLeads, updateConsultationStatus } from "@/lib/store";

export async function GET() {
  const leads = getConsultationLeads();
  return NextResponse.json({ success: true, data: leads });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categorySlug, regionSlug, customerName, customerPhone, content, imageUrl, utmSource } = body;

    if (!customerName || !customerPhone || !content) {
      return NextResponse.json(
        { success: false, message: "이름, 연락처, 상담 내용은 필수 입력 사항입니다." },
        { status: 400 }
      );
    }

    const lead = addConsultationLead({
      categorySlug: categorySlug || "moon-suri",
      regionSlug: regionSlug || "gangnam",
      customerName,
      customerPhone,
      content,
      imageUrl: imageUrl || undefined,
      utmSource: utmSource || "direct",
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    return NextResponse.json({ success: false, message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "ID와 상태 정보가 누락되었습니다." }, { status: 400 });
    }

    const ok = updateConsultationStatus(id, status);
    if (!ok) {
      return NextResponse.json({ success: false, message: "해당 상담 내역을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "상태가 변경되었습니다." });
  } catch (error) {
    return NextResponse.json({ success: false, message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
