"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { Pencil, Plus, Trash2, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  personaFormSchema,
  type PersonaFormValues,
} from "@/lib/schemas/form-schemas";

export interface Persona {
  username: string;
  backstory: string;
}

interface PersonaBuilderProps {
  personas: Persona[];
  onChange: (personas: Persona[]) => void;
}

export function PersonaBuilder({ personas, onChange }: PersonaBuilderProps) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaFormSchema),
    defaultValues: {
      username: "",
      backstory: "",
    },
  });

  const handleAddPersona = (data: PersonaFormValues) => {
    if (editingIndex !== null) {
      const updated = [...personas];
      updated[editingIndex] = data;
      onChange(updated);
      setEditingIndex(null);
    } else {
      onChange([...personas, data]);
    }
    form.reset();
  };

  const handleEditPersona = (index: number) => {
    setEditingIndex(index);
    form.reset(personas[index]);
  };

  const handleDeletePersona = (index: number) => {
    onChange(personas.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      form.reset();
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reddit Personas</CardTitle>
        <CardDescription>
          Create authentic Reddit user personas with detailed backstories
          (minimum 3 required)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Personas */}
        {personas.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Your Personas ({personas.length})
              </p>
              {personas.length >= 3 && (
                <Badge variant="default" className="text-xs">
                  ✓ Minimum met
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {personas.map((persona, index) => (
                <div
                  key={index}
                  className={`flex items-start justify-between p-3 rounded-lg border ${
                    editingIndex === index
                      ? "border-primary bg-accent"
                      : "border-border hover:border-muted-foreground/50"
                  } transition-colors`}>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <User className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">
                          u/{persona.username}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {persona.backstory.length} chars
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {persona.backstory}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPersona(index)}
                      className="h-8 w-8 p-0">
                      <span className="sr-only">Edit</span>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePersona(index)}
                      className="h-8 w-8 p-0 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {personas.length > 0 && <Separator />}

        {/* Add/Edit Persona Form */}
        <div className="space-y-4">
          <p className="text-sm font-medium">
            {editingIndex !== null ? "Edit Persona" : "Add New Persona"}
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddPersona)}
              className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Username</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          u/
                        </span>
                        <Input placeholder="riley_ops" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="backstory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Backstory (Rich, detailed narrative)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Riley is a 28-year-old operations manager at a mid-sized tech startup in Austin. They discovered Reddit during college and have been an active member for 6 years. Riley frequently posts in productivity, startup, and workflow optimization subreddits. Their writing style is casual but professional, often using phrases like 'honestly' and 'real talk.' They're genuinely curious about tools that can streamline work processes..."
                        className="min-h-[180px] max-h-[300px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include age, profession, interests, writing style markers,
                      and why they use Reddit (min 100 characters, 1000-2000
                      recommended)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingIndex !== null ? (
                    <span>Update Persona</span>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Add Persona</span>
                    </>
                  )}
                </Button>
                {editingIndex !== null && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>

        {personas.length < 3 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-900">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Minimum 3 personas required for authentic conversations (
              {personas.length}/3)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
