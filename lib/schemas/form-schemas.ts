/**
 * Zod validation schemas for frontend forms
 */

import { z } from 'zod';

/**
 * Company information form schema
 */
export const companyFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  website: z
    .string()
    .min(1, 'Website is required')
    .url('Please enter a valid URL')
    .or(z.string().regex(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/, 'Please enter a valid domain (e.g., example.com)'))
    .transform((val) => {
      // Add https:// if not present and it looks like a domain
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        return `https://${val}`;
      }
      return val;
    }),
  description: z
    .string()
    .min(100, 'Description must be at least 100 characters (include ICP segments)')
    .max(5000, 'Description must be less than 5000 characters'),
  subreddits: z
    .array(z.string())
    .min(1, 'At least one subreddit is required')
    .refine(
      (subreddits) => subreddits.every((s) => s.startsWith('r/')),
      'All subreddits must start with r/'
    ),
  postsPerWeek: z
    .number()
    .min(1, 'At least 1 post per week')
    .max(7, 'Maximum 7 posts per week'),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;

/**
 * Persona form schema
 */
export const personaFormSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  backstory: z
    .string()
    .min(100, 'Backstory must be at least 100 characters for authenticity')
    .max(3000, 'Backstory must be less than 3000 characters'),
});

export type PersonaFormValues = z.infer<typeof personaFormSchema>;

/**
 * Keywords form schema
 */
export const keywordsFormSchema = z.object({
  keywordsText: z
    .string()
    .min(1, 'At least one keyword is required')
    .refine(
      (text) => text.trim().split('\n').filter((line) => line.trim()).length > 0,
      'Please enter at least one keyword'
    ),
});

export type KeywordsFormValues = z.infer<typeof keywordsFormSchema>;

/**
 * Subreddit input schema
 */
export const subredditSchema = z
  .string()
  .min(1, 'Subreddit name is required')
  .transform((val) => {
    // Auto-format to r/subreddit
    const trimmed = val.trim();
    if (trimmed.startsWith('r/')) {
      return trimmed;
    }
    if (trimmed.startsWith('/r/')) {
      return trimmed.substring(1);
    }
    return `r/${trimmed}`;
  })
  .refine(
    (val) => /^r\/[a-zA-Z0-9_]+$/.test(val),
    'Invalid subreddit format. Use letters, numbers, and underscores only'
  );

/**
 * Main calendar generation form schema
 */
export const calendarGenerationSchema = z.object({
  company: companyFormSchema,
  personas: z
    .array(personaFormSchema)
    .min(3, "At least 3 personas are required for authentic conversations"),
  keywords: z
    .array(
      z.object({
        keyword_id: z.string(),
        keyword: z.string().min(1),
      })
    )
    .min(1, "At least one keyword is required"),
  weekNumber: z.number().default(1),
});

export type CalendarGenerationFormValues = z.infer<typeof calendarGenerationSchema>;
