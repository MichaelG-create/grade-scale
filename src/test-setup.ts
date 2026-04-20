// Mock environment variables for Vitest
process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock_db?schema=public";
process.env.DIRECT_URL = "postgresql://mock:mock@localhost:5432/mock_db?schema=public";
process.env.GROQ_API_KEY = "gsk_mock_key_for_testing_purposes_only";
process.env.GROQ_BASE_URL = "https://api.groq.com/openai/v1";
