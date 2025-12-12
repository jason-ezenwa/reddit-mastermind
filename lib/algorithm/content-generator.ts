/**
 * Content Generation Algorithm
 * Core algorithm that orchestrates the generation of authentic Reddit content calendars
 */

import type { IAiService } from '../ai/ai.interface';
import type {
  CalendarInput,
  ContentCalendar,
  GeneratedPost,
  GeneratedComment,
  Persona,
} from '../ai/schemas';
import {
  generatePostTime,
  generateFirstCommentTime,
  generateReplyCommentTime,
  generateLateCommentTime,
  getCurrentWeekStart,
} from '../utils/date';
import { KeywordStrategy } from './keyword-strategy';
import { SubredditStrategy, mapICPToSubreddit } from './subreddit-strategy';
import { PersonaMatcher } from './persona-matcher';
import { validateContentCalendar, fixTimestampIssues } from './validators';

interface PostPlan {
  postIndex: number;
  subreddit: string;
  author: Persona;
  timestamp: Date;
  keywords: Array<{ keyword_id: string; keyword: string }>;
  icpSegment?: string;
}

interface CommentPlan {
  position: 'first' | 'reply' | 'late';
  author: Persona;
  parentCommentId: string | null;
  shouldMentionProduct: boolean;
  timingOffset: string; // e.g., "+21min", "+2h"
}

/**
 * Main content generation service
 */
export class ContentGenerator {
  private aiService: IAiService;
  private keywordStrategy: KeywordStrategy;
  private subredditStrategy: SubredditStrategy;
  private personaMatcher: PersonaMatcher;

  constructor(aiService: IAiService) {
    this.aiService = aiService;
    this.keywordStrategy = new KeywordStrategy();
    this.subredditStrategy = new SubredditStrategy();
    this.personaMatcher = new PersonaMatcher();
  }

  /**
   * Generate a complete content calendar for a week
   */
  async generate(input: CalendarInput): Promise<ContentCalendar> {
    console.log(`Starting content generation for ${input.company.name}...`);
    
    // Reset strategies for fresh week
    this.keywordStrategy.reset();
    this.subredditStrategy.reset();
    this.personaMatcher.reset();

    // Phase 1: Create Weekly Post Plan
    const weekStart = getCurrentWeekStart();
    const postPlans = this.createWeeklyPostPlan(input, weekStart);
    console.log(`Created ${postPlans.length} post plans`);

    // Phase 2: Generate Posts
    const posts = await this.generatePosts(postPlans, input);
    console.log(`Generated ${posts.length} posts`);

    // Phase 3: Generate Comment Threads
    const comments = await this.generateComments(posts, postPlans, input);
    console.log(`Generated ${comments.length} comments`);

    // Phase 4: Business Rules Validation
    fixTimestampIssues(posts, comments);
    const validation = validateContentCalendar(posts, comments);
    
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      throw new Error(`Content validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('Validation warnings:', validation.warnings);
    }

    // Phase 5: Assembly
    return {
      weekNumber: input.weekNumber || 1,
      companyName: input.company.name,
      posts,
      comments,
      generatedAt: new Date(),
    };
  }

  /**
   * Phase 1: Create weekly post plan
   */
  private createWeeklyPostPlan(input: CalendarInput, weekStart: Date): PostPlan[] {
    const plans: PostPlan[] = [];
    const { company, personas, keywords } = input;
    const postsPerWeek = company.postsPerWeek;

    for (let i = 0; i < postsPerWeek; i++) {
      // Select subreddit (round-robin, max 1 per subreddit)
      const subreddit = this.subredditStrategy.selectSubreddit(
        company.subreddits,
        i,
        postsPerWeek
      );

      // Select 2-3 keywords
      const selectedKeywords = this.keywordStrategy.selectKeywordsForPost(
        keywords,
        i,
        subreddit
      );

      // Assign post author
      const author = this.personaMatcher.selectPostAuthor(personas, i);

      // Generate realistic timestamp
      const timestamp = generatePostTime(weekStart, i, postsPerWeek);

      // Map ICP segment if applicable
      const icpSegment = mapICPToSubreddit(subreddit, company.description);

      plans.push({
        postIndex: i,
        subreddit,
        author,
        timestamp,
        keywords: selectedKeywords,
        icpSegment,
      });
    }

    return plans;
  }

  /**
   * Phase 2: Generate posts using AI
   */
  private async generatePosts(
    plans: PostPlan[],
    input: CalendarInput
  ): Promise<GeneratedPost[]> {
    const posts: GeneratedPost[] = [];

    for (const plan of plans) {
      console.log(
        `Generating post ${plan.postIndex + 1}/${plans.length} for ${plan.subreddit} by ${plan.author.username}...`
      );

      try {
        const result = await this.aiService.generatePost({
          persona: plan.author,
          subreddit: plan.subreddit,
          keywords: plan.keywords,
          company: input.company,
          icpSegment: plan.icpSegment,
        });

        posts.push({
          post_id: `P${plan.postIndex + 1}`,
          subreddit: plan.subreddit,
          title: result.title,
          body: result.body,
          author_username: plan.author.username,
          timestamp: plan.timestamp,
          keyword_ids: plan.keywords.map(k => k.keyword_id),
        });

        // Add small delay to avoid rate limiting
        await this.sleep(500);
      } catch (error) {
        console.error(`Failed to generate post ${plan.postIndex + 1}:`, error);
        throw error;
      }
    }

    return posts;
  }

  /**
   * Phase 3: Generate comment threads for each post
   */
  private async generateComments(
    posts: GeneratedPost[],
    postPlans: PostPlan[],
    input: CalendarInput
  ): Promise<GeneratedComment[]> {
    const allComments: GeneratedComment[] = [];
    let commentIdCounter = 1;

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const plan = postPlans[i];

      console.log(
        `Generating comments for post ${i + 1}/${posts.length} (${post.post_id})...`
      );

      // Determine comment structure (2-4 comments)
      const commentCount = 2 + Math.floor(Math.random() * 3); // 2-4
      const commentingPersonas = this.personaMatcher.selectCommentAuthors(
        input.personas,
        plan.author,
        i
      );

      // Create comment plans
      const commentPlans = this.createCommentPlans(
        commentingPersonas,
        commentCount,
        plan.author
      );

      // Generate each comment
      for (let j = 0; j < commentPlans.length; j++) {
        const commentPlan = commentPlans[j];

        try {
          // Find parent comment if this is a reply
          const parentComment = commentPlan.parentCommentId
            ? allComments.find(c => c.comment_id === commentPlan.parentCommentId)
            : null;

          const result = await this.aiService.generateComment({
            persona: commentPlan.author,
            post: {
              title: post.title,
              body: post.body,
              author_username: post.author_username,
            },
            parentComment: parentComment
              ? {
                  text: parentComment.comment_text,
                  username: parentComment.username,
                }
              : null,
            company: input.company,
            commentPosition: commentPlan.position,
            shouldMentionProduct: commentPlan.shouldMentionProduct,
          });

          // Calculate timestamp based on position
          let commentTimestamp: Date;
          if (commentPlan.position === 'first') {
            commentTimestamp = generateFirstCommentTime(post.timestamp);
          } else if (commentPlan.position === 'reply' && parentComment) {
            commentTimestamp = generateReplyCommentTime(parentComment.timestamp);
          } else {
            commentTimestamp = generateLateCommentTime(post.timestamp);
          }

          allComments.push({
            comment_id: `C${commentIdCounter++}`,
            post_id: post.post_id,
            parent_comment_id: commentPlan.parentCommentId,
            comment_text: result.text,
            username: commentPlan.author.username,
            timestamp: commentTimestamp,
          });

          // Add small delay to avoid rate limiting
          await this.sleep(500);
        } catch (error) {
          console.error(
            `Failed to generate comment ${j + 1} for post ${post.post_id}:`,
            error
          );
          throw error;
        }
      }
    }

    return allComments;
  }

  /**
   * Create comment plans for a post
   */
  private createCommentPlans(
    personas: Persona[],
    targetCount: number,
    postAuthor: Persona
  ): CommentPlan[] {
    const plans: CommentPlan[] = [];
    const actualCount = Math.min(targetCount, personas.length);

    for (let i = 0; i < actualCount; i++) {
      const persona = personas[i];

      // Determine comment position and behavior
      let position: 'first' | 'reply' | 'late';
      let parentCommentId: string | null = null;
      let shouldMentionProduct = false;

      if (i === 0) {
        // First comment - top-level, often mentions product
        position = 'first';
        shouldMentionProduct = Math.random() < 0.7; // 70% chance
      } else if (i === 1 && Math.random() < 0.6) {
        // Second comment often replies to first
        position = 'reply';
        parentCommentId = `C1`; // Will be updated with actual ID
        shouldMentionProduct = Math.random() < 0.3; // 30% chance
      } else if (persona.username === postAuthor.username) {
        // OP replying to first comment
        position = 'reply';
        parentCommentId = `C1`;
        shouldMentionProduct = false; // OP stays neutral
      } else {
        // Late comment - new perspective
        position = 'late';
        shouldMentionProduct = Math.random() < 0.4; // 40% chance
      }

      plans.push({
        position,
        author: persona,
        parentCommentId,
        shouldMentionProduct,
        timingOffset: position === 'first' ? '+21min' : position === 'reply' ? '+16min' : '+2h',
      });
    }

    return plans;
  }

  /**
   * Simple sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create content generator with AI service
 */
export function createContentGenerator(aiService: IAiService): ContentGenerator {
  return new ContentGenerator(aiService);
}
