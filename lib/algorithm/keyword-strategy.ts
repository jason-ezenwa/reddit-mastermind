/**
 * Keyword Selection Strategy
 * Smart keyword selection and rotation to ensure natural keyword coverage without repetition
 */

import type { Keyword } from '../ai/schemas';

interface KeywordUsageTracker {
  keywordId: string;
  usageCount: number;
  lastUsedPostIndex: number;
}

/**
 * Select 2-3 keywords that naturally fit together for a post
 * Ensures keyword rotation and prevents overuse
 */
export class KeywordStrategy {
  private usageTracker: Map<string, KeywordUsageTracker>;
  private keywordCombinations: Set<string>;

  constructor() {
    this.usageTracker = new Map();
    this.keywordCombinations = new Set();
  }

  /**
   * Select keywords for a post, ensuring variety and natural fit
   */
  selectKeywordsForPost(
    availableKeywords: Keyword[],
    postIndex: number,
    subreddit: string
  ): Keyword[] {
    // Initialize usage tracker for new keywords
    availableKeywords.forEach(kw => {
      if (!this.usageTracker.has(kw.keyword_id)) {
        this.usageTracker.set(kw.keyword_id, {
          keywordId: kw.keyword_id,
          usageCount: 0,
          lastUsedPostIndex: -1,
        });
      }
    });

    // Determine how many keywords to select (2-3)
    const keywordCount = Math.random() < 0.6 ? 2 : 3;

    // Sort keywords by usage (prefer less-used keywords)
    const sortedKeywords = availableKeywords
      .map(kw => ({
        keyword: kw,
        usage: this.usageTracker.get(kw.keyword_id)!,
      }))
      .sort((a, b) => {
        // First priority: usage count (less is better)
        if (a.usage.usageCount !== b.usage.usageCount) {
          return a.usage.usageCount - b.usage.usageCount;
        }
        // Second priority: time since last use (longer is better)
        return a.usage.lastUsedPostIndex - b.usage.lastUsedPostIndex;
      });

    const selectedKeywords: Keyword[] = [];
    
    // Select keywords ensuring they haven't been used together before
    for (const { keyword } of sortedKeywords) {
      if (selectedKeywords.length >= keywordCount) break;

      // Check if this keyword combination is new
      const potentialCombination = [...selectedKeywords, keyword]
        .map(k => k.keyword_id)
        .sort()
        .join(',');

      if (
        selectedKeywords.length === 0 ||
        !this.keywordCombinations.has(potentialCombination)
      ) {
        selectedKeywords.push(keyword);
        
        // Update usage tracker
        const usage = this.usageTracker.get(keyword.keyword_id)!;
        usage.usageCount++;
        usage.lastUsedPostIndex = postIndex;
      }
    }

    // If we couldn't get enough unique combinations, just take the least-used ones
    if (selectedKeywords.length < keywordCount) {
      for (const { keyword } of sortedKeywords) {
        if (selectedKeywords.length >= keywordCount) break;
        if (!selectedKeywords.find(k => k.keyword_id === keyword.keyword_id)) {
          selectedKeywords.push(keyword);
          
          const usage = this.usageTracker.get(keyword.keyword_id)!;
          usage.usageCount++;
          usage.lastUsedPostIndex = postIndex;
        }
      }
    }

    // Record this keyword combination
    const combination = selectedKeywords
      .map(k => k.keyword_id)
      .sort()
      .join(',');
    this.keywordCombinations.add(combination);

    return selectedKeywords;
  }

  /**
   * Get usage statistics for reporting/debugging
   */
  getUsageStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.usageTracker.forEach((usage, keywordId) => {
      stats[keywordId] = usage.usageCount;
    });
    return stats;
  }

  /**
   * Reset the strategy for a new week
   */
  reset(): void {
    this.usageTracker.clear();
    this.keywordCombinations.clear();
  }
}

/**
 * Check if keywords are semantically compatible (helper for future enhancement)
 */
export function areKeywordsCompatible(keywords: Keyword[]): boolean {
  // For now, return true - in the future, this could use semantic similarity
  // to ensure keywords naturally fit together in a single post
  return keywords.length >= 1 && keywords.length <= 3;
}
