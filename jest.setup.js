/**
 * Jest setup file
 * Runs before each test suite
 */

// Add any global test setup here
// For example, mocking environment variables for tests

process.env.NEXT_PUBLIC_AI_PROVIDER = 'openai';
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.OPENAI_MODEL = 'gpt-4o';
