"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PostCard } from "./post-card";
import { Download, Copy, RefreshCw, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { CalendarResponse } from "@/lib/hooks/use-calendar";

export type CalendarData = CalendarResponse;

interface CalendarDisplayProps {
  calendar: CalendarData;
  onGenerateNew: () => void;
}

export function CalendarDisplay({ calendar, onGenerateNew }: CalendarDisplayProps) {
  const exportToCSV = () => {
    // Posts CSV
    const postsHeaders = ["post_id", "subreddit", "title", "body", "author_username", "timestamp", "keyword_ids"];
    const postsRows = calendar.posts.map((post) => [
      post.post_id,
      post.subreddit,
      `"${post.title.replace(/"/g, '""')}"`,
      `"${post.body.replace(/"/g, '""')}"`,
      post.author_username,
      post.timestamp,
      `"${post.keyword_ids.join(', ')}"`,
    ]);
    const postsCSV = [postsHeaders, ...postsRows].map((row) => row.join(",")).join("\n");

    // Comments CSV
    const commentsHeaders = ["comment_id", "post_id", "parent_comment_id", "comment_text", "username", "timestamp"];
    const commentsRows = calendar.comments.map((comment) => [
      comment.comment_id,
      comment.post_id,
      comment.parent_comment_id || "",
      `"${comment.comment_text.replace(/"/g, '""')}"`,
      comment.username,
      comment.timestamp,
    ]);
    const commentsCSV = [commentsHeaders, ...commentsRows].map((row) => row.join(",")).join("\n");

    // Create and download files
    const downloadFile = (content: string, filename: string) => {
      const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    };

    const timestamp = format(new Date(), "yyyy-MM-dd-HHmmss");
    downloadFile(postsCSV, `${calendar.companyName}-posts-week${calendar.weekNumber}-${timestamp}.csv`);
    downloadFile(commentsCSV, `${calendar.companyName}-comments-week${calendar.weekNumber}-${timestamp}.csv`);
  };

  const copyToClipboard = async () => {
    const text = calendar.posts
      .map((post) => {
        const postComments = calendar.comments.filter((c) => c.post_id === post.post_id);
        return `
${post.subreddit} - ${post.title}
Posted by u/${post.author_username} at ${post.timestamp}
Keywords: ${post.keyword_ids.join(', ')}

${post.body}

Comments (${postComments.length}):
${postComments
  .map((c) => `  - u/${c.username} (${c.timestamp}): ${c.comment_text}`)
  .join("\n")}
        `.trim();
      })
      .join("\n\n" + "=".repeat(80) + "\n\n");

    await navigator.clipboard.writeText(text);
    alert("Calendar copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <span>Week {calendar.weekNumber} Content Calendar</span>
                </div>
              </CardTitle>
              <CardDescription className="text-base">
                {calendar.companyName} • {calendar.posts.length} posts, {calendar.comments.length} comments
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground text-right">
              <p>Generated</p>
              <p className="font-medium">{format(new Date(calendar.generatedAt), "PPpp")}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportToCSV} variant="default">
              <Download className="h-4 w-4 mr-2" />
              Export CSV Files
            </Button>
            <Button onClick={copyToClipboard} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button onClick={onGenerateNew} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate New Calendar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        {calendar.posts.map((post) => {
          const postComments = calendar.comments.filter((c) => c.post_id === post.post_id);
          return <PostCard key={post.post_id} post={post} comments={postComments} />;
        })}
      </div>

      {calendar.posts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No posts generated. Please try again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
