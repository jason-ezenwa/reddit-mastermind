/**
 * Date utility functions for realistic Reddit timestamp generation
 * Uses date-fns for date manipulation
 */

import { 
  addMinutes, 
  addHours, 
  addDays, 
  startOfWeek, 
  format,
  isWeekend,
  setHours,
  setMinutes,
} from 'date-fns';

/**
 * Generate a realistic posting time for a Reddit post
 * Spreads posts across the week, favoring business hours and weekdays
 */
export function generatePostTime(weekStart: Date, postIndex: number, totalPosts: number): Date {
  // Start from the beginning of the week (Monday)
  const baseDate = startOfWeek(weekStart, { weekStartsOn: 1 });
  
  // Distribute posts across 7 days
  const dayOffset = Math.floor((postIndex * 7) / totalPosts);
  let postDate = addDays(baseDate, dayOffset);
  
  // Favor weekdays (70% chance weekday, 30% weekend)
  if (isWeekend(postDate) && Math.random() > 0.3) {
    // Move to next Monday if it's weekend and random check fails
    const daysUntilMonday = postDate.getDay() === 0 ? 1 : 2;
    postDate = addDays(postDate, daysUntilMonday);
  }
  
  // Generate time between 9 AM and 9 PM (peak Reddit hours)
  // With a slight preference for afternoon (2-6 PM)
  const hour = Math.random() < 0.5 
    ? 14 + Math.floor(Math.random() * 4) // 2-6 PM (50% chance)
    : 9 + Math.floor(Math.random() * 12); // 9 AM - 9 PM (50% chance)
  
  const minute = Math.floor(Math.random() * 60);
  
  postDate = setHours(postDate, hour);
  postDate = setMinutes(postDate, minute);
  
  return postDate;
}

/**
 * Generate a realistic comment time relative to post time
 * First comments typically appear 15-60 minutes after post
 */
export function generateFirstCommentTime(postTime: Date): Date {
  // Random delay between 15 and 60 minutes
  const delayMinutes = 15 + Math.floor(Math.random() * 45);
  return addMinutes(postTime, delayMinutes);
}

/**
 * Generate time for a reply comment (responding to another comment)
 * Replies typically appear 5-30 minutes after parent comment
 */
export function generateReplyCommentTime(parentCommentTime: Date): Date {
  // Random delay between 5 and 30 minutes
  const delayMinutes = 5 + Math.floor(Math.random() * 25);
  return addMinutes(parentCommentTime, delayMinutes);
}

/**
 * Generate time for a late comment (appearing hours after post)
 * Late comments appear 1-6 hours after the post
 */
export function generateLateCommentTime(postTime: Date): Date {
  // Random delay between 1 and 6 hours
  const delayHours = 1 + Math.floor(Math.random() * 5);
  const delayMinutes = Math.floor(Math.random() * 60);
  
  let commentTime = addHours(postTime, delayHours);
  commentTime = addMinutes(commentTime, delayMinutes);
  
  return commentTime;
}

/**
 * Format timestamp for CSV output (ISO 8601 format)
 */
export function formatTimestamp(date: Date): string {
  return format(date, "yyyy-MM-dd HH:mm");
}

/**
 * Adjust timestamp to business hours if it falls outside 6 AM - 11 PM
 */
export function adjustToBusinessHours(date: Date): Date {
  const hour = date.getHours();
  
  if (hour < 6) {
    // Move to 9 AM same day
    return setHours(setMinutes(date, 0), 9);
  }
  
  if (hour >= 23) {
    // Move to 9 AM next day
    let adjusted = addDays(date, 1);
    adjusted = setHours(setMinutes(adjusted, 0), 9);
    return adjusted;
  }
  
  return date;
}

/**
 * Calculate time difference in minutes between two dates
 */
export function getMinutesDifference(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60));
}

/**
 * Validate that comment timestamp comes after post timestamp
 */
export function isValidCommentTime(postTime: Date, commentTime: Date): boolean {
  const diffMinutes = getMinutesDifference(postTime, commentTime);
  // Comment should be after post and within 7 days
  return diffMinutes > 0 && diffMinutes < 7 * 24 * 60;
}

/**
 * Get the start of the current week (Monday)
 */
export function getCurrentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

/**
 * Generate a random timestamp within business hours for testing
 */
export function generateRandomBusinessHoursTime(): Date {
  const now = new Date();
  const hour = 9 + Math.floor(Math.random() * 12); // 9 AM - 9 PM
  const minute = Math.floor(Math.random() * 60);
  
  return setMinutes(setHours(now, hour), minute);
}
