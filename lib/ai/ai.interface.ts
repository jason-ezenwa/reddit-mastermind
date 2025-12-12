/**
 * AI Service Interface
 * Defines the contract for all AI service implementations
 * Following the hunt-assistant pattern for provider abstraction
 */

import type {
  GeneratePostRequest,
  GenerateCommentRequest,
  PostGenerationResult,
  CommentGenerationResult,
} from './types';

export interface IAiService {
  /**
   * Generate an authentic Reddit post based on persona and context
   * @param request Post generation parameters including persona, subreddit, keywords, company info
   * @returns Generated post with title and body
   */
  generatePost(request: GeneratePostRequest): Promise<PostGenerationResult>;

  /**
   * Generate a natural Reddit comment as part of a conversation thread
   * @param request Comment generation parameters including persona, post context, parent comment
   * @returns Generated comment text
   */
  generateComment(request: GenerateCommentRequest): Promise<CommentGenerationResult>;

  /**
   * Get the provider name for logging/debugging
   */
  getProviderName(): string;
}
