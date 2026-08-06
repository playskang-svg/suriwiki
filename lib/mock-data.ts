/**
 * 뼈대 단계 전용 목업 데이터.
 * 실제 DB/API 연동 전까지 레이아웃 확인용으로만 쓰고, 연동 시작 시 이 파일을 지운다.
 */
import type {
  CompanyProfile,
  DashboardKpi,
  KeywordPage,
  Site,
} from "./types";

export const mockCompanyProfile: CompanyProfile = {
  id: "cp_1",
  teamId: "team_19",
  companyName: "빛가람",
  representativeName: "공수용",
  businessRegistrationNo: "562-15-02951",
  phoneNumber: "010-2529-1726",
  operatingHours: "매일 08:00 ~ 21:00",
  serviceRegions: ["서울", "경기", "인천"],
  prepInstructions: "지역(시·구·동)과 수리 내용을 전화로 알려주시면 바로 안내해드립니다.",
};

export const mockSites: Site[] = [
  { id: "site_1", domain: "doorsuri.example.com", categorySlug: "moon-suri", name: "문수리", teamId: "team_19", createdAt: "2026-04-13" },
  { id: "site_2", domain: "doorframesuri.example.com", categorySlug: "moontle-suri", name: "문틀수리", teamId: "team_19", createdAt: "2026-04-13" },
  { id: "site_3", domain: "wallpaper.example.com", categorySlug: "byeokji-bokwon", name: "벽지복원", teamId: "team_19", createdAt: "2026-07-21" },
  { id: "site_4", domain: "floor.example.com", categorySlug: "maru-bokwon", name: "마루복원", teamId: "team_19", createdAt: "2026-04-16" },
];

export const mockKeywordPages: KeywordPage[] = [
  {
    id: "kp_1",
    siteId: "site_3",
    categorySlug: "byeokji-bokwon",
    regionSlug: "gunpo",
    title: "군포 벽지복원",
    status: "published",
    consultPageId: "consult_1",
    lastModified: "2026-07-30",
  },
];

export const mockDashboardKpi: DashboardKpi = {
  siteCount: 22,
  siteCountDelta: 0,
  keywordPageCount: 964,
  keywordPageCountDelta: 200,
  totalItemCount: 986,
  totalItemCountDelta: 200,
  naverValidKeywordCount: 599,
  naverValidKeywordCountDelta: 576,
  naverTopRankKeywordCount: 390,
  newKeywordThisWeekCount: 40,
};
