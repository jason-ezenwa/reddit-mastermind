/**
 * TypeScript types and interfaces for the AI service layer
 */

import type { Persona, Keyword, CompanyInfo } from './schemas';

// Request types for AI generation
export interface GeneratePostRequest {
  persona: Persona;
  subreddit: string;
  keywords: Keyword[];
  company: CompanyInfo;
  icpSegment?: string;
}

export interface GenerateCommentRequest {
  persona: Persona;
  post: {
    title: string;
    body: string;
    author_username: string;
  };
  parentComment?: {
    text: string;
    username: string;
  } | null;
  company: CompanyInfo;
  commentPosition: 'first' | 'reply' | 'late';
  shouldMentionProduct: boolean;
}

// AI provider configuration
export type AIProvider = 'openai' | 'groq';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

// AI response types
export interface PostGenerationResult {
  title: string;
  body: string;
  metadata?: {
    generationTime: number;
    provider: AIProvider;
  };
}

export interface CommentGenerationResult {
  text: string;
  metadata?: {
    generationTime: number;
    provider: AIProvider;
  };
}
