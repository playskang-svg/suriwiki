import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function ensureUploadDirExists() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "업로드할 파일이 존재하지 않습니다." },
        { status: 400 }
      );
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "파일 용량은 최대 20MB까지 가능합니다." },
        { status: 400 }
      );
    }

    ensureUploadDirExists();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const rawExt = path.extname(file.name);
    const ext = rawExt ? rawExt : ".jpg";
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      data: {
        url: publicUrl,
        filename,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "이미지 업로드 처리 실패" },
      { status: 500 }
    );
  }
}
