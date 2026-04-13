import fastify from 'fastify';
import cors from '@fastify/cors';
import { 
  validatorCompiler, 
  serializerCompiler, 
  ZodTypeProvider 
} from 'fastify-type-provider-zod';
import { prisma } from './utils/prisma';
import { EvaluationService } from './services/evaluation.service';
import { CreateSubmissionSchema } from './schemas/submission.schema';
import { z } from 'zod';

const server = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
}).withTypeProvider<ZodTypeProvider>();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

const evaluationService = new EvaluationService();

// Healthcheck
server.get('/health', async () => ({ status: 'ok' }));

/**
 * Route POST /submissions
 * Ingestion d'une copie et lancement du service d'évaluation en tâche de fond (Async)
 */
server.post('/submissions', {
  schema: {
    body: CreateSubmissionSchema,
    response: {
      202: z.object({
        submissionId: z.string().uuid(),
        message: z.string(),
      }),
    },
  },
}, async (request, reply) => {
  const { studentPseudoId, questionId, content } = request.body;

  // 1. Enregistrement en base de données
  const submission = await prisma.submission.create({
    data: {
      studentPseudoId,
      questionId,
      content,
    },
  });

  // 2. Lancement asynchrone de la correction (Background Job)
  // On ne "await" pas pour rendre la main immédiatement au client
  evaluationService.evaluateSubmission(submission.id).catch((err) => {
    request.log.error(`[Background Task] Erreur lors de l'évaluation ${submission.id}:`, err);
  });

  return reply.status(202).send({
    submissionId: submission.id,
    message: "Copie reçue. Correction en cours...",
  });
});

/**
 * Route GET /evaluations/:submissionId
 * Récupération du résultat ou du statut de la correction
 */
server.get('/evaluations/:submissionId', {
  schema: {
    params: z.object({
      submissionId: z.string().uuid(),
    }),
  },
}, async (request, reply) => {
  const { submissionId } = request.params;

  const evaluation = await prisma.evaluation.findUnique({
    where: { submissionId },
    include: {
      criteriaEvaluations: {
        include: { criterion: true }
      }
    }
  });

  if (!evaluation) {
    return reply.status(404).send({ error: "Évaluation non trouvée pour cette soumission" });
  }

  return evaluation;
});

// Lancement du serveur
const start = async () => {
  try {
    await server.register(cors);
    
    const port = Number(process.env.PORT) || 3000;
    // Indispensable pour WSL : écoute sur 0.0.0.0
    await server.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 GradeScale Server ready at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
