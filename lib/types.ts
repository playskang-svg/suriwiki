/**
 * PRD 14장(데이터 모델 핵심 엔터티) 및 이미지 관리/권한 모델.
 */

export interface SiteImage {
  id: string;
  section: "hero" | "categories" | "showcase" | "process";
  title: string;
  url: string;
  alt: string;
  isWatermarked?: boolean;
  updatedAt: string;
}

// --- 사이트·조직 & 사용자 권한 ---------------------------------------------

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: "super_admin" | "team_leader" | "site_owner";
  status: "pending" | "approved" | "rejected";
  allowedCategorySlugs?: ServiceCategorySlug[];
  allowedPageIds?: string[];
  createdAt: string;
}

export interface Site {
  id: string;
  domain: string;
  categorySlug: ServiceCategorySlug;
  name: string;
  teamId: string;
  createdAt: string;
}

export interface Team {
  id: string;
  leaderName: string;
  businessRegistrationNo?: string;
  uploadUrl: string;
}

export type ServiceCategorySlug =
  | "moon-suri"
  | "moontle-suri"
  | "moontle-gyoche"
  | "namu-moon-suri"
  | "maru-bokwon"
  | "gangmaru-bosu"
  | "film-sigong"
  | "moon-film-sigong"
  | "bangmun-film-sigong"
  | "bubun-film-jakeop"
  | "gyedan-suri"
  | "gyedan-bokwon"
  | "namu-gyedan-suri"
  | "bokcheung-gyedan-bokwon"
  | "moonjibang-suri"
  | "moonteok-suri"
  | "kkaejin-moon-suri"
  | "byeokji-bokwon"
  | "bubun-dobae"
  | "bosu-dobae"
  | "dobae-bokwon"
  | "bangmun-bokwon";

// --- 지역 -------------------------------------------------------------------

export interface Region {
  slug: string;
  name: string;
  parentRegionSlug?: string;
}

// --- 페이지 & 네이버 순위 ----------------------------------------------------

export type PageStatus =
  | "draft"
  | "data_ready"
  | "seo_check"
  | "review"
  | "scheduled"
  | "published"
  | "update_needed"
  | "archived";

export interface NaverRankInfo {
  currentRank: number;
  previousRank: number;
  rankDelta: number;
  naverStatus: "top1" | "top5" | "top10" | "indexed" | "unindexed";
  lastChecked: string;
  pcSearchVolume: number;
  mobileSearchVolume: number;
}

export interface KeywordPage {
  id: string;
  siteId: string;
  categorySlug: ServiceCategorySlug;
  regionSlug: string;
  title: string;
  bodyContent?: string;
  status: PageStatus;
  consultPageId: string;
  lastModified: string;
  naverRank?: NaverRankInfo;
}

export interface KeywordSuggestion {
  id: string;
  categorySlug: ServiceCategorySlug;
  regionSlug: string;
  suggestedKeyword: string;
  monthlySearchVolume: number;
  competitionLevel: "low" | "medium" | "high";
  potentialRevenue: string;
  reason: string;
}

export interface ConsultPage {
  id: string;
  keywordPageId: string;
  slug: string;
  status: "generated" | "missing" | "error";
  utm: {
    source: string;
    medium: string;
    campaign: string;
    content: string;
  };
}

export interface ProjectCase {
  id: string;
  siteId: string;
  title: string;
  regionSlug: string;
  categorySlug: ServiceCategorySlug;
  beforeImageUrl: string;
  afterImageUrl: string;
  publishedAt: string;
}

// --- 회사정보·연락처 배포 ----------------------------------------------------

export interface CompanyProfile {
  id: string;
  teamId: string;
  companyName: string;
  representativeName: string;
  businessRegistrationNo: string;
  phoneNumber: string;
  operatingHours: string;
  serviceRegions: string[];
  prepInstructions: string;
}

export type ContactDistributionScope = "site" | "page";

export interface ContactDistribution {
  id: string;
  companyProfileId: string;
  scope: ContactDistributionScope;
  targetSiteId?: string;
  targetPageId?: string;
}

// --- KPI -------------------------------------------------------------------

export interface DashboardKpi {
  siteCount: number;
  siteCountDelta: number;
  keywordPageCount: number;
  keywordPageCountDelta: number;
  totalItemCount: number;
  totalItemCountDelta: number;
  naverValidKeywordCount: number;
  naverValidKeywordCountDelta: number;
  naverTopRankKeywordCount: number;
  newKeywordThisWeekCount: number;
}
