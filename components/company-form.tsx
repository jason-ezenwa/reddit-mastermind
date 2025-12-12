"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
import { X } from "lucide-react";
import { companyFormSchema, type CompanyFormValues } from "@/lib/schemas/form-schemas";

export interface CompanyInfo {
  name: string;
  website: string;
  description: string;
  subreddits: string[];
  postsPerWeek: number;
}

interface CompanyFormProps {
  value: CompanyInfo;
  onChange: (value: CompanyInfo) => void;
}

export function CompanyForm({ value, onChange }: CompanyFormProps) {
  const [subredditInput, setSubredditInput] = React.useState("");
  const [subredditError, setSubredditError] = React.useState<string | null>(null);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: value,
    values: value, // Keep form in sync with parent state
  });

  // Watch for changes and sync with parent
  React.useEffect(() => {
    const subscription = form.watch((formData) => {
      if (formData.name !== undefined) {
        onChange(formData as CompanyInfo);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleAddSubreddit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && subredditInput.trim()) {
      e.preventDefault();
      setSubredditError(null);

      // Format subreddit
      let formattedSubreddit = subredditInput.trim();
      if (formattedSubreddit.startsWith("/r/")) {
        formattedSubreddit = formattedSubreddit.substring(1);
      } else if (!formattedSubreddit.startsWith("r/")) {
        formattedSubreddit = `r/${formattedSubreddit}`;
      }

      // Validate format
      if (!/^r\/[a-zA-Z0-9_]+$/.test(formattedSubreddit)) {
        setSubredditError("Invalid subreddit format. Use letters, numbers, and underscores only");
        return;
      }

      // Check for duplicates
      const currentSubreddits = form.getValues("subreddits");
      if (currentSubreddits.includes(formattedSubreddit)) {
        setSubredditError("This subreddit is already added");
        return;
      }

      // Add subreddit
      form.setValue("subreddits", [...currentSubreddits, formattedSubreddit], {
        shouldValidate: true,
      });
      setSubredditInput("");
    }
  };

  const handleRemoveSubreddit = (subreddit: string) => {
    const currentSubreddits = form.getValues("subreddits");
    form.setValue(
      "subreddits",
      currentSubreddits.filter((s) => s !== subreddit),
      { shouldValidate: true }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>
          Enter your company details and target subreddits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Slideforge" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., slideforge.ai or https://slideforge.ai"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your domain (will auto-add https://)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Multi-paragraph company description including ICP segments, pain points, and value propositions..."
                      className="min-h-[150px] max-h-[300px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include your ideal customer profile (ICP) segments and key
                    value propositions (min 100 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subreddits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Subreddits</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        placeholder="Type a subreddit and press Enter (e.g., PowerPoint or r/PowerPoint)"
                        value={subredditInput}
                        onChange={(e) => {
                          setSubredditInput(e.target.value);
                          setSubredditError(null);
                        }}
                        onKeyDown={handleAddSubreddit}
                      />
                      {subredditError && (
                        <p className="text-sm font-medium text-destructive">
                          {subredditError}
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Press Enter to add each subreddit. Formatter will
                    auto-correct to r/subreddit
                  </FormDescription>
                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {field.value.map((subreddit) => (
                        <Badge
                          key={subreddit}
                          variant="secondary"
                          className="gap-1">
                          {subreddit}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubreddit(subreddit)}
                            className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postsPerWeek"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center mb-2">
                    <FormLabel>Posts Per Week</FormLabel>
                    <span className="text-sm font-semibold">{field.value}</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={1}
                      max={7}
                      step={1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Recommended: 2-4 posts per week to avoid overposting
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
