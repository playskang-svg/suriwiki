import {
  CompanyProfile,
  ContactDistribution,
  KeywordPage,
  User,
  SiteImage,
  CategoryCase,
  SiteFranchise,
} from "@/lib/types";

export interface ConsultationLead {
  id: string;
  categorySlug: string;
  regionSlug: string;
  customerName: string;
  customerPhone: string;
  content: string;
  imageUrl?: string;
  submittedAt: string;
  status: "new" | "contacted" | "completed" | "cancelled";
  utmSource?: string;
}

export interface DatabaseSchema {
  users: User[];
  companyProfiles: CompanyProfile[];
  contactDistributions: ContactDistribution[];
  consultationLeads: ConsultationLead[];
  keywordPages: KeywordPage[];
  siteImages: SiteImage[];
  categoryCases: CategoryCase[];
  siteFranchises: SiteFranchise[];
}

export function loadDatabase(defaultData: DatabaseSchema): DatabaseSchema {
  if (typeof window !== "undefined") {
    return defaultData;
  }

  try {
    // Use eval require so Webpack client bundler never tries to resolve Node 'fs' module
    const req = eval("require");
    const fs = req("fs");
    const path = req("path");

    const dataDir = path.join(process.cwd(), "data");
    const dbFile = path.join(dataDir, "db.json");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dbFile)) {
      fs.writeFileSync(dbFile, JSON.stringify(defaultData, null, 2), "utf-8");
      return defaultData;
    }

    const raw = fs.readFileSync(dbFile, "utf-8");
    const parsed = JSON.parse(raw);

    if (!parsed.users || !Array.isArray(parsed.users)) {
      parsed.users = defaultData.users;
    }

    if (!parsed.siteImages || !Array.isArray(parsed.siteImages)) {
      parsed.siteImages = defaultData.siteImages;
    }

    if (!parsed.categoryCases || !Array.isArray(parsed.categoryCases)) {
      parsed.categoryCases = defaultData.categoryCases;
    }

    if (!parsed.siteFranchises || !Array.isArray(parsed.siteFranchises)) {
      parsed.siteFranchises = defaultData.siteFranchises;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load database file:", error);
    return defaultData;
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  if (typeof window !== "undefined") {
    return;
  }

  try {
    const req = eval("require");
    const fs = req("fs");
    const path = req("path");

    const dataDir = path.join(process.cwd(), "data");
    const dbFile = path.join(dataDir, "db.json");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save database file:", error);
  }
}
