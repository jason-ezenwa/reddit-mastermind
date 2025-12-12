/**
 * Unit tests for date utilities
 */

import {
  generatePostTime,
  generateFirstCommentTime,
  generateReplyCommentTime,
  generateLateCommentTime,
  adjustToBusinessHours,
  isValidCommentTime,
  getMinutesDifference,
  formatTimestamp,
} from './date';
import { startOfWeek } from 'date-fns';

describe('Date Utilities', () => {
  describe('generatePostTime', () => {
    it('should generate timestamps within a week', () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const timestamps: Date[] = [];

      for (let i = 0; i < 5; i++) {
        const timestamp = generatePostTime(weekStart, i, 5);
        timestamps.push(timestamp);
      }

      // All timestamps should be after week start
      timestamps.forEach(ts => {
        expect(ts.getTime()).toBeGreaterThanOrEqual(weekStart.getTime());
      });

      // Timestamps should be spread across the week
      const uniqueDays = new Set(timestamps.map(ts => ts.getDay()));
      expect(uniqueDays.size).toBeGreaterThan(1);
    });

    it('should generate timestamps during business hours', () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const timestamp = generatePostTime(weekStart, 0, 1);
      const hour = timestamp.getHours();

      // Should be between 9 AM and 9 PM
      expect(hour).toBeGreaterThanOrEqual(9);
      expect(hour).toBeLessThan(21);
    });
  });

  describe('generateFirstCommentTime', () => {
    it('should generate comment time 15-60 minutes after post', () => {
      const postTime = new Date();
      const commentTime = generateFirstCommentTime(postTime);
      const diffMinutes = getMinutesDifference(postTime, commentTime);

      expect(diffMinutes).toBeGreaterThanOrEqual(15);
      expect(diffMinutes).toBeLessThanOrEqual(60);
    });
  });

  describe('generateReplyCommentTime', () => {
    it('should generate reply time 5-30 minutes after parent', () => {
      const parentTime = new Date();
      const replyTime = generateReplyCommentTime(parentTime);
      const diffMinutes = getMinutesDifference(parentTime, replyTime);

      expect(diffMinutes).toBeGreaterThanOrEqual(5);
      expect(diffMinutes).toBeLessThanOrEqual(30);
    });
  });

  describe('generateLateCommentTime', () => {
    it('should generate late comment 1-6 hours after post', () => {
      const postTime = new Date();
      const lateTime = generateLateCommentTime(postTime);
      const diffMinutes = getMinutesDifference(postTime, lateTime);

      expect(diffMinutes).toBeGreaterThanOrEqual(60); // At least 1 hour
      expect(diffMinutes).toBeLessThanOrEqual(6 * 60 + 60); // At most 7 hours
    });
  });

  describe('adjustToBusinessHours', () => {
    it('should move early morning times to 9 AM', () => {
      const earlyTime = new Date();
      earlyTime.setHours(3, 0, 0, 0); // 3 AM

      const adjusted = adjustToBusinessHours(earlyTime);
      expect(adjusted.getHours()).toBe(9);
    });

    it('should move late night times to next day 9 AM', () => {
      const lateTime = new Date();
      lateTime.setHours(23, 30, 0, 0); // 11:30 PM

      const adjusted = adjustToBusinessHours(lateTime);
      expect(adjusted.getHours()).toBe(9);
      expect(adjusted.getDate()).toBeGreaterThan(lateTime.getDate());
    });

    it('should not change times within business hours', () => {
      const normalTime = new Date();
      normalTime.setHours(14, 0, 0, 0); // 2 PM

      const adjusted = adjustToBusinessHours(normalTime);
      expect(adjusted.getHours()).toBe(14);
    });
  });

  describe('isValidCommentTime', () => {
    it('should return true for valid comment timing', () => {
      const postTime = new Date();
      const commentTime = new Date(postTime.getTime() + 30 * 60 * 1000); // 30 min later

      expect(isValidCommentTime(postTime, commentTime)).toBe(true);
    });

    it('should return false if comment is before post', () => {
      const postTime = new Date();
      const commentTime = new Date(postTime.getTime() - 30 * 60 * 1000); // 30 min before

      expect(isValidCommentTime(postTime, commentTime)).toBe(false);
    });

    it('should return false if comment is more than 7 days after post', () => {
      const postTime = new Date();
      const commentTime = new Date(postTime.getTime() + 8 * 24 * 60 * 60 * 1000); // 8 days later

      expect(isValidCommentTime(postTime, commentTime)).toBe(false);
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp correctly', () => {
      const date = new Date('2025-12-10T14:30:00');
      const formatted = formatTimestamp(date);

      expect(formatted).toMatch(/2025-12-10 \d{2}:\d{2}/);
    });
  });

  describe('getMinutesDifference', () => {
    it('should calculate minutes difference correctly', () => {
      const date1 = new Date('2025-12-10T14:00:00');
      const date2 = new Date('2025-12-10T14:45:00');

      const diff = getMinutesDifference(date1, date2);
      expect(diff).toBe(45);
    });
  });
});
