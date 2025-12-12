/**
 * OpenAI Service Implementation
 * Uses OpenAI's GPT models for content generation with structured output
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { IAiService } from './ai.interface';
import type {
  GeneratePostRequest,
  GenerateCommentRequest,
  PostGenerationResult,
  CommentGenerationResult,
} from './types';
import { postSchema, commentSchema } from './schemas';
import { buildPostPrompt, buildCommentPrompt, enhancePromptWithICP } from './prompts';

export class OpenAIService implements IAiService {
  private model: string;
  
  constructor(model: string = 'gpt-4o') {
    this.model = model;
  }

  async generatePost(request: GeneratePostRequest): Promise<PostGenerationResult> {
    const startTime = Date.now();
    
    try {
      let prompt = buildPostPrompt(request);
      if (request.icpSegment) {
        prompt = enhancePromptWithICP(prompt, request.icpSegment);
      }

      const result = await generateObject({
        model: openai(this.model),
        schema: postSchema,
        prompt,
        temperature: 0.8, // Higher temperature for more creative, varied content
      });

      return {
        title: result.object.title,
        body: result.object.body,
        metadata: {
          generationTime: Date.now() - startTime,
          provider: 'openai',
        },
      };
    } catch (error) {
      console.error('OpenAI post generation failed:', error);
      throw new Error(`Failed to generate post with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateComment(request: GenerateCommentRequest): Promise<CommentGenerationResult> {
    const startTime = Date.now();
    
    try {
      const prompt = buildCommentPrompt(request);

      const result = await generateObject({
        model: openai(this.model),
        schema: commentSchema,
        prompt,
        temperature: 0.8, // Higher temperature for natural conversation
      });

      return {
        text: result.object.text,
        metadata: {
          generationTime: Date.now() - startTime,
          provider: 'openai',
        },
      };
    } catch (error) {
      console.error('OpenAI comment generation failed:', error);
      throw new Error(`Failed to generate comment with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getProviderName(): string {
    return `OpenAI (${this.model})`;
  }
}
