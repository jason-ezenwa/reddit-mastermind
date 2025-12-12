# Reddit Mastermind Backend Documentation

## Overview

The Reddit Mastermind backend is an AI-powered content generation system that creates authentic Reddit posts and comment threads for marketing automation. It uses OpenAI or Groq to generate natural, high-quality conversations across multiple personas with built-in business rule validation.

## Architecture

### Core Components

#### 1. AI Service Layer (`lib/ai/`)

Provides abstraction over AI providers (OpenAI and Groq) with structured output generation.

**Files:**
- `ai.interface.ts` - Interface defining AI service contract
- `ai.service.ts` - Factory for creating AI service instances
- `openai.service.ts` - OpenAI implementation using GPT-4
- `groq.service.ts` - Groq implementation using Llama models
- `prompts.ts` - System prompts for post and comment generation
- `types.ts` - TypeScript types for AI requests/responses
- `schemas.ts` - Zod schemas for validation

**Usage:**
```typescript
import { getAiService } from '@/lib/ai/ai.service';

const aiService = getAiService(); // Uses NEXT_PUBLIC_AI_PROVIDER env var
const post = await aiService.generatePost({
  persona,
  subreddit,
  keywords,
  company,
});
```

#### 2. Algorithm Components (`lib/algorithm/`)

Core content generation logic with smart strategies and validation.

**Files:**
- `content-generator.ts` - Main orchestration logic
- `keyword-strategy.ts` - Smart keyword selection and rotation
- `subreddit-strategy.ts` - Subreddit selection with overposting prevention
- `persona-matcher.ts` - Balanced persona distribution
- `validators.ts` - Business rules validation

**Key Features:**
- Prevents overposting (max 1 post per subreddit per week)
- Ensures topic diversity (no duplicate content)
- Validates realistic timestamps
- Balances persona distribution
- Validates comment thread structure

#### 3. Date Utilities (`lib/utils/date.ts`)

Realistic timestamp generation for Reddit activity patterns.

**Functions:**
- `generatePostTime()` - Post timestamps spread across week
- `generateFirstCommentTime()` - First comment 15-60 min after post
- `generateReplyCommentTime()` - Replies 5-30 min after parent
- `generateLateCommentTime()` - Late comments 1-6 hours after post
- `adjustToBusinessHours()` - Ensures reasonable posting times

#### 4. API Routes (`app/api/calendar/generate/`)

Single stateless endpoint for calendar generation.

**Endpoint:**
```
POST /api/calendar/generate
```

**Request Body:**
```typescript
{
  company: {
    name: string;
    website: string;
    description: string;
    subreddits: string[];
    postsPerWeek: number;
  },
  personas: Array<{
    username: string;
    backstory: string;
  }>,
  keywords: Array<{
    keyword_id: string;
    keyword: string;
  }>,
  weekNumber?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    weekNumber: number;
    companyName: string;
    posts: Array<{
      post_id: string;
      subreddit: string;
      title: string;
      body: string;
      author_username: string;
      timestamp: string;
      keyword_ids: string[];
    }>;
    comments: Array<{
      comment_id: string;
      post_id: string;
      parent_comment_id: string | null;
      comment_text: string;
      username: string;
      timestamp: string;
    }>;
    generatedAt: string;
  }
}
```

#### 5. React Query Hooks (`lib/hooks/`)

Type-safe frontend integration with loading states and error handling.

**Hooks:**
```typescript
import { useGenerateCalendar } from '@/lib/hooks/use-calendar';

const generateCalendar = useGenerateCalendar();

generateCalendar.mutate(formData, {
  onSuccess: (result) => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  }
});
```

**Utilities:**
- `formatCalendarAsCSV()` - Export calendar to CSV format
- `downloadCalendarAsCSV()` - Download CSV files
- `copyCalendarToClipboard()` - Copy as formatted text

## Security Features

### Input Sanitization

All user input is sanitized to prevent XSS attacks:
- Removes script tags
- Strips javascript: protocol
- Removes inline event handlers
- Validates against Zod schemas

### API Security Headers

```typescript
'X-Content-Type-Options': 'nosniff',
'X-Frame-Options': 'DENY',
'X-XSS-Protection': '1; mode=block',
```

### Environment Variables

API keys are never exposed to the client:
- `OPENAI_API_KEY` - Server-side only
- `GROQ_API_KEY` - Server-side only
- `NEXT_PUBLIC_AI_PROVIDER` - Client-side (provider selection)

## Configuration

### Environment Variables

Create `.env.local` file:

```bash
# AI Provider (openai or groq)
NEXT_PUBLIC_AI_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Groq Configuration (alternative)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

### Switching AI Providers

To switch between OpenAI and Groq, simply change the `NEXT_PUBLIC_AI_PROVIDER` environment variable:

```bash
# Use OpenAI (default)
NEXT_PUBLIC_AI_PROVIDER=openai

# Use Groq (faster, cheaper)
NEXT_PUBLIC_AI_PROVIDER=groq
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- validators.test.ts
```

### Test Coverage

The backend includes comprehensive test coverage for:
- Business rules validation
- Keyword selection strategy
- Date utilities
- Timestamp validation
- Persona distribution
- Comment thread structure

### Test Files

- `lib/algorithm/validators.test.ts` - Validation logic tests
- `lib/algorithm/keyword-strategy.test.ts` - Keyword strategy tests
- `lib/utils/date.test.ts` - Date utility tests

## Business Rules

### 1. Overposting Prevention

**Rule:** Maximum 1 post per subreddit per week

**Implementation:** `SubredditStrategy` tracks posts per subreddit and prevents duplicates.

**Validation:** `validateNoOverposting()` checks all posts.

### 2. Topic Diversity

**Rule:** Posts must have diverse content (< 70% similarity)

**Implementation:** Jaccard similarity on post titles.

**Validation:** `validateTopicDiversity()` detects duplicates.

### 3. Realistic Timestamps

**Rule:** Posts during business hours (9 AM - 9 PM), comments after posts

**Implementation:** Date utilities generate realistic timing patterns.

**Validation:** `validateTimestamps()` ensures proper sequencing.

### 4. Persona Balance

**Rule:** No single persona dominates (< 50% of content)

**Implementation:** `PersonaMatcher` rotates personas fairly.

**Validation:** `validatePersonaDistribution()` checks balance.

### 5. Comment Thread Structure

**Rule:** Comments reference valid parents, no circular references

**Implementation:** Comment plans track parent-child relationships.

**Validation:** `validateCommentThreads()` verifies structure.

## Content Generation Flow

### Phase 1: Input Processing & Planning

1. Validate input data against Zod schemas
2. Extract company ICP segments
3. Create weekly post plan:
   - Select subreddit (round-robin)
   - Select 2-3 keywords
   - Assign post author
   - Generate timestamp

### Phase 2: Post Generation

For each planned post:
1. Build AI context with persona, subreddit, keywords
2. Generate authentic Reddit post via AI
3. Structure output with metadata

### Phase 3: Comment Thread Generation

For each post:
1. Determine comment count (2-4)
2. Select commenting personas
3. Plan comment structure (depth, timing)
4. Generate each comment via AI
5. Calculate realistic timestamps

### Phase 4: Business Rules Validation

1. Check overposting
2. Detect topic overlap
3. Validate timestamps
4. Validate persona distribution
5. Validate comment threads
6. Fix common issues automatically

### Phase 5: Output Assembly

1. Format posts and comments
2. Return complete calendar
3. No database persistence (stateless)

## Performance Considerations

### Rate Limiting

Small delays (500ms) between AI calls to prevent rate limiting:

```typescript
await this.sleep(500);
```

### Parallel Processing

Currently sequential for reliability. Future optimization could parallelize:
- Multiple post generation
- Comment generation per post

### Caching

No caching implemented (stateless generation). Consider caching:
- Company ICP analysis
- Persona writing style analysis

## Error Handling

### API Errors

```typescript
try {
  const calendar = await generator.generate(input);
} catch (error) {
  // User-friendly error without exposing internals
  return NextResponse.json({
    success: false,
    error: 'Failed to generate calendar',
    message: error.message
  }, { status: 500 });
}
```

### Validation Errors

```typescript
if (!validationResult.success) {
  return NextResponse.json({
    success: false,
    error: 'Invalid input data',
    details: validationResult.error.errors
  }, { status: 400 });
}
```

### AI Service Errors

Automatic retry logic in React Query:

```typescript
mutations: {
  retry: 1, // Retry once on failure
}
```

## Monitoring & Logging

### Console Logging

Key events are logged for debugging:

```typescript
console.log(`Generating calendar for ${company.name}...`);
console.log(`Using AI provider: ${aiService.getProviderName()}`);
console.log(`Generated ${posts.length} posts, ${comments.length} comments`);
```

### Validation Warnings

Non-critical issues logged as warnings:

```typescript
if (validation.warnings.length > 0) {
  console.warn('Validation warnings:', validation.warnings);
}
```

## Future Enhancements

### Potential Improvements

1. **Multi-week Generation** - Generate multiple weeks at once
2. **Persona Style Learning** - Analyze existing Reddit users
3. **Semantic Keyword Matching** - Use embeddings for keyword compatibility
4. **A/B Testing** - Generate multiple variants and score quality
5. **Real-time Validation** - Stream validation results during generation
6. **Persistent State** - Optional database for calendar history
7. **Analytics Dashboard** - Track generation metrics and quality
8. **Custom Rules Engine** - User-defined business rules

### Scalability

For high-volume usage:
1. Implement request queuing
2. Add Redis for distributed rate limiting
3. Horizontal scaling with load balancer
4. Separate AI service into microservice
5. Add CDN for static assets

## Troubleshooting

### Issue: "API key not found"

**Solution:** Ensure `.env.local` has the correct API key:
```bash
OPENAI_API_KEY=sk-...
```

### Issue: "Validation failed: overposting detected"

**Solution:** Reduce `postsPerWeek` or add more subreddits.

### Issue: "Rate limit exceeded"

**Solution:** Increase delay between AI calls in `content-generator.ts`:
```typescript
await this.sleep(1000); // Increase from 500ms to 1000ms
```

### Issue: "Posts are too similar"

**Solution:** The AI might need more diverse prompts. Check `prompts.ts` and add more variety instructions.

## Contributing

When adding new features:

1. Add Zod schema for validation
2. Implement business logic with proper typing
3. Add comprehensive tests
4. Update documentation
5. Follow security best practices
6. Test with both OpenAI and Groq

## License

GPL-3.0
