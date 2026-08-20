import { z } from "zod";

export const M01BodySchema = z.object({
  answer: z.string(),
  qualifier: z.string().optional(),
});
export type M01Body = z.infer<typeof M01BodySchema>;

export const M02BodySchema = z.object({
  problem: z.string(),
  judgement: z.string(),
  work: z.string(),
  result: z.string(),
});
export type M02Body = z.infer<typeof M02BodySchema>;

export const M03BodySchema = z.object({
  items: z.array(
    z.object({
      text: z.string(),
      detail: z.string().optional(),
    })
  ),
});
export type M03Body = z.infer<typeof M03BodySchema>;

export const M04BodySchema = z.object({
  steps: z.array(
    z.object({
      n: z.number(),
      text: z.string(),
    })
  ),
  observed: z.boolean(),
});
export type M04Body = z.infer<typeof M04BodySchema>;

export const M05BodySchema = z.object({
  grades: z.array(
    z.object({
      level: z.string(),
      desc: z.string(),
      action: z.string(),
    })
  ),
  case_grade: z.string(),
});
export type M05Body = z.infer<typeof M05BodySchema>;

export const M06BodySchema = z.object({
  observed: z.array(z.string()),
  conclusion: z.string(),
});
export type M06Body = z.infer<typeof M06BodySchema>;

export const M07BodySchema = z.object({
  repair_when: z.array(z.string()),
  replace_when: z.array(z.string()),
});
export type M07Body = z.infer<typeof M07BodySchema>;

export const M08BodySchema = z.object({
  steps: z.array(
    z.object({
      n: z.number(),
      title: z.string(),
      desc: z.string().optional(),
      image_variant_id: z.string().optional(),
    })
  ),
});
export type M08Body = z.infer<typeof M08BodySchema>;

export const M09BodySchema = z.object({
  items: z.array(
    z.object({
      icon: z.string(),
      title: z.string(),
      desc: z.string(),
    })
  ),
});
export type M09Body = z.infer<typeof M09BodySchema>;

export const M10BodySchema = z.object({
  prepare: z.array(z.string()),
  steps: z.array(
    z.object({
      n: z.number(),
      title: z.string(),
      desc: z.string(),
    })
  ),
  stop_if: z.array(z.string()),
});
export type M10Body = z.infer<typeof M10BodySchema>;

export const M11BodySchema = z.object({
  kind: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      features: z.string().optional(),
      use: z.string().optional(),
      limit: z.string().optional(),
    })
  ),
});
export type M11Body = z.infer<typeof M11BodySchema>;

export const M12BodySchema = M11BodySchema;
export type M12Body = M11Body;

export const M13BodySchema = z.object({
  axes: z.array(z.string()),
  items: z.array(
    z.object({
      name: z.string(),
      values: z.array(z.string()),
    })
  ),
  recommendation: z.string(),
});
export type M13Body = z.infer<typeof M13BodySchema>;

export const M14BodySchema = z.object({
  factors: z.array(
    z.object({
      name: z.string(),
      effect: z.string(),
    })
  ),
  disclaimer: z.string(),
  amounts: z.string().nullable(),
});
export type M14Body = z.infer<typeof M14BodySchema>;

export const M15BodySchema = z.object({
  items: z.array(
    z.object({
      text: z.string(),
    })
  ),
  safe: z.boolean(),
});
export type M15Body = z.infer<typeof M15BodySchema>;

export const M16BodySchema = z.object({
  level: z.string(),
  stop_conditions: z.array(z.string()),
  message: z.string(),
});
export type M16Body = z.infer<typeof M16BodySchema>;

export const M17BodySchema = z.object({
  items: z.array(
    z.object({
      text: z.string(),
    })
  ),
});
export type M17Body = z.infer<typeof M17BodySchema>;

export const M18BodySchema = z.object({
  improved: z.array(z.string()),
  limits: z.array(z.string()),
});
export type M18Body = z.infer<typeof M18BodySchema>;

export const M19BodySchema = z.object({
  case_id: z.string(),
  area_label: z.string(),
  one_line: z.string(),
  url: z.string(),
  thumb_variant_id: z.string().optional(),
});
export type M19Body = z.infer<typeof M19BodySchema>;

export const M20BodySchema = z.object({
  focus: z.string(),
  items: z.array(
    z.object({
      image_variant_id: z.string(),
      role: z.string(),
      caption: z.string(),
    })
  ),
  compare: z.object({
    before: z.string(),
    after: z.string(),
  }).optional(),
});
export type M20Body = z.infer<typeof M20BodySchema>;

export const M21BodySchema = z.object({
  items: z.array(
    z.object({
      q: z.string(),
      a: z.string(),
    })
  ),
});
export type M21Body = z.infer<typeof M21BodySchema>;

export const M22BodySchema = z.object({
  items: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      relation: z.string(),
    })
  ),
});
export type M22Body = z.infer<typeof M22BodySchema>;

export const M23BodySchema = z.object({
  area_slug: z.string(),
  area_label: z.string(),
  case_count: z.number(),
  cases: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      thumb: z.string().optional(),
    })
  ),
  coverage_note: z.string(),
});
export type M23Body = z.infer<typeof M23BodySchema>;

export const M24BodySchema = z.object({
  headline: z.string(),
  primary: z.object({
    type: z.string(),
    label: z.string().optional(),
  }),
  secondary: z.array(
    z.object({
      type: z.string(),
      label: z.string().optional(),
    })
  ),
  rotation_key: z.string(),
});
export type M24Body = z.infer<typeof M24BodySchema>;

export type ModuleBodyMap = {
  M01: M01Body;
  M02: M02Body;
  M03: M03Body;
  M04: M04Body;
  M05: M05Body;
  M06: M06Body;
  M07: M07Body;
  M08: M08Body;
  M09: M09Body;
  M10: M10Body;
  M11: M11Body;
  M12: M12Body;
  M13: M13Body;
  M14: M14Body;
  M15: M15Body;
  M16: M16Body;
  M17: M17Body;
  M18: M18Body;
  M19: M19Body;
  M20: M20Body;
  M21: M21Body;
  M22: M22Body;
  M23: M23Body;
  M24: M24Body;
};

export type ModuleProps<K extends keyof ModuleBodyMap> = {
  body: ModuleBodyMap[K];
  evidence?: any;
  images?: any;
};
