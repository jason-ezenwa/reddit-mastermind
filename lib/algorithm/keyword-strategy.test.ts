/**
 * Unit tests for keyword selection strategy
 */

import { KeywordStrategy } from './keyword-strategy';
import type { Keyword } from '../ai/schemas';

describe('KeywordStrategy', () => {
  const mockKeywords: Keyword[] = [
    { keyword_id: 'K1', keyword: 'best ai presentation maker' },
    { keyword_id: 'K2', keyword: 'alternatives to PowerPoint' },
    { keyword_id: 'K3', keyword: 'presentation software for consultants' },
    { keyword_id: 'K4', keyword: 'slide deck automation' },
    { keyword_id: 'K5', keyword: 'ai powered slides' },
  ];

  it('should select 2-3 keywords for a post', () => {
    const strategy = new KeywordStrategy();
    const selected = strategy.selectKeywordsForPost(mockKeywords, 0, 'r/PowerPoint');

    expect(selected.length).toBeGreaterThanOrEqual(2);
    expect(selected.length).toBeLessThanOrEqual(3);
  });

  it('should rotate keywords across multiple posts', () => {
    const strategy = new KeywordStrategy();
    const selections: string[][] = [];

    for (let i = 0; i < 3; i++) {
      const selected = strategy.selectKeywordsForPost(mockKeywords, i, 'r/PowerPoint');
      selections.push(selected.map(k => k.keyword_id));
    }

    // Each selection should be different
    const uniqueSelections = new Set(selections.map(s => s.join(',')));
    expect(uniqueSelections.size).toBeGreaterThan(1);
  });

  it('should track keyword usage', () => {
    const strategy = new KeywordStrategy();

    strategy.selectKeywordsForPost(mockKeywords, 0, 'r/PowerPoint');
    strategy.selectKeywordsForPost(mockKeywords, 1, 'r/GoogleSlides');

    const stats = strategy.getUsageStats();
    const totalUsage = Object.values(stats).reduce((sum, count) => sum + count, 0);

    expect(totalUsage).toBeGreaterThan(0);
  });

  it('should prefer less-used keywords', () => {
    const strategy = new KeywordStrategy();

    // Use first keyword multiple times
    strategy.selectKeywordsForPost([mockKeywords[0]], 0, 'r/PowerPoint');
    strategy.selectKeywordsForPost([mockKeywords[0]], 1, 'r/GoogleSlides');

    // Next selection should prefer other keywords
    const selected = strategy.selectKeywordsForPost(mockKeywords, 2, 'r/consulting');
    const hasOtherKeywords = selected.some(k => k.keyword_id !== 'K1');

    expect(hasOtherKeywords).toBe(true);
  });

  it('should reset properly', () => {
    const strategy = new KeywordStrategy();

    strategy.selectKeywordsForPost(mockKeywords, 0, 'r/PowerPoint');
    expect(Object.keys(strategy.getUsageStats()).length).toBeGreaterThan(0);

    strategy.reset();
    expect(Object.keys(strategy.getUsageStats()).length).toBe(0);
  });
});
