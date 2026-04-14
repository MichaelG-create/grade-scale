import { z } from 'zod';

export const AICriterionEvaluationSchema = z.object({
  criterionId: z.uuid(),
  score: z.number(),
  feedback: z.string(),
  misconceptions: z.string().optional(),
});

export const AIEvaluationResponseSchema = z.object({
  totalScore: z.number(),
  generalFeedback: z.string(),
  misconceptions: z.string().optional(),
  criteriaEvaluations: z.array(AICriterionEvaluationSchema),
});

export type AIEvaluationResponse = z.infer<typeof AIEvaluationResponseSchema>;
