import { z } from 'zod';

/**
 * Zod schemas for structured AI output validation
 * These schemas ensure type-safe AI responses and enable structured generation
 */

// Schema for a generated Reddit post
export const postSchema = z.object({
  title: z.string().min(10).max(300).describe('Reddit post title that naturally incorporates keywords'),
  body: z.string().min(50).max(10000).describe('Reddit post body text that sounds authentic and conversational'),
});

// Schema for a generated Reddit comment
export const commentSchema = z.object({
  text: z.string().min(10).max(2000).describe('Comment text that sounds natural and matches persona writing style'),
});

// Schema for validating input data
export const companyInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Valid website URL is required'),
  description: z.string().min(100, 'Company description must be at least 100 characters'),
  subreddits: z.array(z.string().regex(/^r\/[a-zA-Z0-9_]+$/, 'Invalid subreddit format')).min(1, 'At least one subreddit is required'),
  postsPerWeek: z.number().int().min(1).max(7),
});

export const personaSchema = z.object({
  username: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Invalid username format'),
  backstory: z.string().min(200, 'Backstory must be at least 200 characters for authentic persona generation'),
});

export const keywordSchema = z.object({
  keyword_id: z.string().min(1),
  keyword: z.string().min(1),
});

export const calendarInputSchema = z.object({
  company: companyInfoSchema,
  personas: z.array(personaSchema).min(2, 'At least 2 personas are required for natural conversations'),
  keywords: z.array(keywordSchema).min(1, 'At least one keyword is required'),
  weekNumber: z.number().int().min(1).optional().default(1),
});

// Schema for the complete generated content calendar
export const generatedPostSchema = z.object({
  post_id: z.string(),
  subreddit: z.string(),
  title: z.string(),
  body: z.string(),
  author_username: z.string(),
  timestamp: z.date(),
  keyword_ids: z.array(z.string()),
});

export const generatedCommentSchema = z.object({
  comment_id: z.string(),
  post_id: z.string(),
  parent_comment_id: z.string().nullable(),
  comment_text: z.string(),
  username: z.string(),
  timestamp: z.date(),
});

export const contentCalendarSchema = z.object({
  weekNumber: z.number(),
  companyName: z.string(),
  posts: z.array(generatedPostSchema),
  comments: z.array(generatedCommentSchema),
  generatedAt: z.date(),
});

// Export types from schemas
export type PostOutput = z.infer<typeof postSchema>;
export type CommentOutput = z.infer<typeof commentSchema>;
export type CompanyInfo = z.infer<typeof companyInfoSchema>;
export type Persona = z.infer<typeof personaSchema>;
export type Keyword = z.infer<typeof keywordSchema>;
export type CalendarInput = z.infer<typeof calendarInputSchema>;
export type GeneratedPost = z.infer<typeof generatedPostSchema>;
export type GeneratedComment = z.infer<typeof generatedCommentSchema>;
export type ContentCalendar = z.infer<typeof contentCalendarSchema>;
