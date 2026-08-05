import {
  Site,
  ServiceCategorySlug,
  KeywordPage,
  CompanyProfile,
  ContactDistribution,
  DashboardKpi,
  NaverRankInfo,
  KeywordSuggestion,
  User,
  SiteImage,
} from "./types";
import { loadDatabase, saveDatabase, ConsultationLead } from "./db";

export interface CategoryInfo {
  slug: ServiceCategorySlug;
  name: string;
  domain: string;
  teamLeader: string;
  activeCount: number;
}

export type { ConsultationLead, KeywordSuggestion, NaverRankInfo, User, SiteImage };

export const MAIN_CATEGORIES: CategoryInfo[] = [
  { slug: "moon-suri", name: "문수리", domain: "doorsuri.koreajipsurimaster.com", teamLeader: "김문수 팀장", activeCount: 42 },
  { slug: "moontle-suri", name: "문틀수리", domain: "moontlesuri.com", teamLeader: "이문틀 팀장", activeCount: 38 },
  { slug: "moontle-gyoche", name: "문틀교체", domain: "moontlegyoche.com", teamLeader: "박교체 팀장", activeCount: 29 },
  { slug: "namu-moon-suri", name: "나무문수리", domain: "namumoon.com", teamLeader: "김목수 팀장", activeCount: 31 },
  { slug: "maru-bokwon", name: "마루복원", domain: "marubokwon.com", teamLeader: "정마루 팀장", activeCount: 45 },
  { slug: "gangmaru-bosu", name: "강마루보수", domain: "gangmaru.com", teamLeader: "최강마루 팀장", activeCount: 36 },
  { slug: "film-sigong", name: "필름시공", domain: "filmsigong.com", teamLeader: "한필름 팀장", activeCount: 50 },
  { slug: "moon-film-sigong", name: "문필름시공", domain: "moonfilm.com", teamLeader: "윤문필름 팀장", activeCount: 40 },
  { slug: "bangmun-film-sigong", name: "방문필름시공", domain: "bangmunfilm.com", teamLeader: "임방문 팀장", activeCount: 33 },
  { slug: "bubun-film-jakeop", name: "부분필름작업", domain: "bubunfilm.com", teamLeader: "송부분 팀장", activeCount: 27 },
  { slug: "gyedan-suri", name: "계단수리", domain: "gyedansuri.com", teamLeader: "강계단 팀장", activeCount: 22 },
  { slug: "gyedan-bokwon", name: "계단복원", domain: "gyedanbokwon.com", teamLeader: "오복원 팀장", activeCount: 19 },
  { slug: "namu-gyedan-suri", name: "나무계단수리", domain: "namugyedan.com", teamLeader: "조나무 팀장", activeCount: 24 },
  { slug: "bokcheung-gyedan-bokwon", name: "복층계단복원", domain: "bokcheunggyedan.com", teamLeader: "신복층 팀장", activeCount: 18 },
  { slug: "moonjibang-suri", name: "문지방수리", domain: "moonjibang.com", teamLeader: "권지방 팀장", activeCount: 35 },
  { slug: "moonteok-suri", name: "문턱수리", domain: "moonteok.com", teamLeader: "황문턱 팀장", activeCount: 30 },
  { slug: "kkaejin-moon-suri", name: "깨진문수리", domain: "kkaejinmoon.com", teamLeader: "안깨진 팀장", activeCount: 41 },
  { slug: "byeokji-bokwon", name: "벽지복원", domain: "byeokjibokwon.com", teamLeader: "장벽지 TF", activeCount: 48 },
  { slug: "bubun-dobae", name: "부분도배", domain: "bubundobae.com", teamLeader: "유도배 팀장", activeCount: 52 },
  { slug: "bosu-dobae", name: "보수도배", domain: "bosudobae.com", teamLeader: "서보수 팀장", activeCount: 44 },
  { slug: "dobae-bokwon", name: "도배복원", domain: "dobaebokwon.com", teamLeader: "도복원 팀장", activeCount: 37 },
  { slug: "bangmun-bokwon", name: "방문복원", domain: "bangmunbokwon.com", teamLeader: "방복원 팀장", activeCount: 43 },
];

export const REGIONS_DATA = [
  { slug: "gangnam", name: "강남구", parentRegionSlug: "seoul" },
  { slug: "seocho", name: "서초구", parentRegionSlug: "seoul" },
  { slug: "songpa", name: "송파구", parentRegionSlug: "seoul" },
  { slug: "mapo", name: "마포구", parentRegionSlug: "seoul" },
  { slug: "bundang", name: "성남 분당구", parentRegionSlug: "gyeonggi" },
  { slug: "suwon", name: "수원시", parentRegionSlug: "gyeonggi" },
  { slug: "gunpo", name: "군포시", parentRegionSlug: "gyeonggi" },
  { slug: "incheon-namdong", name: "인천 남동구", parentRegionSlug: "incheon" },
];

export function generateDefaultBodyContent(catName: string, regName: string): string {
  return `${regName} 지역 전문 ${catName} 출장 복원 서비스 안내입니다.\n\n` +
    `1. 현장 주요 문제점 및 원인 분석:\n` +
    `${regName} 지역 주거 및 상가 공간에서 빈번히 발생하는 ${catName} 관련 파손, 부식, 마모 문제를 정밀하게 진단합니다. 습기로 인한 하단 부풀음, 충격으로 인한 겉면 파손, 열화 현상으로 인한 변색 등 다양한 결함을 전면 교체 없이 고품질로 복원해드립니다.\n\n` +
    `2. 표준 작업 공정 및 솔루션:\n` +
    `- 1단계: 파손 부위 단차 제거 및 1차 샌딩 작업\n` +
    `- 2단계: 특수 충전재 및 퍼티를 이용한 기조 평탄화 성형\n` +
    `- 3단계: 0.1mm 단위 미세 정밀 샌딩 및 유해 물질 클리닝\n` +
    `- 4단계: 현장 인테리어 자재와 99.9% 매칭되는 전용 필름/마감재 피복 시공\n\n` +
    `3. 수리위키만의 3대 약속:\n` +
    `① 교체 대비 최대 70% 비용 절감 효과\n` +
    `② 당일 1~3시간 이내 시공 및 당일 즉시 정상 사용 가능\n` +
    `③ 시공 완료일로부터 1년 무상 품질 A/S 보증서 발급`;
}

// Initial Site Section Images (with watermarks)
const initialSiteImages: SiteImage[] = [
  {
    id: "img_hero_main",
    section: "hero",
    title: "메인 히어로 전문가 복원 현장 배너",
    url: "/korean_technician_hero.png",
    alt: "수리위키 출장복원 대표 이미지",
    isWatermarked: true,
    updatedAt: "2026-08-05",
  },
  {
    id: "img_showcase_before_1",
    section: "showcase",
    title: "문틀 습기 부식 파손 (BEFORE)",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
    alt: "문틀 파손 전 예시 이미지",
    isWatermarked: true,
    updatedAt: "2026-08-05",
  },
  {
    id: "img_showcase_after_1",
    section: "showcase",
    title: "문틀 정밀 퍼티 & 필름 복원 (AFTER)",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    alt: "문틀 복원 후 예시 이미지",
    isWatermarked: true,
    updatedAt: "2026-08-05",
  },
  {
    id: "img_showcase_before_2",
    section: "showcase",
    title: "강마루 파손 및 찍힘 (BEFORE)",
    url: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80",
    alt: "마루 파손 전 예시 이미지",
    isWatermarked: true,
    updatedAt: "2026-08-05",
  },
  {
    id: "img_showcase_after_2",
    section: "showcase",
    title: "강마루 결맞춤 복원 완료 (AFTER)",
    url: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=600&q=80",
    alt: "마루 복원 후 예시 이미지",
    isWatermarked: true,
    updatedAt: "2026-08-05",
  },
];

const initialUsers: User[] = [
  {
    id: "usr_admin",
    username: "admin",
    password: "admin123",
    name: "최고 관리자 (HQ)",
    role: "super_admin",
    status: "approved",
    createdAt: "2026-08-01 00:00:00",
  },
  {
    id: "usr_team1",
    username: "team1",
    password: "team123",
    name: "강남/서초 문수리 팀장",
    role: "team_leader",
    status: "approved",
    allowedCategorySlugs: ["moon-suri", "moontle-suri"],
    createdAt: "2026-08-03 10:00:00",
  },
];

const initialProfiles: CompanyProfile[] = [
  {
    id: "cp_default",
    teamId: "team_hq",
    companyName: "수리위키 마스터 본사",
    representativeName: "홍길동",
    businessRegistrationNo: "124-88-00123",
    phoneNumber: "1588-0000",
    operatingHours: "평일 08:00 ~ 20:00 (토요일 09:00 ~ 17:00, 일요일/공휴일 휴무)",
    serviceRegions: ["서울 전지역", "경기 전체", "인천 광역시"],
    prepInstructions: "시공 부위의 전체 모습과 파손 파트를 가깝게 2장 이상 촬영하여 문자로 보내주시면 5분 내 정확한 견적을 산출해 드립니다.",
  },
];

const initialDistributions: ContactDistribution[] = [
  {
    id: "dist_default",
    companyProfileId: "cp_default",
    scope: "site",
  },
];

const initialLeads: ConsultationLead[] = [
  {
    id: "lead_001",
    categorySlug: "moon-suri",
    regionSlug: "gangnam",
    customerName: "박성호",
    customerPhone: "010-1234-5678",
    content: "아파트 방문 하단이 습기로 썩어서 겉면이 떨어졌습니다. 복원 시공 문의합니다.",
    submittedAt: "2026-08-05 14:20:11",
    status: "new",
    utmSource: "naver_search",
  },
];

function generateInitialNaverRank(catSlug: string, regSlug: string): NaverRankInfo {
  let currentRank = 0;
  let previousRank = 0;
  let naverStatus: NaverRankInfo["naverStatus"] = "unindexed";

  if (regSlug === "gangnam") {
    currentRank = catSlug === "moon-suri" ? 1 : catSlug === "moontle-suri" ? 2 : 3;
    previousRank = currentRank + 1;
    naverStatus = "top1";
  } else if (regSlug === "gunpo" || regSlug === "seocho") {
    currentRank = catSlug === "moon-suri" ? 2 : 4;
    previousRank = currentRank - 1;
    naverStatus = "top5";
  } else {
    currentRank = 14;
    previousRank = 18;
    naverStatus = "indexed";
  }

  return {
    currentRank,
    previousRank,
    rankDelta: previousRank - currentRank,
    naverStatus,
    lastChecked: "2026-08-05 19:00",
    pcSearchVolume: Math.floor(Math.random() * 1200) + 400,
    mobileSearchVolume: Math.floor(Math.random() * 3500) + 1200,
  };
}

const initialKeywordPages: KeywordPage[] = MAIN_CATEGORIES.flatMap((cat) =>
  REGIONS_DATA.map((reg) => ({
    id: `page_${cat.slug}_${reg.slug}`,
    siteId: cat.slug,
    categorySlug: cat.slug,
    regionSlug: reg.slug,
    title: `${reg.name} ${cat.name} 전문 시공 및 복원`,
    bodyContent: generateDefaultBodyContent(cat.name, reg.name),
    status: (reg.slug === "gangnam" || reg.slug === "gunpo" || reg.slug === "seocho" ? "published" : "draft") as KeywordPage["status"],
    consultPageId: `consult_${cat.slug}_${reg.slug}`,
    lastModified: "2026-08-05",
    naverRank: generateInitialNaverRank(cat.slug, reg.slug),
  }))
);

export const INITIAL_KEYWORD_SUGGESTIONS: KeywordSuggestion[] = [
  {
    id: "sug_001",
    categorySlug: "moontle-suri",
    regionSlug: "gangnam",
    suggestedKeyword: "강남구 아파트 썩은 문틀 부분 복원",
    monthlySearchVolume: 4200,
    competitionLevel: "low",
    potentialRevenue: "높음 (월 15건+ 예상)",
    reason: "강남 지역 10년 이상 아파트 습기 부식 검색량 급증. 경쟁 사이트 미비.",
  },
];

const db = loadDatabase({
  users: initialUsers,
  companyProfiles: initialProfiles,
  contactDistributions: initialDistributions,
  consultationLeads: initialLeads,
  keywordPages: initialKeywordPages,
  siteImages: initialSiteImages,
});

function sync() {
  saveDatabase(db);
}

// Section Image Manager Methods
export function getSiteImages(): SiteImage[] {
  return db.siteImages;
}

export function updateSiteImage(id: string, updates: Partial<SiteImage>): SiteImage | null {
  const index = db.siteImages.findIndex((img) => img.id === id);
  if (index === -1) return null;
  db.siteImages[index] = {
    ...db.siteImages[index],
    ...updates,
    updatedAt: new Date().toISOString().substring(0, 10),
  };
  sync();
  return db.siteImages[index];
}

export function deleteSiteImage(id: string): boolean {
  db.siteImages = db.siteImages.filter((img) => img.id !== id);
  sync();
  return true;
}

export function addSiteImage(img: Omit<SiteImage, "id" | "updatedAt">): SiteImage {
  const newImg: SiteImage = {
    ...img,
    id: `img_${Date.now()}`,
    updatedAt: new Date().toISOString().substring(0, 10),
  };
  db.siteImages.push(newImg);
  sync();
  return newImg;
}

// User CRUD & RBAC Methods
export function getUsers(): User[] {
  return db.users;
}

export function getUserByUsername(username: string): User | undefined {
  return db.users.find((u) => u.username === username);
}

export function signUpUser(
  user: Omit<User, "id" | "status" | "createdAt">
): { success: boolean; message?: string; user?: User } {
  const existing = getUserByUsername(user.username);
  if (existing) {
    return { success: false, message: "이미 존재하는 아이디입니다." };
  }

  const newUser: User = {
    ...user,
    id: `usr_${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
  };

  db.users.push(newUser);
  sync();
  return { success: true, user: newUser };
}

export function updateUserStatus(id: string, status: User["status"]): boolean {
  const user = db.users.find((u) => u.id === id);
  if (user) {
    user.status = status;
    sync();
    return true;
  }
  return false;
}

export function updateUserPermissions(
  id: string,
  allowedCategorySlugs: ServiceCategorySlug[],
  role?: User["role"]
): boolean {
  const user = db.users.find((u) => u.id === id);
  if (user) {
    user.allowedCategorySlugs = allowedCategorySlugs;
    if (role) user.role = role;
    sync();
    return true;
  }
  return false;
}

// Company Profile & Distribution Engine
export function getDistributedCompanyProfile(
  categorySlug?: string,
  regionSlug?: string
): CompanyProfile {
  const targetPageKey = categorySlug && regionSlug ? `${categorySlug}/${regionSlug}` : undefined;

  if (targetPageKey) {
    const pageDist = db.contactDistributions.find(
      (d) => d.scope === "page" && d.targetPageId === targetPageKey
    );
    if (pageDist) {
      const profile = db.companyProfiles.find((p) => p.id === pageDist.companyProfileId);
      if (profile) return profile;
    }
  }

  if (categorySlug) {
    const siteDist = db.contactDistributions.find(
      (d) => d.scope === "site" && d.targetSiteId === categorySlug
    );
    if (siteDist) {
      const profile = db.companyProfiles.find((p) => p.id === siteDist.companyProfileId);
      if (profile) return profile;
    }
  }

  const defaultDist = db.contactDistributions.find((d) => !d.targetSiteId && !d.targetPageId);
  if (defaultDist) {
    const profile = db.companyProfiles.find((p) => p.id === defaultDist.companyProfileId);
    if (profile) return profile;
  }

  return db.companyProfiles[0] || initialProfiles[0];
}

export function getCompanyProfiles(): CompanyProfile[] {
  return db.companyProfiles;
}

export function addCompanyProfile(profile: Omit<CompanyProfile, "id">): CompanyProfile {
  const newProfile: CompanyProfile = {
    ...profile,
    id: `cp_${Date.now()}`,
  };
  db.companyProfiles.push(newProfile);
  sync();
  return newProfile;
}

export function updateCompanyProfile(id: string, profile: Partial<CompanyProfile>): CompanyProfile | null {
  const index = db.companyProfiles.findIndex((p) => p.id === id);
  if (index === -1) return null;
  db.companyProfiles[index] = { ...db.companyProfiles[index], ...profile };
  sync();
  return db.companyProfiles[index];
}

export function deleteCompanyProfile(id: string): boolean {
  if (id === "cp_default") return false;
  db.companyProfiles = db.companyProfiles.filter((p) => p.id !== id);
  db.contactDistributions = db.contactDistributions.filter((d) => d.companyProfileId !== id);
  sync();
  return true;
}

export function getContactDistributions(): ContactDistribution[] {
  return db.contactDistributions;
}

export function setContactDistribution(dist: Omit<ContactDistribution, "id">): ContactDistribution {
  const existingIndex = db.contactDistributions.findIndex(
    (d) =>
      d.scope === dist.scope &&
      d.targetSiteId === dist.targetSiteId &&
      d.targetPageId === dist.targetPageId
  );

  const newDist: ContactDistribution = {
    ...dist,
    id: existingIndex !== -1 ? db.contactDistributions[existingIndex].id : `dist_${Date.now()}`,
  };

  if (existingIndex !== -1) {
    db.contactDistributions[existingIndex] = newDist;
  } else {
    db.contactDistributions.push(newDist);
  }

  sync();
  return newDist;
}

export function deleteContactDistribution(id: string): boolean {
  db.contactDistributions = db.contactDistributions.filter((d) => d.id !== id);
  sync();
  return true;
}

export function getConsultationLeads(): ConsultationLead[] {
  return db.consultationLeads;
}

export function addConsultationLead(lead: Omit<ConsultationLead, "id" | "submittedAt" | "status">): ConsultationLead {
  const newLead: ConsultationLead = {
    ...lead,
    id: `lead_${Date.now()}`,
    submittedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
    status: "new",
  };
  db.consultationLeads.unshift(newLead);
  sync();
  return newLead;
}

export function updateConsultationStatus(id: string, status: ConsultationLead["status"]): boolean {
  const lead = db.consultationLeads.find((l) => l.id === id);
  if (lead) {
    lead.status = status;
    sync();
    return true;
  }
  return false;
}

export function getKeywordPages(): KeywordPage[] {
  return db.keywordPages;
}

export function getKeywordSuggestions(): KeywordSuggestion[] {
  return INITIAL_KEYWORD_SUGGESTIONS;
}

export function refreshNaverRankings(): KeywordPage[] {
  const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);
  db.keywordPages.forEach((p) => {
    if (p.naverRank) {
      const isTop = p.regionSlug === "gangnam" || p.regionSlug === "seocho" || p.regionSlug === "gunpo";
      p.naverRank.previousRank = p.naverRank.currentRank;
      p.naverRank.currentRank = isTop ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 8) + 4;
      p.naverRank.rankDelta = p.naverRank.previousRank - p.naverRank.currentRank;
      p.naverRank.lastChecked = nowStr;
      p.naverRank.naverStatus =
        p.naverRank.currentRank === 1
          ? "top1"
          : p.naverRank.currentRank <= 5
          ? "top5"
          : p.naverRank.currentRank <= 10
          ? "top10"
          : "indexed";
    }
  });
  sync();
  return db.keywordPages;
}

export function updateKeywordPageStatus(id: string, status: KeywordPage["status"]): boolean {
  const page = db.keywordPages.find((p) => p.id === id);
  if (page) {
    page.status = status;
    page.lastModified = new Date().toISOString().substring(0, 10);
    sync();
    return true;
  }
  return false;
}

export function updateKeywordPageContent(
  id: string,
  bodyContent: string,
  title?: string,
  status?: KeywordPage["status"]
): KeywordPage | null {
  const page = db.keywordPages.find((p) => p.id === id);
  if (page) {
    page.bodyContent = bodyContent;
    if (title) page.title = title;
    if (status) page.status = status;
    page.lastModified = new Date().toISOString().substring(0, 10);
    sync();
    return page;
  }
  return null;
}

export function getDashboardKpi(): DashboardKpi {
  const publishedCount = db.keywordPages.filter((p) => p.status === "published").length;
  const topRankCount = db.keywordPages.filter((p) => p.naverRank && p.naverRank.currentRank <= 3).length;
  const validKeywordCount = db.keywordPages.filter((p) => p.naverRank && p.naverRank.currentRank <= 10).length;

  return {
    siteCount: MAIN_CATEGORIES.length,
    siteCountDelta: 2,
    keywordPageCount: db.keywordPages.length,
    keywordPageCountDelta: 48,
    totalItemCount: publishedCount,
    totalItemCountDelta: 12,
    naverValidKeywordCount: validKeywordCount,
    naverValidKeywordCountDelta: 8,
    naverTopRankKeywordCount: topRankCount,
    newKeywordThisWeekCount: 24,
  };
}
