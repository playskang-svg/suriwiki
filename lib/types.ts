/**
 * PRD 14장(데이터 모델 핵심 엔터티) 및 이미지 관리/권한 모델.
 */

export interface SiteImage {
  id: string;
  section: "hero" | "categories" | "showcase" | "process";
  /** 지정하면 홈 전체가 아니라 해당 공정(카테고리) 허브 페이지 전용 이미지가 된다. */
  categorySlug?: ServiceCategorySlug;
  title: string;
  url: string;
  alt: string;
  isWatermarked?: boolean;
  updatedAt: string;
}

/**
 * 공정(카테고리) 허브 페이지의 실제 시공 전·후 사례 카드.
 * 관리자가 카테고리별로 업로드하면 해당 카테고리 허브 페이지(/services/{category})의
 * "시공 사례" 섹션에 그대로 반영된다 (PRD 12장, 이용방법 가이드 참고).
 */
export interface CategoryCase {
  id: string;
  categorySlug: ServiceCategorySlug;
  regionLabel: string;
  title: string;
  description: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  updatedAt: string;
}

// --- 사이트·조직 & 사용자 권한 ---------------------------------------------

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  /** master_admin: 다른 관리자 계정과 페이지별 권한을 관리할 수 있는 최상위 역할. */
  role: "master_admin" | "super_admin" | "team_leader" | "site_owner";
  status: "pending" | "approved" | "rejected";
  allowedCategorySlugs?: ServiceCategorySlug[];
  /** 접근 허용된 관리자 페이지 경로(예: "/admin/keywords"). 비어있으면 기존과 동일하게
   *  제한 없이 전체 허용(단, /admin/users는 master_admin 전용으로 항상 별도 처리). */
  allowedAdminPages?: string[];
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

/**
 * 카테고리(메인사이트) 단위 분양 현황. 지금 당장 분양 기능을 다 쓰지는 않아도,
 * 나중에 특정 공정 카테고리를 실제 팀·업체에 분양할 때 이 구조를 그대로 쓸 수 있도록
 * 미리 마련해 둔다 (PRD 9장 분양사이트 정책).
 */
export interface SiteFranchise {
  categorySlug: ServiceCategorySlug;
  status: "unsold" | "reserved" | "sold";
  /** 분양받은 팀장·업체 계정 (User.id, role: site_owner 또는 team_leader) */
  ownerUserId?: string;
  /** 분양 후 실제로 이전된 커스텀 도메인. 비어있으면 아직 대표 도메인 하위 경로로 운영 중. */
  customDomain?: string;
  soldAt?: string;
  notes?: string;
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
