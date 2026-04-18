import { describe, it, expect, vi, beforeAll } from 'vitest';
import { server } from '../index';
import { prisma } from '../utils/prisma';

// Mocking Prisma
vi.mock('../utils/prisma', () => ({
  prisma: {
    question: {
      findMany: vi.fn(),
    },
    submission: {
      create: vi.fn(),
    },
    evaluation: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Integration Tests - API', () => {
  
  it('GET /health devrait retourner ok', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('GET /questions devrait retourner une liste de questions', async () => {
    const mockQuestions = [
      { id: '1', title: 'Test Question', subject: { name: 'Physique' } }
    ];
    (prisma.question.findMany as any).mockResolvedValue(mockQuestions);

    const response = await server.inject({
      method: 'GET',
      url: '/questions'
    });

    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('Test Question');
  });

  it('GET /evaluations/:id devrait retourner 404 si inconnu', async () => {
    (prisma.evaluation.findUnique as any).mockResolvedValue(null);

    const response = await server.inject({
      method: 'GET',
      url: `/evaluations/00000000-0000-0000-0000-000000000000`
    });

    expect(response.statusCode).toBe(404);
  });
});
