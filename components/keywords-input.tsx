"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { keywordsFormSchema, type KeywordsFormValues } from "@/lib/schemas/form-schemas";

export interface Keyword {
  keyword_id: string;
  keyword: string;
}

interface KeywordsInputProps {
  keywords: Keyword[];
  onChange: (keywords: Keyword[]) => void;
}

export function KeywordsInput({ keywords, onChange }: KeywordsInputProps) {
  const form = useForm<KeywordsFormValues>({
    resolver: zodResolver(keywordsFormSchema),
    defaultValues: {
      keywordsText: keywords.map((k) => k.keyword).join("\n"),
    },
  });

  // Watch for changes
  React.useEffect(() => {
    const subscription = form.watch((formData) => {
      if (formData.keywordsText !== undefined) {
        parseKeywords(formData.keywordsText);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const parseKeywords = (text: string) => {
    // Parse keywords from text (one per line)
    const lines = text.split("\n").filter((line) => line.trim());
    const parsedKeywords: Keyword[] = lines.map((line, index) => ({
      keyword_id: `K${index + 1}`,
      keyword: line.trim(),
    }));

    // Only update if different
    const currentKeywords = JSON.stringify(keywords);
    const newKeywords = JSON.stringify(parsedKeywords);
    if (currentKeywords !== newKeywords) {
      onChange(parsedKeywords);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Target Keywords</CardTitle>
        <CardDescription>
          Enter keywords you want to naturally incorporate into posts (one per
          line)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="keywordsText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="best ai presentation maker&#10;alternatives to PowerPoint&#10;how to create slides faster&#10;presentation design tips"
                      className="min-h-[150px] max-h-[300px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Each line becomes a keyword. 2-3 keywords will be selected
                    per post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {keywords.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">
                  Parsed Keywords ({keywords.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <Badge
                      key={kw.keyword_id}
                      variant="outline"
                      className="font-normal">
                      {kw.keyword_id}: {kw.keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {keywords.length === 0 && form.watch("keywordsText").trim() && (
              <div className="rounded-lg bg-muted p-3 border">
                <p className="text-sm text-muted-foreground">
                  No valid keywords detected. Ensure each keyword is on a
                  separate line.
                </p>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
