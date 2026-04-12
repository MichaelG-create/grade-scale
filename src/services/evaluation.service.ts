import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { prisma } from '../utils/prisma';
import { AIEvaluationResponseSchema } from '../schemas/evaluation.schema';

export class EvaluationService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async evaluateSubmission(submissionId: string) {
    // 1. Fetch submission with context
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            rubrics: {
              include: { criteria: true }
            }
          }
        }
      }
    });

    if (!submission) throw new Error("Submission not found");
    
    const rubric = submission.question.rubrics[0];
    if (!rubric) throw new Error("No rubric found for this question");

    // 2. Mark as PROCESSING
    const evaluation = await prisma.evaluation.upsert({
      where: { submissionId },
      update: { status: 'PROCESSING' },
      create: { submissionId, status: 'PROCESSING' }
    });

    try {
      // 3. System Prompt for SPC Teacher
      const systemPrompt = `Tu es un enseignant de Physique-Chimie (SPC) expert et bienveillant. 
      Ta mission est de corriger la copie d'un élève en te basant exclusivement sur le barème fourni.
      
      CONSIGNES PÉDAGOGIQUES :
      - Identifie précisément les "Misconceptions" (erreurs de raisonnement types, confusion d'unités, mauvaises interprétations de lois physiques).
      - Ton feedback doit être constructif et aider l'élève à progresser.
      - Respecte scrupuleusement les 'step' de notation (ex: si step=0.25, les notes doivent être 0.25, 0.5, 0.75, etc.).
      
      CONTEXTE DE LA QUESTION :
      ${submission.question.content}
      
      BARÈME (Critères) :
      ${rubric.criteria.map(c => `- ID: ${c.id} | Nom: ${c.name} | Max: ${c.maxScore} pts | Step: ${c.step}`).join('\n')}`;

      // 4. Call OpenAI with Structured Output
      const completion = await this.openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voici la copie de l'élève :\n\n${submission.content}` },
        ],
        response_format: zodResponseFormat(AIEvaluationResponseSchema, "evaluation"),
      });

      const result = completion.choices[0].message.parsed;
      if (!result) throw new Error("Failed to parse AI response");

      // 5. Atomic transaction
      return await prisma.$transaction(async (tx) => {
        // Clear existing criteria evals if any
        await tx.criterionEvaluation.deleteMany({ where: { evaluationId: evaluation.id } });
        
        await tx.criterionEvaluation.createMany({
          data: result.criteriaEvaluations.map(ce => ({
            evaluationId: evaluation.id,
            criterionId: ce.criterionId,
            score: ce.score,
            feedback: ce.feedback,
            misconceptions: ce.misconceptions
          }))
        });

        return await tx.evaluation.update({
          where: { id: evaluation.id },
          data: {
            status: 'COMPLETED',
            totalScore: result.totalScore,
            generalFeedback: result.generalFeedback,
            misconceptions: result.misconceptions
          }
        });
      });

    } catch (error) {
      console.error("[EvaluationService] Error:", error);
      await prisma.evaluation.update({
        where: { id: evaluation.id },
        data: { status: 'FAILED' }
      });
      throw error;
    }
  }
}
