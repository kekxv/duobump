import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';
const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    icon: z.string(),
    eyebrow: z.string(),
    sourceIds: z.array(z.string()).min(1),
    updatedAt: z.string(),
    reviewStatus: z.enum(['draft', 'source-checked', 'clinician-reviewed']),
    reviewer: z.string().optional(),
    reviewedAt: z.string().optional(),
  }),
});
export const collections = { guides };
