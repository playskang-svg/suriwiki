import { NextResponse } from "next/server";
import { getSiteImages, updateSiteImage, deleteSiteImage, addSiteImage } from "@/lib/store";

export async function GET() {
  const images = getSiteImages();
  return NextResponse.json({ success: true, data: images });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { section, title, url, alt, isWatermarked, categorySlug } = body;

    if (!section || !url || !title) {
      return NextResponse.json({ success: false, message: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    const newImg = addSiteImage({
      section,
      title,
      url,
      alt: alt || title,
      isWatermarked: isWatermarked ?? true,
      categorySlug: categorySlug || undefined,
    });

    return NextResponse.json({ success: true, data: newImg });
  } catch (error) {
    return NextResponse.json({ success: false, message: "서버 오류" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, url, alt, isWatermarked, section, categorySlug } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "이미지 ID가 필요합니다." }, { status: 400 });
    }

    const updated = updateSiteImage(id, { title, url, alt, isWatermarked, section, categorySlug });
    if (!updated) {
      return NextResponse.json({ success: false, message: "해당 이미지를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "이미지 ID가 필요합니다." }, { status: 400 });
    }

    const success = deleteSiteImage(id);
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ success: false, message: "서버 오류" }, { status: 500 });
  }
}
