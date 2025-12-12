/**
 * Core type definitions for the Reddit Mastermind Content Calendar Generator
 */

export interface CompanyInfo {
  name: string;
  website: string;
  description: string;
  subreddits: string[];
  postsPerWeek: number;
}

export interface Persona {
  username: string;
  backstory: string;
}

export interface Keyword {
  keyword_id: string;
  keyword: string;
}

export interface Post {
  post_id: string;
  subreddit: string;
  title: string;
  body: string;
  author_username: string;
  timestamp: string;
  keyword_ids: string;
}

export interface Comment {
  comment_id: string;
  post_id: string;
  parent_comment_id: string | null;
  comment_text: string;
  username: string;
  timestamp: string;
}

export interface CalendarData {
  weekNumber: number;
  companyName: string;
  posts: Post[];
  comments: Comment[];
  generatedAt: string;
}

export interface GenerateCalendarInput {
  company: CompanyInfo;
  personas: Persona[];
  keywords: Keyword[];
}

export interface GenerateCalendarResponse {
  success: boolean;
  data: CalendarData;
  error?: string;
}
