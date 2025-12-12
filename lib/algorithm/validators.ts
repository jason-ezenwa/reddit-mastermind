/**
 * Business Rules Validation
 * Validates generated content against business rules to ensure quality and authenticity
 */

import type { GeneratedPost, GeneratedComment } from '../ai/schemas';
import { isValidCommentTime, adjustToBusinessHours } from '../utils/date';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that no subreddit has more than 1 post this week
 */
export function validateNoOverposting(posts: GeneratedPost[]): ValidationResult {
  const subredditCounts = new Map<string, number>();
  const errors: string[] = [];

  posts.forEach(post => {
    const count = subredditCounts.get(post.subreddit) || 0;
    subredditCounts.set(post.subreddit, count + 1);
  });

  subredditCounts.forEach((count, subreddit) => {
    if (count > 1) {
      errors.push(`Overposting detected: ${subreddit} has ${count} posts (max 1 per week)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
}

/**
 * Detect topic overlap across posts to prevent repetition
 * Uses simple text similarity check
 */
export function validateTopicDiversity(posts: GeneratedPost[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check all post pairs for similarity
  for (let i = 0; i < posts.length; i++) {
    for (let j = i + 1; j < posts.length; j++) {
      const similarity = calculateTextSimilarity(
        posts[i].title.toLowerCase(),
        posts[j].title.toLowerCase()
      );

      if (similarity > 0.7) {
        errors.push(
          `Posts ${posts[i].post_id} and ${posts[j].post_id} are too similar (${(similarity * 100).toFixed(0)}% similarity)`
        );
      } else if (similarity > 0.5) {
        warnings.push(
          `Posts ${posts[i].post_id} and ${posts[j].post_id} have moderate similarity (${(similarity * 100).toFixed(0)}%)`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate that timestamps are realistic
 */
export function validateTimestamps(
  posts: GeneratedPost[],
  comments: GeneratedComment[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate post timestamps
  posts.forEach(post => {
    const hour = post.timestamp.getHours();
    
    // Warn if posting at unusual hours (midnight to 6 AM)
    if (hour < 6) {
      warnings.push(
        `Post ${post.post_id} has unusual timestamp: ${hour}:00 (early morning)`
      );
    }
    
    // Error if posting at very unusual hours (2-5 AM)
    if (hour >= 2 && hour < 5) {
      errors.push(
        `Post ${post.post_id} has unrealistic timestamp: ${hour}:00 (middle of night)`
      );
    }
  });

  // Validate comment timestamps
  comments.forEach(comment => {
    const post = posts.find(p => p.post_id === comment.post_id);
    
    if (!post) {
      errors.push(`Comment ${comment.comment_id} references non-existent post ${comment.post_id}`);
      return;
    }

    // Comment must come after post
    if (!isValidCommentTime(post.timestamp, comment.timestamp)) {
      const timeDiff = (comment.timestamp.getTime() - post.timestamp.getTime()) / (1000 * 60);
      
      if (timeDiff < 0) {
        errors.push(
          `Comment ${comment.comment_id} timestamp is before its post (${Math.abs(timeDiff).toFixed(0)} minutes early)`
        );
      } else {
        errors.push(
          `Comment ${comment.comment_id} timestamp is too late (${(timeDiff / 60 / 24).toFixed(1)} days after post)`
        );
      }
    }

    // Validate parent comment timing
    if (comment.parent_comment_id) {
      const parentComment = comments.find(c => c.comment_id === comment.parent_comment_id);
      
      if (!parentComment) {
        errors.push(
          `Comment ${comment.comment_id} references non-existent parent ${comment.parent_comment_id}`
        );
      } else {
        const replyTime = (comment.timestamp.getTime() - parentComment.timestamp.getTime()) / (1000 * 60);
        
        if (replyTime < 0) {
          errors.push(
            `Comment ${comment.comment_id} timestamp is before its parent comment`
          );
        } else if (replyTime < 1) {
          warnings.push(
            `Comment ${comment.comment_id} replies too quickly (${replyTime.toFixed(0)} minutes)`
          );
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate persona distribution is balanced
 */
export function validatePersonaDistribution(
  posts: GeneratedPost[],
  comments: GeneratedComment[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const personaCounts = new Map<string, number>();

  // Count posts by persona
  posts.forEach(post => {
    const count = personaCounts.get(post.author_username) || 0;
    personaCounts.set(post.author_username, count + 1);
  });

  // Count comments by persona
  comments.forEach(comment => {
    const count = personaCounts.get(comment.username) || 0;
    personaCounts.set(comment.username, count + 1);
  });

  const totalContent = posts.length + comments.length;
  const personaStats = Array.from(personaCounts.entries())
    .map(([username, count]) => ({
      username,
      count,
      percentage: (count / totalContent) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Check if any persona dominates (>50%)
  if (personaStats.length > 0 && personaStats[0].percentage > 50) {
    errors.push(
      `Persona ${personaStats[0].username} dominates content (${personaStats[0].percentage.toFixed(0)}% of all posts/comments)`
    );
  }

  // Warn if imbalanced (>40%)
  if (personaStats.length > 1 && personaStats[0].percentage > 40) {
    warnings.push(
      `Persona ${personaStats[0].username} has high content share (${personaStats[0].percentage.toFixed(0)}%)`
    );
  }

  // Warn if any persona is unused
  if (personaStats.some(stat => stat.count === 0)) {
    const unused = personaStats.filter(stat => stat.count === 0).map(s => s.username);
    warnings.push(`Unused personas: ${unused.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate comment thread structure
 */
export function validateCommentThreads(comments: GeneratedComment[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  comments.forEach(comment => {
    // Validate parent comment exists if referenced
    if (comment.parent_comment_id) {
      const parentExists = comments.some(c => c.comment_id === comment.parent_comment_id);
      
      if (!parentExists) {
        errors.push(
          `Comment ${comment.comment_id} references non-existent parent ${comment.parent_comment_id}`
        );
      }

      // Check for circular references
      if (comment.comment_id === comment.parent_comment_id) {
        errors.push(`Comment ${comment.comment_id} references itself as parent`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Run all validations and return combined results
 */
export function validateContentCalendar(
  posts: GeneratedPost[],
  comments: GeneratedComment[]
): ValidationResult {
  const results = [
    validateNoOverposting(posts),
    validateTopicDiversity(posts),
    validateTimestamps(posts, comments),
    validatePersonaDistribution(posts, comments),
    validateCommentThreads(comments),
  ];

  return {
    isValid: results.every(r => r.isValid),
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings),
  };
}

/**
 * Calculate text similarity using Jaccard similarity
 * Simple but effective for detecting duplicate content
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));

  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Fix common timestamp issues automatically
 */
export function fixTimestampIssues(
  posts: GeneratedPost[],
  comments: GeneratedComment[]
): void {
  // Adjust posts to business hours
  posts.forEach(post => {
    post.timestamp = adjustToBusinessHours(post.timestamp);
  });

  // Ensure comments come after their posts
  comments.forEach(comment => {
    const post = posts.find(p => p.post_id === comment.post_id);
    if (post && comment.timestamp < post.timestamp) {
      // Set comment to 15 minutes after post
      comment.timestamp = new Date(post.timestamp.getTime() + 15 * 60 * 1000);
    }
  });
}
