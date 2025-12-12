/**
 * Subreddit Selection Strategy
 * Ensures balanced distribution across subreddits and prevents overposting
 */

import type { CompanyInfo } from '../ai/schemas';

interface SubredditUsageTracker {
  subreddit: string;
  postsThisWeek: number;
  lastPostIndex: number;
}

/**
 * Subreddit selection with overposting prevention
 * Max 1 post per subreddit per week
 */
export class SubredditStrategy {
  private usageTracker: Map<string, SubredditUsageTracker>;

  constructor() {
    this.usageTracker = new Map();
  }

  /**
   * Select the next subreddit for a post
   * Ensures round-robin distribution and prevents overposting
   */
  selectSubreddit(
    subreddits: string[],
    postIndex: number,
    totalPosts: number
  ): string {
    // Initialize usage tracker
    subreddits.forEach(sub => {
      if (!this.usageTracker.has(sub)) {
        this.usageTracker.set(sub, {
          subreddit: sub,
          postsThisWeek: 0,
          lastPostIndex: -1,
        });
      }
    });

    // Get available subreddits (not yet posted to this week)
    const availableSubreddits = subreddits.filter(sub => {
      const usage = this.usageTracker.get(sub)!;
      return usage.postsThisWeek === 0;
    });

    // If all subreddits have been used once and we need more posts,
    // start from the least recently used
    let selectedSubreddit: string;
    
    if (availableSubreddits.length === 0) {
      // All subreddits have at least one post, select least recently used
      const sortedByLastUse = Array.from(this.usageTracker.values())
        .sort((a, b) => a.lastPostIndex - b.lastPostIndex);
      
      selectedSubreddit = sortedByLastUse[0].subreddit;
    } else {
      // Round-robin selection from available subreddits
      const index = postIndex % availableSubreddits.length;
      selectedSubreddit = availableSubreddits[index];
    }

    // Update usage tracker
    const usage = this.usageTracker.get(selectedSubreddit)!;
    usage.postsThisWeek++;
    usage.lastPostIndex = postIndex;

    return selectedSubreddit;
  }

  /**
   * Check if a subreddit has been overposted to (more than 1 post)
   */
  isOverposted(subreddit: string): boolean {
    const usage = this.usageTracker.get(subreddit);
    return usage ? usage.postsThisWeek > 1 : false;
  }

  /**
   * Get all overposted subreddits
   */
  getOverpostedSubreddits(): string[] {
    return Array.from(this.usageTracker.values())
      .filter(usage => usage.postsThisWeek > 1)
      .map(usage => usage.subreddit);
  }

  /**
   * Get usage statistics for all subreddits
   */
  getUsageStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.usageTracker.forEach((usage, subreddit) => {
      stats[subreddit] = usage.postsThisWeek;
    });
    return stats;
  }

  /**
   * Reset the strategy for a new week
   */
  reset(): void {
    this.usageTracker.clear();
  }
}

/**
 * Map ICP segment to most relevant subreddit
 * This helps match persona and content to the right community
 */
export function mapICPToSubreddit(
  subreddit: string,
  companyDescription: string
): string | undefined {
  // Extract potential ICP segments from description
  // This is a simplified version - could be enhanced with AI
  const description = companyDescription.toLowerCase();
  
  const icpMappings: Record<string, string[]> = {
    'consultants': ['consulting', 'consultant', 'professional services'],
    'educators': ['teacher', 'professor', 'education', 'university'],
    'marketers': ['marketing', 'marketer', 'brand', 'growth'],
    'sales teams': ['sales', 'business development', 'account executive'],
    'executives': ['executive', 'ceo', 'leadership', 'c-suite'],
    'designers': ['designer', 'design', 'creative'],
    'developers': ['developer', 'engineer', 'programmer', 'software'],
  };

  const subredditLower = subreddit.toLowerCase();
  
  for (const [segment, keywords] of Object.entries(icpMappings)) {
    // Check if subreddit matches ICP segment
    const matchesSubreddit = keywords.some(kw => subredditLower.includes(kw));
    const matchesDescription = keywords.some(kw => description.includes(kw));
    
    if (matchesSubreddit && matchesDescription) {
      return segment;
    }
  }

  return undefined;
}
