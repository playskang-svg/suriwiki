import { getDistributedCompanyProfile, getSiteImages } from "@/lib/store";
import { HomeClient } from "@/components/public/home-client";

// 회사정보(연락처 등)는 관리자가 언제든 바꿀 수 있으므로 빌드 시점에 정적으로 굳히지 않고
// 매 요청마다 서버에서 새로 읽는다 (12.4 회사정보·연락처 배포 관리).
export const dynamic = "force-dynamic";

export default function HomePage() {
  const companyProfile = getDistributedCompanyProfile();
  const siteImages = getSiteImages();
  const heroImageUrl =
    siteImages.find((img) => img.section === "hero")?.url || "/korean_technician_hero.png";

  return <HomeClient companyProfile={companyProfile} heroImageUrl={heroImageUrl} />;
}
