/**
 * API Route: Generate Content Calendar
 * POST /api/calendar/generate
 * 
 * Generates a complete Reddit content calendar with posts and comments
 * No database persistence - pure stateless generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAiService } from '@/lib/ai/ai.service';
import { createContentGenerator } from '@/lib/algorithm/content-generator';
import { calendarInputSchema } from '@/lib/ai/schemas';

/**
 * Security: Input sanitization and validation
 */
function sanitizeInput(data: unknown): unknown {
  // Remove any potentially harmful script tags or XSS attempts
  const sanitize = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, sanitize(v)])
      );
    }
    return value;
  };

  return sanitize(data);
}

/**
 * POST /api/calendar/generate
 * Generate a content calendar based on company info, personas, and keywords
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and sanitize request body
    const rawBody = await request.json();
    const sanitizedBody = sanitizeInput(rawBody);

    // Validate input against schema
    const validationResult = calendarInputSchema.safeParse(sanitizedBody);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: validationResult.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    console.log(`Generating calendar for ${input.company.name}...`);
    console.log(`- Posts per week: ${input.company.postsPerWeek}`);
    console.log(`- Subreddits: ${input.company.subreddits.join(', ')}`);
    console.log(`- Personas: ${input.personas.length}`);
    console.log(`- Keywords: ${input.keywords.length}`);

    // Get AI service based on environment configuration
    const aiService = getAiService();
    console.log(`Using AI provider: ${aiService.getProviderName()}`);

    // Create content generator
    const generator = createContentGenerator(aiService);

    // Generate content calendar (no database persistence)
    const calendar = await generator.generate(input);

    console.log(`Successfully generated calendar:`);
    console.log(`- ${calendar.posts.length} posts`);
    console.log(`- ${calendar.comments.length} comments`);

    // Return the generated calendar
    return NextResponse.json(
      {
        success: true,
        data: {
          weekNumber: calendar.weekNumber,
          companyName: calendar.companyName,
          posts: calendar.posts.map(post => ({
            post_id: post.post_id,
            subreddit: post.subreddit,
            title: post.title,
            body: post.body,
            author_username: post.author_username,
            timestamp: post.timestamp.toISOString(),
            keyword_ids: post.keyword_ids,
          })),
          comments: calendar.comments.map(comment => ({
            comment_id: comment.comment_id,
            post_id: comment.post_id,
            parent_comment_id: comment.parent_comment_id,
            comment_text: comment.comment_text,
            username: comment.username,
            timestamp: comment.timestamp.toISOString(),
          })),
          generatedAt: calendar.generatedAt.toISOString(),
        },
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Security headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );
  } catch (error) {
    console.error('Calendar generation error:', error);

    // Provide user-friendly error messages without exposing internal details
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate calendar',
        message: errorMessage,
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }
}

/**
 * GET - Method not allowed
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
      message: 'Use POST to generate a calendar',
    },
    { status: 405 }
  );
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Allow': 'POST, OPTIONS',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
