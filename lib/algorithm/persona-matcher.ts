/**
 * Persona Matching and Assignment Strategy
 * Ensures balanced persona distribution and natural conversation dynamics
 */

import type { Persona } from '../ai/schemas';

interface PersonaUsageTracker {
  username: string;
  postCount: number;
  commentCount: number;
  lastUsedIndex: number;
}

/**
 * Manage persona assignment for posts and comments
 * Ensures fair distribution and natural conversation patterns
 */
export class PersonaMatcher {
  private usageTracker: Map<string, PersonaUsageTracker>;

  constructor() {
    this.usageTracker = new Map();
  }

  /**
   * Select a persona to author a post
   * Rotates through personas fairly
   */
  selectPostAuthor(
    personas: Persona[],
    postIndex: number
  ): Persona {
    // Initialize usage tracker
    personas.forEach(p => {
      if (!this.usageTracker.has(p.username)) {
        this.usageTracker.set(p.username, {
          username: p.username,
          postCount: 0,
          commentCount: 0,
          lastUsedIndex: -1,
        });
      }
    });

    // Select persona with least posts, or round-robin if tied
    const sortedPersonas = personas
      .map(p => ({
        persona: p,
        usage: this.usageTracker.get(p.username)!,
      }))
      .sort((a, b) => {
        // First priority: post count (prefer less posts)
        if (a.usage.postCount !== b.usage.postCount) {
          return a.usage.postCount - b.usage.postCount;
        }
        // Second priority: last used index (prefer not recently used)
        return a.usage.lastUsedIndex - b.usage.lastUsedIndex;
      });

    const selectedPersona = sortedPersonas[0].persona;

    // Update usage
    const usage = this.usageTracker.get(selectedPersona.username)!;
    usage.postCount++;
    usage.lastUsedIndex = postIndex;

    return selectedPersona;
  }

  /**
   * Select personas to comment on a post
   * Ensures different personas comment (not all the same voice)
   * Returns 2-4 personas excluding the post author
   */
  selectCommentAuthors(
    personas: Persona[],
    postAuthor: Persona,
    postIndex: number
  ): Persona[] {
    // Filter out post author
    const availablePersonas = personas.filter(
      p => p.username !== postAuthor.username
    );

    if (availablePersonas.length === 0) {
      // Edge case: only one persona total, post author must also comment
      return [postAuthor];
    }

    // Determine number of commenters (2-4, but limited by available personas)
    const commentCount = Math.min(
      2 + Math.floor(Math.random() * 3), // 2-4
      availablePersonas.length
    );

    // Sort by comment count and last use
    const sortedPersonas = availablePersonas
      .map(p => ({
        persona: p,
        usage: this.usageTracker.get(p.username)!,
      }))
      .sort((a, b) => {
        // Prefer personas with fewer comments
        if (a.usage.commentCount !== b.usage.commentCount) {
          return a.usage.commentCount - b.usage.commentCount;
        }
        return a.usage.lastUsedIndex - b.usage.lastUsedIndex;
      });

    // Select top commenters
    const selectedPersonas = sortedPersonas
      .slice(0, commentCount)
      .map(({ persona }) => persona);

    // Update usage for all selected personas
    selectedPersonas.forEach(persona => {
      const usage = this.usageTracker.get(persona.username)!;
      usage.commentCount++;
      usage.lastUsedIndex = postIndex;
    });

    // Sometimes include the post author in the comments (natural for OP to reply)
    // 70% chance OP participates
    if (Math.random() < 0.7 && selectedPersonas.length > 0) {
      const postAuthorUsage = this.usageTracker.get(postAuthor.username)!;
      postAuthorUsage.commentCount++;
      selectedPersonas.push(postAuthor);
    }

    return selectedPersonas;
  }

  /**
   * Check if persona distribution is balanced
   * No single persona should dominate (more than 50% of content)
   */
  isPersonaDistributionBalanced(): boolean {
    const totalContent = Array.from(this.usageTracker.values())
      .reduce((sum, usage) => sum + usage.postCount + usage.commentCount, 0);

    if (totalContent === 0) return true;

    const maxContent = Math.max(
      ...Array.from(this.usageTracker.values())
        .map(usage => usage.postCount + usage.commentCount)
    );

    return maxContent / totalContent <= 0.5;
  }

  /**
   * Get usage statistics for all personas
   */
  getUsageStats(): Record<string, { posts: number; comments: number; total: number }> {
    const stats: Record<string, { posts: number; comments: number; total: number }> = {};
    
    this.usageTracker.forEach((usage, username) => {
      stats[username] = {
        posts: usage.postCount,
        comments: usage.commentCount,
        total: usage.postCount + usage.commentCount,
      };
    });

    return stats;
  }

  /**
   * Reset the matcher for a new week
   */
  reset(): void {
    this.usageTracker.clear();
  }
}

/**
 * Match persona writing style to subreddit context
 * Helps ensure persona feels natural in the community
 */
export function doesPersonaFitSubreddit(
  persona: Persona,
  subreddit: string
): boolean {
  // Simple heuristic - could be enhanced with AI analysis
  const backstory = persona.backstory.toLowerCase();
  const sub = subreddit.toLowerCase();

  // Extract key terms from subreddit name
  const subredditTerms = sub
    .replace('r/', '')
    .split(/[_\s]/)
    .filter(term => term.length > 2);

  // Check if persona backstory mentions any subreddit terms
  return subredditTerms.some(term => backstory.includes(term));
}
