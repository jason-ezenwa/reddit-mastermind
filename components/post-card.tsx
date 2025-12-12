"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, Clock } from "lucide-react";
import { format } from "date-fns";
import type { GeneratedPostResponse, GeneratedCommentResponse } from "@/lib/hooks/use-calendar";

export type Post = GeneratedPostResponse;
export type Comment = GeneratedCommentResponse;

interface PostCardProps {
  post: Post;
  comments: Comment[];
}

export function PostCard({ post, comments }: PostCardProps) {
  const keywordsList = post.keyword_ids;

  // Organize comments into threads
  const topLevelComments = comments.filter((c) => !c.parent_comment_id);
  const getCommentReplies = (commentId: string) =>
    comments.filter((c) => c.parent_comment_id === commentId);

  const CommentThread = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const replies = getCommentReplies(comment.comment_id);
    
    return (
      <div className={depth > 0 ? "ml-6 mt-2 border-l-2 border-muted pl-4" : ""}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="font-medium">u/{comment.username}</span>
            <span>•</span>
            <Clock className="h-3 w-3" />
            <span>{format(new Date(comment.timestamp), "MMM d, h:mm a")}</span>
          </div>
          <p className="text-sm">{comment.comment_text}</p>
        </div>
        {replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {replies.map((reply) => (
              <CommentThread key={reply.comment_id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{post.subreddit}</Badge>
              <Badge variant="outline">{post.post_id}</Badge>
              {keywordsList.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
            <h3 className="text-lg font-semibold leading-tight">{post.title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>u/{post.author_username}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{format(new Date(post.timestamp), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{comments.length} comments</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Body */}
        <div className="prose prose-sm max-w-none">
          <p className="text-sm whitespace-pre-wrap">{post.body}</p>
        </div>

        {/* Comments Section */}
        {comments.length > 0 && (
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              <span>Comments</span>
            </div>
            <div className="space-y-4">
              {topLevelComments.map((comment) => (
                <CommentThread key={comment.comment_id} comment={comment} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
