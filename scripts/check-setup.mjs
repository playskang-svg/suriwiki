import fs from "fs";
import path from "path";

console.log("\n==================================================");
console.log("🔍 수리위키(suriwiki) v2.3 론칭 환경 진단 점검도구");
console.log("==================================================\n");

const root = process.cwd();

// 1. Data DB File Check
const dbFile = path.join(root, "data", "db.json");
if (fs.existsSync(dbFile)) {
  const stats = fs.statSync(dbFile);
  console.log(`✅ [Local DB File]   'data/db.json' 정상 존재 (${stats.size} bytes)`);
} else {
  console.log("⚠️  [Local DB File]   'data/db.json'이 없습니다. 최초 실행 시 자동 생성됩니다.");
}

// 2. Uploads Directory Check
const uploadsDir = path.join(root, "public", "uploads");
if (fs.existsSync(uploadsDir)) {
  console.log(`✅ [Upload Storage]  'public/uploads/' 디렉터리 준비 완료`);
} else {
  console.log("⚠️  [Upload Storage]  'public/uploads/' 디렉터리가 업로드 시 자동 생성됩니다.");
}

// 3. Supabase Environment Variables Check
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (url && key) {
  console.log(`✅ [Supabase Cloud]  클라우드 DB 연동 환경변수 감지됨 (${url})`);
} else {
  console.log(`ℹ️  [Supabase Cloud]  Supabase 환경변수 미설정 (현재 안전한 파일 DB 모드로 작동 중)`);
  console.log(`    -> 실서버 배포 시 Vercel 환경변수에 NEXT_PUBLIC_SUPABASE_URL을 설정하세요.`);
}

// 4. Schema & Guide Files Check
const schemaFile = path.join(root, "supabase", "schema.sql");
const deployDoc = path.join(root, "docs", "DEPLOYMENT.md");
const seoDoc = path.join(root, "docs", "SEO_SUBMISSION.md");

if (fs.existsSync(schemaFile) && fs.existsSync(deployDoc) && fs.existsSync(seoDoc)) {
  console.log(`✅ [Docs & SQL]      'schema.sql', 'DEPLOYMENT.md', 'SEO_SUBMISSION.md' 가이드 준비 완료`);
}

console.log("\n--------------------------------------------------");
console.log("🚀 검사 완료: 'npm run build'로 정적/동적 라우트 검증이 가능합니다.");
console.log("==================================================\n");
