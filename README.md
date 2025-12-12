# Reddit Mastermind

AI-powered content calendar generator that creates authentic Reddit posts and comment threads for marketing automation.

## Overview

Reddit Mastermind is a stateless content generation system that produces natural, high-quality Reddit conversations across multiple personas. The system uses OpenAI's GPT models to generate posts and comment threads that sound genuinely human, incorporate target keywords naturally, and follow strict business rules to avoid detection as marketing content.

**Key Principle**: No database persistence. All generation is stateless, producing immediate CSV exports ready for scheduling.

## What It Does

The system takes your company information, Reddit personas, and target keywords as input, then generates:

- **Reddit Posts**: Authentic questions and discussions that naturally incorporate your keywords
- **Comment Threads**: Multi-persona conversations with realistic timing and natural engagement
- **Complete Calendar**: Week-by-week content plan with posts distributed across subreddits

**Output Format**: Two CSV files (posts + comments) ready for import into scheduling tools or manual posting.

## Use Case

Marketing teams can use Reddit Mastermind to:

1. Build authentic presence in relevant subreddits
2. Create searchable content that ranks on Google and gets cited by AI assistants
3. Drive inbound leads through genuine community engagement
4. Maintain consistent Reddit activity without manual content creation

## Features

### Content Generation

- **Natural Language**: AI-generated content that sounds like real Reddit users, not marketing copy
- **Persona-Based**: Each comment comes from a unique persona with consistent writing style
- **Keyword Integration**: Target keywords incorporated naturally into titles and bodies
- **Threaded Conversations**: Nested comment replies with realistic depth and timing
- **Timing Intelligence**: Posts and comments scheduled at realistic intervals (minutes to hours)

### Business Rules Validation

The system enforces strict rules to maintain authenticity:

- **No Overposting**: Maximum 1 post per subreddit per week
- **Topic Diversity**: Prevents duplicate or overly similar posts
- **Realistic Timestamps**: Comments appear at natural intervals, avoiding suspicious patterns
- **Balanced Personas**: Ensures no single persona dominates the conversation
- **Natural Tone**: Content avoids obvious promotional language

### User Interface

- **Modern Design**: Built with Next.js 16, React 19, and shadcn/ui components
- **Form Validation**: Real-time validation using React Hook Form + Zod
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Export Options**: CSV download (2 files) or copy to clipboard
- **Visual Feedback**: Loading states, error messages, and success indicators

## Architecture

### Technology Stack

**Frontend**:
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- shadcn/ui (Radix UI primitives)
- TailwindCSS 4
- React Hook Form + Zod validation
- React Query (TanStack Query)
- date-fns

**Backend**:
- Next.js API Routes
- OpenAI SDK
- AI SDK (Vercel)
- Zod for runtime validation

**No Database**: Pure stateless generation

### System Components

```
┌─────────────────┐
│   Next.js UI    │
│  (React 19)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │
│  (Validation)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Algorithm     │
│ (Business Rules)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Services    │
│ (OpenAI/Groq)   │
└─────────────────┘
```

### Key Directories

```
reddit-mastermind/
├── app/
│   ├── api/calendar/generate/    # API endpoint
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main UI
├── components/
│   ├── company-form.tsx           # Company info input
│   ├── persona-builder.tsx        # Persona management
│   ├── keywords-input.tsx         # Keyword input
│   ├── calendar-display.tsx       # Results display
│   ├── post-card.tsx              # Post/comment rendering
│   └── ui/                        # shadcn components
├── lib/
│   ├── ai/                        # AI service layer
│   │   ├── ai.interface.ts        # Service interface
│   │   ├── ai.service.ts          # Factory
│   │   ├── openai.service.ts      # OpenAI impl
│   │   ├── prompts.ts             # System prompts
│   │   └── schemas.ts             # Zod schemas
│   ├── algorithm/                 # Generation logic
│   │   ├── content-generator.ts   # Main algorithm
│   │   ├── validators.ts          # Business rules
│   │   ├── keyword-strategy.ts    # Keyword selection
│   │   ├── subreddit-strategy.ts  # Subreddit selection
│   │   ├── persona-matcher.ts     # Persona assignment
│   │   └── timestamp-generator.ts # Timing logic
│   ├── hooks/
│   │   └── use-calendar.ts        # React Query hooks
│   ├── schemas/
│   │   └── form-schemas.ts        # Form validation
│   └── utils/
│       └── date.ts                # Date utilities
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- OpenAI API key

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd reddit-mastermind
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create `.env.local`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Optional: Model Selection (default: gpt-4)
AI_MODEL=gpt-4
```

4. **Run development server**

```bash
npm run dev
```

5. **Open browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Step 1: Enter Company Information

- **Company Name**: Your business name
- **Website**: Your domain (auto-adds https://)
- **Description**: Multi-paragraph description including:
  - Your ideal customer profile (ICP) segments
  - Pain points you solve
  - Key value propositions
  - Target audience characteristics
- **Subreddits**: Type subreddit name and press Enter (auto-formats to r/subreddit)
- **Posts Per Week**: Use slider to select 1-7 posts

**Validation**: Minimum 100 characters for description to ensure adequate ICP detail.

### Step 2: Create Personas (Minimum 2)

Each persona represents a Reddit user who will post or comment:

- **Username**: Alphanumeric with underscores/hyphens (e.g., riley_ops)
- **Backstory**: Rich narrative (1000-2000 words recommended) including:
  - Age and profession
  - Reddit usage history
  - Interests and subreddit activity
  - Writing style markers ("honestly," "real talk," etc.)
  - Why they use Reddit
  - Personality traits

**Tip**: More detailed backstories = more authentic writing style mimicry.

### Step 3: Add Keywords

Enter target keywords one per line:

```
best ai presentation maker
alternatives to PowerPoint
presentation automation tools
how to create slides faster
```

The system will:
- Auto-assign IDs (K1, K2, K3...)
- Select 2-3 keywords per post
- Incorporate them naturally into titles and bodies

### Step 4: Generate Calendar

Click "Generate Content Calendar" and wait for AI generation (15-60 seconds).

### Step 5: Export Content

**CSV Export**: Downloads two files:
- `[CompanyName]-posts-week[N]-[timestamp].csv`
- `[CompanyName]-comments-week[N]-[timestamp].csv`

**Clipboard Copy**: Formatted text for quick review.

**CSV Structure**:

**Posts CSV**:
```csv
post_id,subreddit,title,body,author_username,timestamp,keyword_ids
P1,r/PowerPoint,"Best AI tool?","Question...",riley_ops,2025-12-08T14:12:00Z,"K1,K4"
```

**Comments CSV**:
```csv
comment_id,post_id,parent_comment_id,comment_text,username,timestamp
C1,P1,,"I've tried Slideforge...",jordan_consults,2025-12-08T14:33:00Z
C2,P1,C1,"Thanks for the rec!",riley_ops,2025-12-08T14:49:00Z
```

## API Reference

### POST /api/calendar/generate

Generates a content calendar based on input parameters.

**Request Body**:

```typescript
{
  company: {
    name: string;
    website: string;
    description: string;
    subreddits: string[];      // ["r/PowerPoint", "r/GoogleSlides"]
    postsPerWeek: number;      // 1-7
  },
  personas: [
    {
      username: string;        // "riley_ops"
      backstory: string;       // 500-1000 word narrative
    }
  ],
  keywords: [
    {
      keyword_id: string;      // "K1"
      keyword: string;         // "best ai presentation maker"
    }
  ],
  weekNumber: number;          // Default: 1
}
```

**Response** (200 OK):

```typescript
{
  success: true,
  data: {
    weekNumber: number;
    companyName: string;
    posts: [
      {
        post_id: string;
        subreddit: string;
        title: string;
        body: string;
        author_username: string;
        timestamp: string;       // ISO 8601
        keyword_ids: string[];
      }
    ],
    comments: [
      {
        comment_id: string;
        post_id: string;
        parent_comment_id: string | null;
        comment_text: string;
        username: string;
        timestamp: string;       // ISO 8601
      }
    ],
    generatedAt: string;         // ISO 8601
  }
}
```

**Error Response** (400 Bad Request):

```typescript
{
  success: false,
  error: "Invalid input data",
  details: [
    {
      field: "company.description",
      message: "Description must be at least 100 characters"
    }
  ]
}
```

**Error Response** (500 Internal Server Error):

```typescript
{
  success: false,
  error: "Failed to generate calendar",
  message: "AI service unavailable"
}
```

## Configuration

### AI Model Selection

Configure OpenAI model in `.env.local`:

```bash
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4
```

### Available Models

- `gpt-4` (best quality, slower, recommended)
- `gpt-4-turbo` (balanced speed and quality)
- `gpt-3.5-turbo` (faster, lower cost)

## Development

### Project Structure

- **Stateless Design**: No database, no session storage
- **Type Safety**: Full TypeScript coverage with Zod runtime validation
- **Component Architecture**: Modular, reusable React components
- **Form Validation**: React Hook Form + Zod for all inputs
- **API Layer**: Clean separation between UI and generation logic
- **AI Integration**: OpenAI GPT models for natural language generation

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test lib/algorithm/validators.test.ts

# Watch mode
npm test -- --watch
```

### Building for Production

```bash
npm run build
npm start
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Security

### Input Sanitization

All user inputs are sanitized to prevent:
- XSS attacks (script tag removal)
- JavaScript injection
- Event handler injection

### API Security

- Input validation with Zod schemas
- CORS configuration
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Error messages don't expose internal details
- API keys stored in environment variables only

### Best Practices

- No eval() or Function() constructors
- No dangerouslySetInnerHTML
- All inputs controlled by React
- TypeScript strict mode enabled
- No inline event handlers
- CSP-compatible code

## Business Rules

The algorithm enforces these rules automatically:

1. **Overposting Prevention**: Never post twice in the same subreddit within one week
2. **Topic Diversity**: Prevents posts with >70% title similarity
3. **Realistic Timing**: 
   - Posts: Spread across week, mostly business hours (9am-9pm)
   - Comments: 15-60 min after post for first reply, 5-30 min for nested replies
4. **Persona Balance**: No single persona should dominate (max 50% of content)
5. **Natural Engagement**: Mix of supportive, neutral, and questioning comments

## Performance

### Optimization Strategies

- React Query caching prevents redundant requests
- Memoization for expensive calculations
- Automatic code splitting via Next.js
- Tree shaking removes unused components
- Optimized re-renders with React Hook Form

### Expected Generation Time

- 2-3 posts with comments: 15-30 seconds
- 5-7 posts with comments: 45-90 seconds

Timing depends on OpenAI API response time and model selection.

## Troubleshooting

### Common Issues

**"Failed to generate calendar"**
- Check OpenAI API key in `.env.local`
- Verify API key has sufficient credits
- Check network connectivity

**Validation errors**
- Ensure description is at least 100 characters
- Verify at least 2 personas are added
- Check subreddit format (should be r/name)

**Type errors during build**
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and rebuild

### Debug Mode

Enable detailed logging:

```bash
# Set in .env.local
DEBUG=true
```

Check browser console and server logs for detailed generation steps.

## Roadmap

### Planned Features

- Multi-week calendar generation
- Persona templates library
- Keyword suggestions based on industry
- Subreddit recommendations
- Dark mode toggle
- Form state persistence (localStorage)
- Calendar preview before generation
- Scheduling integration (Buffer, Hootsuite)

### Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

This project is licensed under the GPL-3.0 License. See LICENSE file for details.

## Acknowledgments

- Built with Next.js, React, and TypeScript
- UI components from shadcn/ui
- AI generation powered by OpenAI
- Form validation with React Hook Form and Zod

## Support

For issues, questions, or feature requests, please open an issue on the repository.

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: Production Ready
