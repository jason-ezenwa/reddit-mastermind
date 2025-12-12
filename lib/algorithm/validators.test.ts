/**
 * Unit tests for business rules validation
 */

import {
  validateNoOverposting,
  validateTopicDiversity,
  validateTimestamps,
  validatePersonaDistribution,
  validateCommentThreads,
  validateContentCalendar,
} from './validators';
import type { GeneratedPost, GeneratedComment } from '../ai/schemas';

describe('Validators', () => {
  describe('validateNoOverposting', () => {
    it('should pass when each subreddit has at most 1 post', () => {
      const posts: GeneratedPost[] = [
        {
          post_id: 'P1',
          subreddit: 'r/PowerPoint',
          title: 'Test 1',
          body: 'Body 1',
          author_username: 'user1',
          timestamp: new Date(),
          keyword_ids: ['K1'],
        },
        {
          post_id: 'P2',
          subreddit: 'r/GoogleSlides',
          title: 'Test 2',
          body: 'Body 2',
          author_username: 'user2',
          timestamp: new Date(),
          keyword_ids: ['K2'],
        },
      ];

      const result = validateNoOverposting(posts);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when a subreddit has more than 1 post', () => {
      const posts: GeneratedPost[] = [
        {
          post_id: 'P1',
          subreddit: 'r/PowerPoint',
          title: 'Test 1',
          body: 'Body 1',
          author_username: 'user1',
          timestamp: new Date(),
          keyword_ids: ['K1'],
        },
        {
          post_id: 'P2',
          subreddit: 'r/PowerPoint',
          title: 'Test 2',
          body: 'Body 2',
          author_username: 'user2',
          timestamp: new Date(),
          keyword_ids: ['K2'],
        },
      ];

      const result = validateNoOverposting(posts);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('r/PowerPoint');
    });
  });

  describe('validateTopicDiversity', () => {
    it('should pass when posts have diverse titles', () => {
      const posts: GeneratedPost[] = [
        {
          post_id: 'P1',
          subreddit: 'r/PowerPoint',
          title: 'Best AI presentation tools for consulting',
          body: 'Body 1',
          author_username: 'user1',
          timestamp: new Date(),
          keyword_ids: ['K1'],
        },
        {
          post_id: 'P2',
          subreddit: 'r/GoogleSlides',
          title: 'How to create engaging slide decks quickly',
          body: 'Body 2',
          author_username: 'user2',
          timestamp: new Date(),
          keyword_ids: ['K2'],
        },
      ];

      const result = validateTopicDiversity(posts);
      expect(result.isValid).toBe(true);
    });

    it('should fail when posts are too similar', () => {
      const posts: GeneratedPost[] = [
        {
          post_id: 'P1',
          subreddit: 'r/PowerPoint',
          title: 'Best presentation software for business professionals',
          body: 'Body 1',
          author_username: 'user1',
          timestamp: new Date(),
          keyword_ids: ['K1'],
        },
        {
          post_id: 'P2',
          subreddit: 'r/GoogleSlides',
          title: 'Best presentation software for business professionals',
          body: 'Body 2',
          author_username: 'user2',
          timestamp: new Date(),
          keyword_ids: ['K2'],
        },
      ];

      const result = validateTopicDiversity(posts);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateTimestamps', () => {
    it('should pass when timestamps are realistic', () => {
      const now = new Date();
      const postTime = new Date(now);
      postTime.setHours(14, 0, 0, 0); // 2 PM

      const commentTime = new Date(postTime);
      commentTime.setMinutes(30); // 30 minutes later

      const posts: GeneratedPost[] = [
        {
          post_id: 'P1',
          subreddit: 'r/PowerPoint',
          title: 'Test',
          body: 'Body',
          author_username: 'user1',
          timestamp: postTime,
          keyword_ids: ['K1'],
        },
      ];

      const comments: GeneratedComment[] = [
        {
          comment_id: 'C1',
          post_id: 'P1',
          parent_comment_id: null,
          comment_text: 'Great question!',
          username: 'user2',
          timestamp: commentTime,
        },
      ];

      const result = validateTimestamps(posts, comments);
      expect(result.isValid).toBe(true);
    });

    it('should fail when comment comes before post', () => {
      const now = new Date();
      const postTime = new Date(now);
      postTime.setHours(14, 0, 0, 0);

      const commentTime = new Date(postTime);
      commentTime.setMinutes(-30); // 30 minutes before post

      const posts: GeneratedPost[] = [
        {
          post_id: 'P1',
          subreddit: 'r/PowerPoint',
          title: 'Test',
          body: 'Body',
          author_username: 'user1',
          timestamp: postTime,
          keyword_ids: ['K1'],
        },
      ];

      const comments: GeneratedComment[] = [
        {
          comment_id: 'C1',
          post_id: 'P1',
          parent_comment_id: null,
          comment_text: 'Great question!',
          username: 'user2',
          timestamp: commentTime,
        },
      ];

      const result = validateTimestamps(posts, comments);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validatePersonaDistribution', () => {
    it('should pass when personas are balanced', () => {
      const posts: GeneratedPost[] = [
        {
          post_id: 'P1',
          subreddit: 'r/PowerPoint',
          title: 'Test 1',
          body: 'Body 1',
          author_username: 'user1',
          timestamp: new Date(),
          keyword_ids: ['K1'],
        },
        {
          post_id: 'P2',
          subreddit: 'r/GoogleSlides',
          title: 'Test 2',
          body: 'Body 2',
          author_username: 'user2',
          timestamp: new Date(),
          keyword_ids: ['K2'],
        },
      ];

      const comments: GeneratedComment[] = [
        {
          comment_id: 'C1',
          post_id: 'P1',
          parent_comment_id: null,
          comment_text: 'Comment 1',
          username: 'user2',
          timestamp: new Date(),
        },
        {
          comment_id: 'C2',
          post_id: 'P2',
          parent_comment_id: null,
          comment_text: 'Comment 2',
          username: 'user1',
          timestamp: new Date(),
        },
      ];

      const result = validatePersonaDistribution(posts, comments);
      expect(result.isValid).toBe(true);
    });

    it('should fail when one persona dominates', () => {
      const posts: GeneratedPost[] = [
        {
          post_id: 'P1',
          subreddit: 'r/PowerPoint',
          title: 'Test 1',
          body: 'Body 1',
          author_username: 'user1',
          timestamp: new Date(),
          keyword_ids: ['K1'],
        },
        {
          post_id: 'P2',
          subreddit: 'r/GoogleSlides',
          title: 'Test 2',
          body: 'Body 2',
          author_username: 'user1',
          timestamp: new Date(),
          keyword_ids: ['K2'],
        },
      ];

      const comments: GeneratedComment[] = [
        {
          comment_id: 'C1',
          post_id: 'P1',
          parent_comment_id: null,
          comment_text: 'Comment 1',
          username: 'user1',
          timestamp: new Date(),
        },
        {
          comment_id: 'C2',
          post_id: 'P2',
          parent_comment_id: null,
          comment_text: 'Comment 2',
          username: 'user1',
          timestamp: new Date(),
        },
      ];

      const result = validatePersonaDistribution(posts, comments);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('user1');
    });
  });

  describe('validateCommentThreads', () => {
    it('should pass when comment threads are valid', () => {
      const comments: GeneratedComment[] = [
        {
          comment_id: 'C1',
          post_id: 'P1',
          parent_comment_id: null,
          comment_text: 'First comment',
          username: 'user1',
          timestamp: new Date(),
        },
        {
          comment_id: 'C2',
          post_id: 'P1',
          parent_comment_id: 'C1',
          comment_text: 'Reply to first',
          username: 'user2',
          timestamp: new Date(),
        },
      ];

      const result = validateCommentThreads(comments);
      expect(result.isValid).toBe(true);
    });

    it('should fail when parent comment does not exist', () => {
      const comments: GeneratedComment[] = [
        {
          comment_id: 'C1',
          post_id: 'P1',
          parent_comment_id: 'C99', // Non-existent parent
          comment_text: 'Orphan comment',
          username: 'user1',
          timestamp: new Date(),
        },
      ];

      const result = validateCommentThreads(comments);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('C99');
    });
  });

  describe('validateContentCalendar', () => {
    it('should run all validations and aggregate results', () => {
      const posts: GeneratedPost[] = [
        {
          post_id: 'P1',
          subreddit: 'r/PowerPoint',
          title: 'Test post about AI presentations',
          body: 'I need help finding the best AI presentation tool',
          author_username: 'user1',
          timestamp: new Date(),
          keyword_ids: ['K1'],
        },
      ];

      const comments: GeneratedComment[] = [
        {
          comment_id: 'C1',
          post_id: 'P1',
          parent_comment_id: null,
          comment_text: 'I recommend checking out several options',
          username: 'user2',
          timestamp: new Date(Date.now() + 30 * 60 * 1000), // 30 min later
        },
      ];

      const result = validateContentCalendar(posts, comments);
      expect(result.isValid).toBe(true);
    });
  });
});
