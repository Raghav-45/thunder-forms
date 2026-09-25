import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findForm: vi.fn(),
  sendQuizGradeEmail: vi.fn(),
  updateResponse: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    forms: { findUnique: mocks.findForm },
    responses: { update: mocks.updateResponse },
  },
}))

vi.mock('@/features/form-builder/server/quiz-email', () => ({
  QuizEmailConfigurationError: class QuizEmailConfigurationError extends Error {},
  sendQuizGradeEmail: mocks.sendQuizGradeEmail,
}))

import { PATCH } from '@/app/api/forms/[id]/responses/route'

const fields = {
  quiz: { enabled: true },
  pages: [{
    id: 'page-1',
    sections: [{
      id: 'section-1',
      fields: [
        {
          id: 'choice',
          label: 'Choice',
          uniqueIdentifier: 'radio-group',
          options: [
            { id: 'option-a', label: 'A', value: 'a' },
            { id: 'option-b', label: 'B', value: 'b' },
          ],
          quiz: { correctAnswers: ['a'], points: 2 },
        },
        {
          id: 'essay',
          label: 'Essay',
          uniqueIdentifier: 'text-area',
          quiz: { points: 4 },
        },
      ],
    }],
  }],
}

const storedForm = (overrides: Record<string, unknown> = {}) => ({
  id: 'form-1',
  title: 'Quiz',
  userId: 'teacher-1',
  fields,
  responses: [{
    id: 'response-1',
    data: {
      choice: 'a',
      essay: 'Student response',
      __quiz: { manualScores: {}, pendingPoints: 4, score: 2, maxScore: 6 },
    },
  }],
  ...overrides,
})

const params = Promise.resolve({ id: 'form-1' })
const requestFor = (body: unknown) => new Request(
  'http://localhost/api/forms/form-1/responses',
  { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
)

describe('PATCH /api/forms/[id]/responses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSession.mockResolvedValue({ user: { id: 'teacher-1' } })
    mocks.findForm.mockResolvedValue(storedForm())
    mocks.updateResponse.mockResolvedValue({ id: 'response-1', data: {} })
  })

  it('stores manual grades and recalculates the server-side total', async () => {
    const response = await PATCH(requestFor({
      responseId: 'response-1',
      manualScores: { essay: 3 },
    }), { params })

    expect(response.status).toBe(200)
    expect(mocks.updateResponse).toHaveBeenCalledWith({
      where: { id: 'response-1' },
      data: {
        data: {
          choice: 'a',
          essay: 'Student response',
          __quiz: { manualScores: { essay: 3 }, pendingPoints: 0, score: 5, maxScore: 6 },
        },
      },
    })
  })

  it('rejects scores outside the configured manual points', async () => {
    const response = await PATCH(requestFor({
      responseId: 'response-1',
      manualScores: { essay: 5 },
    }), { params })

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid manual score' })
    expect(mocks.updateResponse).not.toHaveBeenCalled()
  })

  it('rejects scores for automatic questions', async () => {
    const response = await PATCH(requestFor({
      responseId: 'response-1',
      manualScores: { choice: 2 },
    }), { params })

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid manual score' })
  })

  it('clears a manual score and returns its points to review', async () => {
    mocks.findForm.mockResolvedValue(storedForm({
      responses: [{
        id: 'response-1',
        data: {
          choice: 'a',
          essay: 'Student response',
          __quiz: { manualScores: { essay: 3 }, pendingPoints: 0, score: 5, maxScore: 6 },
        },
      }],
    }))

    const response = await PATCH(requestFor({
      responseId: 'response-1',
      manualScores: { essay: null },
    }), { params })

    expect(response.status).toBe(200)
    expect(mocks.updateResponse).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        data: expect.objectContaining({
          __quiz: { manualScores: {}, pendingPoints: 4, score: 2, maxScore: 6 },
        }),
      },
    }))
  })

  it('releases a fully graded quiz by email after review', async () => {
    const delayedFields = {
      ...fields,
      quiz: {
        enabled: true,
        gradeRelease: 'after-review',
        recipientEmailFieldId: 'email',
      },
      pages: [{
        ...fields.pages[0],
        sections: [{
          ...fields.pages[0].sections[0],
          fields: [
            ...fields.pages[0].sections[0].fields,
            {
              id: 'email',
              label: 'Email',
              uniqueIdentifier: 'text-input',
              inputType: 'email',
            },
          ],
        }],
      }],
    }
    mocks.findForm.mockResolvedValue(storedForm({
      fields: delayedFields,
      responses: [{
        id: 'response-1',
        data: {
          choice: 'a',
          essay: 'Student response',
          email: 'student@example.com',
          __quiz: { manualScores: { essay: 3 }, pendingPoints: 0, score: 5, maxScore: 6 },
        },
      }],
    }))

    const response = await PATCH(requestFor({ responseId: 'response-1', release: true }), { params })

    expect(response.status).toBe(200)
    expect(mocks.sendQuizGradeEmail).toHaveBeenCalledWith({
      formTitle: 'Quiz',
      idempotencyKey: 'quiz-grade/response-1/response-1',
      maxScore: 6,
      recipient: 'student@example.com',
      score: 5,
    })
    expect(mocks.updateResponse).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        data: expect.objectContaining({
          __quiz: expect.objectContaining({
            manualScores: { essay: 3 },
            pendingPoints: 0,
            score: 5,
            maxScore: 6,
            releasedAt: expect.any(String),
          }),
        }),
      },
    }))
  })

  it('does not release a score twice', async () => {
    mocks.findForm.mockResolvedValue(storedForm({
      fields: {
        ...fields,
        quiz: {
          enabled: true,
          gradeRelease: 'after-review',
          recipientEmailFieldId: 'email',
        },
        pages: [{
          ...fields.pages[0],
          sections: [{
            ...fields.pages[0].sections[0],
            fields: [
              ...fields.pages[0].sections[0].fields,
              { id: 'email', label: 'Email', uniqueIdentifier: 'text-input', inputType: 'email' },
            ],
          }],
        }],
      },
      responses: [{
        id: 'response-1',
        data: {
          choice: 'a',
          essay: 'Student response',
          email: 'student@example.com',
          __quiz: {
            manualScores: { essay: 3 },
            pendingPoints: 0,
            score: 5,
            maxScore: 6,
            releasedAt: '2026-09-24T00:00:00.000Z',
          },
        },
      }],
    }))

    const response = await PATCH(requestFor({ responseId: 'response-1', release: true }), { params })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'Grade has already been released' })
    expect(mocks.sendQuizGradeEmail).not.toHaveBeenCalled()
  })

  it('marks a released grade ready for explicit re-release when its score changes', async () => {
    mocks.findForm.mockResolvedValue(storedForm({
      responses: [{
        id: 'response-1',
        data: {
          choice: 'a',
          essay: 'Student response',
          __quiz: {
            manualScores: { essay: 3 },
            pendingPoints: 0,
            score: 5,
            maxScore: 6,
            releasedAt: '2026-09-24T00:00:00.000Z',
          },
        },
      }],
    }))

    const response = await PATCH(requestFor({
      responseId: 'response-1',
      manualScores: { essay: 4 },
    }), { params })

    expect(response.status).toBe(200)
    expect(mocks.updateResponse).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        data: expect.objectContaining({
          __quiz: expect.objectContaining({
            manualScores: { essay: 4 },
            pendingPoints: 0,
            score: 6,
            maxScore: 6,
            releaseInvalidatedAt: expect.any(String),
          }),
        }),
      },
    }))
  })
})
