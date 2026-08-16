-- ============================================================================
-- 수리위키(suriwiki) v2.3 Supabase PostgreSQL Database Schema
-- ============================================================================

-- 1. Company Profiles Table (회사/팀 프로필)
CREATE TABLE IF NOT EXISTS company_profiles (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  representative_name TEXT,
  business_registration_no TEXT,
  phone_number TEXT NOT NULL,
  operating_hours TEXT,
  service_regions TEXT[] DEFAULT '{}',
  prep_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Contact Distribution Rules Table (노출 대상 배포 규칙)
CREATE TABLE IF NOT EXISTS contact_distributions (
  id TEXT PRIMARY KEY,
  company_profile_id TEXT NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('site', 'page')),
  target_site_id TEXT,
  target_page_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Consultation Leads Table (1:1 고객 상담 신청 내역)
CREATE TABLE IF NOT EXISTS consultation_leads (
  id TEXT PRIMARY KEY,
  category_slug TEXT NOT NULL,
  region_slug TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'completed', 'cancelled')),
  utm_source TEXT DEFAULT 'direct',
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Keyword Pages Table (964개 세부 키워드 페이지 현황)
CREATE TABLE IF NOT EXISTS keyword_pages (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  region_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  consult_page_id TEXT,
  last_modified DATE DEFAULT CURRENT_DATE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_dist_site ON contact_distributions(target_site_id);
CREATE INDEX IF NOT EXISTS idx_contact_dist_page ON contact_distributions(target_page_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON consultation_leads(status);
CREATE INDEX IF NOT EXISTS idx_keyword_pages_slugs ON keyword_pages(category_slug, region_slug);

-- Enable Row Level Security (RLS)
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_pages ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Allow public read access for profiles" ON company_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read access for distributions" ON contact_distributions FOR SELECT USING (true);
CREATE POLICY "Allow public read access for keyword_pages" ON keyword_pages FOR SELECT USING (true);
CREATE POLICY "Allow public insert for consultation leads" ON consultation_leads FOR INSERT WITH CHECK (true);

-- Admin Full Access Policy (Service Role)
CREATE POLICY "Allow full access for service role" ON company_profiles FOR ALL USING (true);
CREATE POLICY "Allow full access for service role distributions" ON contact_distributions FOR ALL USING (true);
CREATE POLICY "Allow full access for service role leads" ON consultation_leads FOR ALL USING (true);

-- Storage Bucket Setup for Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('suriwiki-uploads', 'suriwiki-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access on Uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'suriwiki-uploads');

CREATE POLICY "Public Upload Access on Uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'suriwiki-uploads');
