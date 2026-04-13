import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { prisma } from '../utils/prisma';
import { AIEvaluationResponseSchema } from '../schemas/evaluation.schema';
import { Criterion, Prisma } from '@prisma/client';

export class EvaluationService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async evaluateSubmission(submissionId: string) {
    // 1. Récupération de la Submission et ses relations
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

    if (!submission) throw new Error("Submission non trouvée");
    
    const rubric = submission.question.rubrics[0];
    if (!rubric) throw new Error("Aucun barème trouvé pour cette question");

    // 2. Gestion de l'état (Upsert de l'Evaluation)
    const evaluation = await prisma.evaluation.upsert({
      where: { submissionId },
      update: { status: 'PROCESSING' },
      create: { 
        submissionId, 
        status: 'PROCESSING' 
      }
    });

    try {
      // 3. Appel OpenAI (Modèle supportant Structured Output)
      const systemPrompt = `Tu es un expert en didactique des Sciences Physiques et Chimiques. 
      Analyse la copie en tenant compte du barème fourni. Sois précis sur les unités et les chiffres significatifs. 
      Identifie les obstacles cognitifs de l'élève (misconceptions).
      
      CONTEXTE DE LA QUESTION :
      ${submission.question.content}
      
      BARÈME (Critères) :
      ${rubric.criteria.map((c: Criterion) => `- ID: ${c.id} | Nom: ${c.name} | Max: ${c.maxScore} pts | Pas: ${c.step}`).join('\n')}`;

      const completion = await this.openai.beta.chat.completions.parse({
        model: "gpt-4o-2024-08-06",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voici la copie de l'élève :\n\n${submission.content}` },
        ],
        response_format: zodResponseFormat(AIEvaluationResponseSchema, "evaluation"),
      });

      const result = completion.choices[0].message.parsed;
      if (!result) throw new Error("Échec du parsing de la réponse AI");

      // 4. Transaction Prisma pour garantir l'atomicité
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Nettoyage des anciennes évaluations de critères si nécessaire
        await tx.criterionEvaluation.deleteMany({
          where: { evaluationId: evaluation.id }
        });

        // Insertion des notes par critères
        await tx.criterionEvaluation.createMany({
          data: result.criteriaEvaluations.map((ce) => ({
            evaluationId: evaluation.id,
            criterionId: ce.criterionId,
            score: ce.score,
            feedback: ce.feedback,
            misconceptions: ce.misconceptions
          }))
        });

        // Finalisation de l'évaluation globale
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
      console.error("[EvaluationService] Erreur lors de la correction:", error);
      
      // Marquer l'évaluation comme échouée en cas d'erreur
      await prisma.evaluation.update({
        where: { id: evaluation.id },
        data: { status: 'FAILED' }
      });
      
      throw error;
    }
  }
}
