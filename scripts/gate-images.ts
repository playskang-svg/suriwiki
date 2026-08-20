import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Missing Supabase credentials. Skipping DB image gate check.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const FORBIDDEN_DOMAIN = 'lh3.googleusercontent.com';

async function checkLocalFiles() {
  const dirsToScan = ['app', 'components', 'config', 'lib'];
  let found = false;

  const scanDir = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(FORBIDDEN_DOMAIN)) {
          console.error(`❌ 하드코딩된 이미지 발견 (${FORBIDDEN_DOMAIN}) in ${fullPath}`);
          found = true;
        }
      }
    }
  };

  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) scanDir(dir);
  }
  return found;
}

async function checkDatabase() {
  let found = false;
  
  // Check pages
  const { data: pages, error: err1 } = await supabase.from('pages').select('*');
  if (err1) {
    console.error('❌ Failed to fetch pages:', err1);
    return true;
  }
  if (pages) {
    for (const page of pages) {
      if (JSON.stringify(page).includes(FORBIDDEN_DOMAIN)) {
        console.error(`❌ DB 하드코딩된 이미지 발견 (${FORBIDDEN_DOMAIN}) in pages id: ${page.id}`);
        found = true;
      }
    }
  }

  // Check page_modules
  const { data: modules, error: err2 } = await supabase.from('page_modules').select('*');
  if (err2) {
    console.error('❌ Failed to fetch page_modules:', err2);
    return true;
  }
  if (modules) {
    for (const mod of modules) {
      if (JSON.stringify(mod).includes(FORBIDDEN_DOMAIN)) {
        console.error(`❌ DB 하드코딩된 이미지 발견 (${FORBIDDEN_DOMAIN}) in page_modules page_id: ${mod.page_id}`);
        found = true;
      }
    }
  }

  return found;
}

async function main() {
  let hasError = false;

  console.log('🔍 Checking local files for hardcoded images...');
  if (await checkLocalFiles()) hasError = true;

  console.log('🔍 Checking database for hardcoded images...');
  if (await checkDatabase()) hasError = true;

  if (hasError) {
    console.error(`\n🚨 빌드 실패: ${FORBIDDEN_DOMAIN} 주소가 포함된 하드코딩된 이미지가 발견되었습니다.`);
    process.exit(1);
  } else {
    console.log(`✅ 이미지 검증 통과: ${FORBIDDEN_DOMAIN} 주소가 없습니다.`);
    process.exit(0);
  }
}

main();
