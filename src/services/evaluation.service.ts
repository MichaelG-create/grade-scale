import { OpenAI } from 'openai';
import { prisma } from '../utils/prisma';
import { AIEvaluationResponseSchema } from '../schemas/evaluation.schema';
import { EvaluationStatus } from '@prisma/client';
import { EVALUATION_SYSTEM_PROMPT } from '../utils/prompts';
import { OpenAIError, NotFoundError } from '../errors/AppError';
import { pseudonymizeContent } from '../utils/rgpd';

export class EvaluationService {
  private groq: OpenAI;
  private logger: any;
  private verbose: boolean;

  constructor(client?: OpenAI, logger?: any, verbose: boolean = false) {
    this.groq = client || new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: process.env.GROQ_BASE_URL,
    });
    this.logger = logger || console;
    this.verbose = verbose;
  }

  async evaluateSubmission(submissionId: string) {
    this.logger.info(`[EvaluationService] 🟢 Starting evaluation for submission: ${submissionId}`);
    
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

    if (!submission) {
      throw new NotFoundError(`Submission ${submissionId} not found`);
    }

    const evaluation = await prisma.evaluation.upsert({
      where: { submissionId },
      update: { status: EvaluationStatus.PROCESSING },
      create: { 
        submissionId, 
        status: EvaluationStatus.PROCESSING 
      }
    });

    try {
      if (submission.question.rubrics.length === 0) {
        throw new Error("No rubric found for this question");
      }

      const criteriaList = submission.question.rubrics[0].criteria;
      this.logger.info(`[EvaluationService] 📋 Building prompt with ${criteriaList.length} criteria`);

      const criteriaString = criteriaList
        .map(c => `- [${c.id}] ${c.name} (Max: ${c.maxScore}, Pas: ${c.step}): ${c.description}`)
        .join('\n');

      const userPrompt = `
              SOLUTION RÉFÉRENCE (pour calibrer tes calculs) :
              ${submission.question.solution || "Non fournie"}

              BARÈME :
              ${criteriaString}
              
              CONTENU COPIE ÉLÈVE :
              ${pseudonymizeContent(submission.content)}
            `;

      if (this.verbose) {
        this.logger.info(`[EvaluationService] 📝 SYSTEM PROMPT:\n${EVALUATION_SYSTEM_PROMPT}`);
        this.logger.info(`[EvaluationService] 📝 USER PROMPT:\n${userPrompt}`);
      }

      const completion = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: EVALUATION_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new OpenAIError("Empty response from AI");
      }

      if (this.verbose) {
        this.logger.info(`[EvaluationService] 🤖 RAW AI RESPONSE:\n${responseContent}`);
      }

      const rawResult = JSON.parse(responseContent);
      const validatedResult = AIEvaluationResponseSchema.parse(rawResult);
      
      this.logger.info(`[EvaluationService] ✅ Evaluation successful. Total Score: ${validatedResult.totalScore}`);
      const securedCriteriaEvaluations = validatedResult.criteriaEvaluations.map(ce => {
        const criterion = criteriaList.find(c => c.id === ce.criterionId);
        const max = criterion?.maxScore ?? ce.score;
        return { ...ce, score: Math.min(ce.score, max) };
      });

      // Sécurité : Recalcul du score total à partir des scores sécurisés
      const calculatedTotalScore = securedCriteriaEvaluations.reduce((acc, ce) => acc + ce.score, 0);

      return await prisma.$transaction(async (tx) => {
        const updatedEval = await tx.evaluation.update({
          where: { id: evaluation.id },
          data: {
            totalScore: calculatedTotalScore,
            generalFeedback: validatedResult.generalFeedback,
            misconceptions: validatedResult.misconceptions,
            status: EvaluationStatus.COMPLETED
          }
        });

        // Supprimer les évaluations de critères existantes si c'est un retry
        await tx.criterionEvaluation.deleteMany({
          where: { evaluationId: evaluation.id }
        });

        await tx.criterionEvaluation.createMany({
          data: securedCriteriaEvaluations.map(ce => ({
            evaluationId: evaluation.id,
            criterionId: ce.criterionId,
            score: ce.score,
            feedback: ce.feedback,
            misconceptions: ce.misconceptions
          }))
        });

        return updatedEval;
      });

    } catch (error) {
      this.logger.error(`[EvaluationService] ❌ Error evaluating ${submissionId}:`, error);
      
      await prisma.evaluation.update({
        where: { id: evaluation.id },
        data: { status: EvaluationStatus.FAILED }
      });

      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          throw new OpenAIError(`AI response validation failed: ${error.message}`);
        }
      }
      throw error;
    }
  }
}