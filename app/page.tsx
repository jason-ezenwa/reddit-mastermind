"use client";

import * as React from "react";
import { CompanyForm, type CompanyInfo } from "@/components/company-form";
import { PersonaBuilder, type Persona } from "@/components/persona-builder";
import { KeywordsInput, type Keyword } from "@/components/keywords-input";
import {
  CalendarDisplay,
  type CalendarData,
} from "@/components/calendar-display";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGenerateCalendar } from "@/lib/hooks/use-calendar";
import { Sparkles, AlertCircle, Loader2 } from "lucide-react";

export default function Home() {
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo>({
    name: "",
    website: "",
    description: "",
    subreddits: [],
    postsPerWeek: 3,
  });

  const [personas, setPersonas] = React.useState<Persona[]>([]);
  const [keywords, setKeywords] = React.useState<Keyword[]>([]);
  const [calendar, setCalendar] = React.useState<CalendarData | null>(null);
  const [currentWeek, setCurrentWeek] = React.useState(1);

  const generateCalendar = useGenerateCalendar();

  const canGenerate = React.useMemo(() => {
    return (
      companyInfo.name.trim() &&
      companyInfo.website.trim() &&
      companyInfo.description.trim() &&
      companyInfo.subreddits.length > 0 &&
      personas.length >= 2 &&
      keywords.length > 0
    );
  }, [companyInfo, personas, keywords]);

  const handleGenerate = () => {
    if (!canGenerate) return;

    generateCalendar.mutate(
      {
        company: companyInfo,
        personas,
        keywords,
        weekNumber: currentWeek,
      },
      {
        onSuccess: (data) => {
          setCalendar(data);
          // Scroll to calendar
          setTimeout(() => {
            document.getElementById("calendar-results")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        },
      }
    );
  };

  const handleGenerateNew = () => {
    setCalendar(null);
    setCurrentWeek((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Reddit Mastermind</h1>
                <p className="text-xs text-muted-foreground">
                  AI Content Calendar Generator
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {!calendar ? (
          <>
            {/* Input Section */}
            <div className="space-y-8">
              {/* Description */}
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">
                  Generate Authentic Reddit Marketing Content
                </h2>
                <p className="text-lg text-muted-foreground">
                  Create a week of Reddit posts and comment threads that sound
                  natural, engage communities, and drive inbound leads through
                  AI-powered personas.
                </p>
              </div>

              <Separator />

              {/* Forms Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <CompanyForm value={companyInfo} onChange={setCompanyInfo} />
                  <KeywordsInput keywords={keywords} onChange={setKeywords} />
                </div>
                <div>
                  <PersonaBuilder personas={personas} onChange={setPersonas} />
                </div>
              </div>

              {/* Validation Messages */}
              {!canGenerate && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <p className="font-medium text-amber-900 dark:text-amber-200">
                        Complete the following to generate your calendar:
                      </p>
                      <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
                        {!companyInfo.name.trim() && (
                          <li>Enter company name</li>
                        )}
                        {!companyInfo.website.trim() && (
                          <li>Enter company website</li>
                        )}
                        {!companyInfo.description.trim() && (
                          <li>Add company description with ICP</li>
                        )}
                        {companyInfo.subreddits.length === 0 && (
                          <li>Add at least one target subreddit</li>
                        )}
                        {personas.length < 3 && (
                          <li>
                            Create at least 3 personas (current:{" "}
                            {personas.length})
                          </li>
                        )}
                        {keywords.length === 0 && <li>Add target keywords</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handleGenerate}
                  disabled={!canGenerate || generateCalendar.isPending}
                  className="min-w-[250px] text-lg h-14">
                  {generateCalendar.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Calendar...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Week {currentWeek} Content Calendar
                    </>
                  )}
                </Button>
              </div>

              {/* Error Display */}
              {generateCalendar.isError && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-destructive">
                        Failed to generate calendar
                      </p>
                      <p className="text-sm text-destructive/90 mt-1">
                        {generateCalendar.error?.message ||
                          "An unexpected error occurred. Please try again."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Calendar Results */}
            <div id="calendar-results">
              <CalendarDisplay
                calendar={calendar}
                onGenerateNew={handleGenerateNew}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Reddit Mastermind - Built with AI to create authentic, engaging
            Reddit content.
          </p>
        </div>
      </footer>
    </div>
  );
}
