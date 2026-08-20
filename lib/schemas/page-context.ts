import { z } from 'zod';

export const pageContextSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  meta_description: z.string().optional(),
  page_type: z.string().optional(),
  content_type: z.string().optional(),
  search_intent: z.string().optional(),
  keyword_node: z.object({
    area_slug: z.string().optional(),
  }).passthrough().optional(),
  case: z.object({
    problem: z.string().optional(),
    judgement: z.string().optional(),
    work_steps: z.array(z.object({
        order: z.number(),
        title: z.string(),
        note: z.string().optional()
    })).optional(),
    result: z.string().optional(),
    cause: z.string().optional(),
    cause_observed: z.boolean().optional(),
    materials: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    safety_flags: z.array(z.string()).optional(),
    area: z.object({
        slug: z.string().optional(),
        sigungu: z.string().optional(),
    }).passthrough().optional(),
  }).passthrough().optional(),
  required_modules: z.array(z.string()).optional(),
  module_order: z.array(z.string()).optional(),
  internal_links: z.array(z.string()).optional(),
  m14: z.object({
    amounts: z.array(z.any()).optional(),
    disclaimer: z.string().optional(),
  }).passthrough().optional(),
  image_variants: z.array(z.object({
      id: z.string(),
      image_id: z.string(),
      overlays: z.any().optional(),
  })).optional(),
  image_set: z.array(z.string()).optional(),
  m08: z.object({
    steps: z.array(z.any()).optional(),
  }).passthrough().optional(),
  m11: z.any().optional(),
  m12: z.any().optional(),
  m18: z.any().optional(),
  m13: z.object({
    items: z.array(z.any()).optional(),
  }).passthrough().optional(),
  m21: z.object({
    items: z.array(z.any()).optional(),
  }).passthrough().optional(),
  m24: z.object({
    cases: z.array(z.any()).optional(),
  }).passthrough().optional(),
  all_cases: z.array(z.any()).optional(),
  all_areas: z.array(z.any()).optional(),
  siteConfig: z.object({
    stats: z.array(z.any()).optional(),
    certifications: z.array(z.string()).optional(),
  }).passthrough().optional(),
  dedupe_key: z.string().optional(),
  html_body: z.string().optional(),
  json_ld: z.string().optional(),
  cta_rotation_key: z.string().optional(),
  has_parent_link: z.boolean().optional(),
}).passthrough();

export type PageContext = z.infer<typeof pageContextSchema>;
