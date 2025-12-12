import type { IAiService } from "./ai.interface";
import { OpenAIService } from "./openai.service";
import type { AIProvider } from "./types";

export function getAiService(): IAiService {
  const provider = (process.env.NEXT_PUBLIC_AI_PROVIDER ||
    "openai") as AIProvider;

  switch (provider) {
    case "openai":
      return new OpenAIService(process.env.OPENAI_MODEL || "gpt-4o");
    default:
      console.warn(`Unknown AI provider: ${provider}, defaulting to OpenAI`);
      return new OpenAIService();
  }
}

/**
 * Create a specific AI service instance for testing
 */
export function createAiService(
  provider: AIProvider,
  model?: string
): IAiService {
  switch (provider) {
    case "openai":
      return new OpenAIService(model);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// Export all AI service components
export * from "./ai.interface";
export * from "./types";
export * from "./schemas";
export * from "./openai.service";
