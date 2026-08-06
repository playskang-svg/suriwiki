import { NextResponse } from "next/server";
import { getDistributedCompanyProfile } from "@/lib/store";

/**
 * 특정 지역×공정(또는 사이트 전체)에 배포된 회사정보를 서버에서 확정 계산해 반환한다.
 *
 * 클라이언트 컴포넌트("use client")는 lib/store.ts의 함수를 직접 호출하면 안 된다 —
 * 브라우저 번들에서는 파일시스템 DB를 읽지 못해 항상 최초 시드 값만 보이는 버그가 있었다.
 * 상담문의 페이지 등 클라이언트 컴포넌트는 반드시 이 API를 통해서만 회사정보를 가져온다.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const region = searchParams.get("region") || undefined;

  const profile = getDistributedCompanyProfile(category, region);
  return NextResponse.json({ success: true, data: profile });
}
