import { z } from 'zod';

export const caseImageSchema = z.object({
  id: z.string(),
  file: z.any(), // File object in browser, string url later
  previewUrl: z.string(),
  must_use: z.boolean(),
  is_private: z.boolean(),
  role: z.enum(['BEFORE', 'PROCESS', 'AFTER', 'MATERIAL', 'TOOL', 'DETAIL', 'EXCLUDE']),
  pHash: z.string().optional(),
});

export const caseInputSchema = z.object({
  // 1. 기본정보
  area_sido: z.string().min(1, "시/도를 선택하세요"),
  area_sigungu: z.string().min(1, "시/군/구를 선택하세요"),
  area_dong: z.string().optional(),
  building_type: z.string().min(1, "건물 유형을 선택하세요"),
  space: z.string().min(1, "공간을 선택하세요"),
  target: z.string().min(1, "대상을 선택하세요"),

  // 2. 현장내용
  problem: z.string().min(1, "문제를 입력하세요"),
  judgement: z.string().min(1, "판단 근거를 입력하세요"),
  work_steps: z.string().min(1, "실제 작업 순서를 입력하세요"),
  result: z.string().min(1, "작업 결과를 입력하세요"),
  limit_note: z.string().optional(),

  // 3. 사진
  images: z.array(caseImageSchema).max(30, "사진은 최대 30장까지 업로드 가능합니다."),

  // 4. 추가정보
  cause: z.string().optional(),
  materials: z.string().optional(),
  tools: z.string().optional(),
  situation: z.string().optional(),
  maintenance: z.string().optional(),
  duration_note: z.string().optional(),
  safety_flags: z.array(z.string()).optional(),
});

export type CaseInputForm = z.infer<typeof caseInputSchema>;
export type CaseImage = z.infer<typeof caseImageSchema>;
