import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Database } from '../lib/types/db';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

const BUCKET = 'cases-private';

interface CaseData {
  slug: string;
  space: string;
  target: string;
  problem_id: string;
  problem: string;
  cause: string;
  cause_observed: boolean;
  judgement: string;
  work_steps: any[];
  result: string;
  materials: string[];
  tools: string[];
  status: string;
}

const cases: Record<string, CaseData> = {
  '샘플이미지1': {
    slug: 'pigeon-sample-1', space: 'veranda', target: 'outdoor_unit', problem_id: 'pigeon',
    problem: '실외기실 타공 그릴 개구부로 비둘기가 드나들어 배설물이 쌓임', cause: '개구부에 방조망이 없어 새가 유입됨', cause_observed: true,
    judgement: '개구부 전체에 프레임 고정형 방조망 설치', work_steps: [{ order: 1, title: '배설물 청소' }, { order: 2, title: '방조망 설치' }],
    result: '비둘기 유입 완전 차단', materials: ['방조망', '프레임'], tools: [], status: 'approved'
  },
  '샘플이미지2': {
    slug: 'pigeon-sample-2', space: 'veranda', target: 'outdoor_unit', problem_id: 'pigeon',
    problem: '실외기실 타공 그릴 개구부로 비둘기가 드나들어 배설물이 쌓임', cause: '개구부에 방조망이 없어 새가 유입됨', cause_observed: true,
    judgement: '개구부 전체에 프레임 고정형 방조망 설치', work_steps: [{ order: 1, title: '배설물 청소' }, { order: 2, title: '방조망 설치' }],
    result: '비둘기 유입 완전 차단', materials: ['방조망', '프레임'], tools: [], status: 'approved'
  },
  '샘플이미지3': {
    slug: 'pigeon-sample-3', space: 'veranda', target: 'outdoor_unit', problem_id: 'pigeon',
    problem: '실외기실 타공 그릴 개구부로 비둘기가 드나들어 배설물이 쌓임', cause: '개구부에 방조망이 없어 새가 유입됨', cause_observed: true,
    judgement: '개구부 전체에 프레임 고정형 방조망 설치', work_steps: [{ order: 1, title: '배설물 청소' }, { order: 2, title: '방조망 설치' }],
    result: '비둘기 유입 완전 차단', materials: ['방조망', '프레임'], tools: [], status: 'approved'
  },
  '샘플이미지4': {
    slug: 'pigeon-sample-4', space: 'veranda', target: 'outdoor_unit', problem_id: 'pigeon',
    problem: '실외기실 타공 그릴 개구부로 비둘기가 드나들어 배설물이 쌓임', cause: '개구부에 방조망이 없어 새가 유입됨', cause_observed: true,
    judgement: '개구부 전체에 프레임 고정형 방조망 설치', work_steps: [{ order: 1, title: '배설물 청소' }, { order: 2, title: '방조망 설치' }],
    result: '비둘기 유입 완전 차단', materials: ['방조망', '프레임'], tools: [], status: 'approved'
  },
  '샘플이미지5': {
    slug: 'pigeon-sample-5', space: 'veranda', target: 'outdoor_unit', problem_id: 'pigeon',
    problem: '실외기실 타공 그릴 개구부로 비둘기가 드나들어 배설물이 쌓임', cause: '개구부에 방조망이 없어 새가 유입됨', cause_observed: true,
    judgement: '개구부 전체에 프레임 고정형 방조망 설치', work_steps: [{ order: 1, title: '배설물 청소' }, { order: 2, title: '방조망 설치' }],
    result: '비둘기 유입 완전 차단', materials: ['방조망', '프레임'], tools: [], status: 'approved'
  },
  '욕조트랩 샘플이미지': {
    slug: 'bath-trap-1', space: 'bath', target: 'drain', problem_id: 'trap',
    problem: '욕조 배수 트랩이 빠져 배수가 불가능함', cause: '배수구 체결부 이탈', cause_observed: true,
    judgement: '점검구를 타공하여 새 트랩으로 교체', work_steps: [{ order: 1, title: '점검구 타공' }, { order: 2, title: '트랩 교체 및 고정' }],
    result: '배수 정상화', materials: ['욕조 트랩'], tools: ['홀소'], status: 'approved'
  }
};

async function main() {
  const dirs = [
    { base: 'design/비둘기 샘플이미지', subdirs: ['샘플이미지1', '샘플이미지2', '샘플이미지3', '샘플이미지4', '샘플이미지5'] },
    { base: 'design', subdirs: ['욕조트랩 샘플이미지'] }
  ];

  for (const dir of dirs) {
    for (const subdir of dir.subdirs) {
      const fullPath = path.join(dir.base, subdir);
      const files = fs.readdirSync(fullPath).filter(f => !f.startsWith('.'));
      const c = cases[subdir];

      console.log(`Processing ${c.slug}...`);

      // 1. Delete existing Case Images (to prevent duplicates on re-run)
      const { data: existingCase } = await supabase.from('cases').select('id').eq('slug', c.slug).single();
      if (existingCase) {
        await supabase.from('case_images').delete().eq('case_id', existingCase.id);
      }

      // 2. Insert or Update Case
      const { data: caseData, error: caseErr } = await supabase.from('cases').upsert({
        slug: c.slug,
        space: c.space,
        target: c.target,
        problem_id: c.problem_id,
        problem: c.problem,
        cause: c.cause,
        cause_observed: c.cause_observed,
        judgement: c.judgement,
        work_steps: c.work_steps,
        result: c.result,
        materials: c.materials,
        tools: c.tools,
        status: c.status as any,
        area_slug: null // explicitly null as per instructions
      }, { onConflict: 'slug' }).select('id').single();

      if (caseErr) {
        console.error(`Error inserting case ${c.slug}:`, caseErr);
        continue;
      }
      const caseId = caseData.id;

      // 3. Upload images and insert Case Images
      let sortOrder = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(fullPath, file);
        if (!fs.statSync(filePath).isFile()) continue; // Skip directories

        const fileData = fs.readFileSync(filePath);
        const ext = path.extname(file);
        
        // Generate a safe alphanumeric storage path
        const safeName = `img_${i}${ext}`;
        const storagePath = `${c.slug}/${Date.now()}-${safeName}`;

        const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(storagePath, fileData, {
          contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
          upsert: true
        });

        if (uploadErr) {
          console.error(`Error uploading ${file}:`, uploadErr);
          continue;
        }

        // Determine role and is_private based on our planned logic
        let role: any = 'PROCESS';
        let isPrivate = false;

        if (subdir === '샘플이미지1') {
          if (file.includes('002') || file.includes('005')) role = 'BEFORE';
          if (file.includes('48_006')) role = 'PROCESS';
          if (file.includes('54_006')) role = 'AFTER';
          if (file.includes('002')) isPrivate = true;
        } else if (subdir === '샘플이미지2') {
          if (file.includes('011')) role = 'BEFORE';
          if (file.includes('007')) role = 'AFTER';
        } else if (subdir === '샘플이미지3') {
          if (file.includes('004')) role = 'BEFORE';
          if (file.includes('014')) role = 'AFTER';
        } else if (subdir === '샘플이미지4') {
          if (file.includes('44-58_015')) role = 'BEFORE';
          if (file.includes('45-25_015')) role = 'PROCESS';
          if (file.includes('Resized')) role = 'AFTER';
        } else if (subdir === '샘플이미지5') {
          if (file.includes('003')) role = 'BEFORE';
          if (file.includes('017')) { role = 'AFTER'; isPrivate = true; }
        } else if (subdir === '욕조트랩 샘플이미지') {
          if (file.includes('타공1')) role = 'BEFORE';
          if (file.includes('타공6')) role = 'AFTER';
        }

        const { error: imgErr } = await supabase.from('case_images').insert({
          case_id: caseId,
          storage_path: storagePath,
          role: role,
          sort_order: sortOrder++,
          is_private: isPrivate,
          must_use: true
        });

        if (imgErr) {
          console.error(`Error inserting image ${file}:`, imgErr);
        } else {
            console.log(`Inserted image ${file} for ${c.slug} (Role: ${role}, Private: ${isPrivate})`);
        }
      }
    }
  }
}

main().catch(console.error);
