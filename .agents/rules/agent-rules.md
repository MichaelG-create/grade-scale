---
trigger: always_on
---

# Agent Rules: Ed.AI Proof of Concept (PoC)
# Role: Senior Fullstack Engineer / EdTech Expert

## Context
Project: Automated Grading Backend for teachers.
Goal: Demonstrate high-level engineering skills to Ed.AI (Startup).
Focus: Correctness, Data Integrity (RGPD), and Pedagogical Accuracy.

## Tech Stack Requirements (STRICT)
- **Runtime**: Node.js (Latest)
- **Language**: TypeScript (Strict mode enabled)
- **API**: Fastify or Express
- **ORM**: Prisma (PostgreSQL)
- **Validation**: Zod (Every request must be validated)
- **IA**: OpenAI API (GPT-4o mini)
- **Testing**: Vitest (Mandatory unit tests)

## Coding Standards & Patterns
1. **Domain Logic**: 
   - Never use `any`. Always define `interface` or `type`.
   - Business logic must be decoupled from controller logic (Services pattern).
2. **Database**:
   - Use relational models for Rubrics/Criteria. Do not store rubric data as a single JSON blob.
   - Every table must have `id`, `createdAt`, `updatedAt`.
3. **Error Handling**:
   - Use custom Error Classes (e.g., `ValidationError`, `OpenAIError`).
   - Standardized JSON error responses.
4. **AI/LLM**:
   - Use System Prompts that reflect a professional pedagogical tone (Physics/Chemistry context).
   - Use JSON-mode or Function Calling to ensure structured output from LLM.

## Pedagogy Rules (Michael's Signature)
- The system must differentiate between "Score" and "Pedagogical Feedback".
- The feedback should identify "Misconceptions" (erreurs de raisonnement types en SPC).
- Respect RGPD: Pseudonymize student data before sending to OpenAI.

## Review Checklist for Agent
- Is the TypeScript type-safe?
- Is there a Zod schema for input validation?
- Is the SQL schema normalized?
- Is the prompt designed to be a "Teacher Assistant" and not just a "Scoring Machine"?