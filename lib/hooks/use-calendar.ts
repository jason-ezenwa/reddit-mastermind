import { useMutation } from '@tanstack/react-query';
import type { CalendarInput } from '../ai/schemas';

/**
 * API Response types
 */
export interface GeneratedPostResponse {
  post_id: string;
  subreddit: string;
  title: string;
  body: string;
  author_username: string;
  timestamp: string;
  keyword_ids: string[];
}

export interface GeneratedCommentResponse {
  comment_id: string;
  post_id: string;
  parent_comment_id: string | null;
  comment_text: string;
  username: string;
  timestamp: string;
}

export interface CalendarResponse {
  weekNumber: number;
  companyName: string;
  posts: GeneratedPostResponse[];
  comments: GeneratedCommentResponse[];
  generatedAt: string;
}

export interface ApiResponse {
  success: boolean;
  data?: CalendarResponse;
  error?: string;
  message?: string;
  details?: Array<{ field: string; message: string }>;
}

/**
 * Hook for generating content calendar
 */
export function useGenerateCalendar() {
  return useMutation({
    mutationFn: async (input: CalendarInput): Promise<CalendarResponse> => {
      const response = await fetch('/api/calendar/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        // Handle validation errors
        if (result.details) {
          const errorMessages = result.details
            .map(d => `${d.field}: ${d.message}`)
            .join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }

        throw new Error(result.message || result.error || 'Failed to generate calendar');
      }

      if (!result.data) {
        throw new Error('No data returned from API');
      }

      return result.data;
    },
  });
}

/**
 * Export utility function to format calendar for CSV download
 */
export function formatCalendarAsCSV(calendar: CalendarResponse): {
  postsCSV: string;
  commentsCSV: string;
} {
  // Format posts as CSV
  const postsHeaders = ['post_id', 'subreddit', 'title', 'body', 'author_username', 'timestamp', 'keyword_ids'];
  const postsRows = calendar.posts.map(post => [
    post.post_id,
    post.subreddit,
    escapeCsvValue(post.title),
    escapeCsvValue(post.body),
    post.author_username,
    post.timestamp,
    `"${post.keyword_ids.join(', ')}"`,
  ]);
  const postsCSV = [
    postsHeaders.join(','),
    ...postsRows.map(row => row.join(',')),
  ].join('\n');

  // Format comments as CSV
  const commentsHeaders = ['comment_id', 'post_id', 'parent_comment_id', 'comment_text', 'username', 'timestamp'];
  const commentsRows = calendar.comments.map(comment => [
    comment.comment_id,
    comment.post_id,
    comment.parent_comment_id || '',
    escapeCsvValue(comment.comment_text),
    comment.username,
    comment.timestamp,
  ]);
  const commentsCSV = [
    commentsHeaders.join(','),
    ...commentsRows.map(row => row.join(',')),
  ].join('\n');

  return { postsCSV, commentsCSV };
}

/**
 * Escape CSV values to handle commas, quotes, and newlines
 */
function escapeCsvValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download calendar as CSV files
 */
export function downloadCalendarAsCSV(calendar: CalendarResponse): void {
  const { postsCSV, commentsCSV } = formatCalendarAsCSV(calendar);

  // Download posts CSV
  downloadFile(
    postsCSV,
    `${calendar.companyName}_week${calendar.weekNumber}_posts.csv`,
    'text/csv'
  );

  // Download comments CSV
  downloadFile(
    commentsCSV,
    `${calendar.companyName}_week${calendar.weekNumber}_comments.csv`,
    'text/csv'
  );
}

/**
 * Download a file to the user's computer
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy calendar data to clipboard as formatted text
 */
export async function copyCalendarToClipboard(calendar: CalendarResponse): Promise<void> {
  const text = formatCalendarAsText(calendar);
  await navigator.clipboard.writeText(text);
}

/**
 * Format calendar as readable text
 */
function formatCalendarAsText(calendar: CalendarResponse): string {
  let text = `${calendar.companyName} - Week ${calendar.weekNumber} Content Calendar\n`;
  text += `Generated: ${new Date(calendar.generatedAt).toLocaleString()}\n\n`;
  text += `===== POSTS (${calendar.posts.length}) =====\n\n`;

  calendar.posts.forEach(post => {
    text += `[${post.post_id}] ${post.subreddit}\n`;
    text += `Title: ${post.title}\n`;
    text += `Author: ${post.author_username}\n`;
    text += `Time: ${new Date(post.timestamp).toLocaleString()}\n`;
    text += `Keywords: ${post.keyword_ids.join(', ')}\n`;
    text += `Body:\n${post.body}\n\n`;

    // Add comments for this post
    const postComments = calendar.comments.filter(c => c.post_id === post.post_id);
    if (postComments.length > 0) {
      text += `  Comments (${postComments.length}):\n`;
      postComments.forEach(comment => {
        const indent = comment.parent_comment_id ? '    ' : '  ';
        text += `${indent}[${comment.comment_id}] ${comment.username}: ${comment.comment_text}\n`;
      });
      text += '\n';
    }

    text += '---\n\n';
  });

  return text;
}
