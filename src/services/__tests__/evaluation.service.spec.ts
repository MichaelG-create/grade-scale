import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvaluationService } from '../evaluation.service';
import { prisma } from '../../utils/prisma';
import { OpenAI } from 'openai';

// Mock Prisma
vi.mock('../../utils/prisma', () => ({
  prisma: {
    submission: {
      findUnique: vi.fn(),
    },
    evaluation: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    criterionEvaluation: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe('EvaluationService', () => {
  let service: EvaluationService;
  let mockOpenAI: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    } as any;
    service = new EvaluationService(mockOpenAI);
  });

  it('should successfully evaluate a submission', async () => {
    const mockSubmission = {
      id: 'sub-123',
      content: 'P = m * g = 0.2 * 9.81 = 1.96 N',
      question: {
        rubrics: [{
          criteria: [
            { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Formula', maxScore: 1, step: 0.5, description: 'Desc' }
          ]
        }]
      }
    };

    (prisma.submission.findUnique as any).mockResolvedValue(mockSubmission);
    (prisma.evaluation.upsert as any).mockResolvedValue({ id: 'eval-123' });

    const mockAIResponse = {
      totalScore: 1,
      generalFeedback: 'Excellent',
      misconceptions: 'None',
      criteriaEvaluations: [
        { criterionId: '550e8400-e29b-41d4-a716-446655440000', score: 1, feedback: 'Correct', misconceptions: '' }
      ]
    };

    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockAIResponse) } }]
    });

    (prisma.evaluation.update as any).mockResolvedValue({ id: 'eval-123' });

    await service.evaluateSubmission('sub-123');

    expect(prisma.submission.findUnique).toHaveBeenCalled();
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    expect(prisma.evaluation.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'eval-123' },
      data: expect.objectContaining({
        totalScore: 1,
        status: 'COMPLETED'
      })
    }));
  });

  it('should throw NotFoundError if submission does not exist', async () => {
    (prisma.submission.findUnique as any).mockResolvedValue(null);

    await expect(service.evaluateSubmission('invalid')).rejects.toThrow('Submission invalid not found');
  });

  it('should handle AI errors and mark evaluation as FAILED', async () => {
    const mockSubmission = {
      id: 'sub-123',
      content: '...',
      question: { rubrics: [{ criteria: [] }] }
    };
    (prisma.submission.findUnique as any).mockResolvedValue(mockSubmission);
    (prisma.evaluation.upsert as any).mockResolvedValue({ id: 'eval-123' });
    
    mockOpenAI.chat.completions.create.mockRejectedValue(new Error('AI Error'));

    await expect(service.evaluateSubmission('sub-123')).rejects.toThrow('AI Error');
    
    expect(prisma.evaluation.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'eval-123' },
      data: { status: 'FAILED' }
    }));
  });
});
