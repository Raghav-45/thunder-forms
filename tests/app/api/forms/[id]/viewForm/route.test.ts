import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findForm: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { forms: { findUnique: mocks.findForm } },
}))

import { GET } from '@/app/api/forms/[id]/viewForm/route'

const params = Promise.resolve({ id: 'form-1' })

describe('GET /api/forms/[id]/viewForm', () => {
  it('does not expose quiz answer keys to respondents', async () => {
    mocks.findForm.mockResolvedValue({
      id: 'form-1',
      userId: 'owner-1',
      maxSubmissions: null,
      expiresAt: null,
      _count: { responses: 0 },
      fields: {
        quiz: { enabled: true },
        pages: [{
          id: 'page-1',
          sections: [{
            id: 'section-1',
            fields: [{
              id: 'answer',
              label: 'Answer',
              uniqueIdentifier: 'radio-group',
              options: [
                { id: 'option-a', label: 'A', value: 'a' },
                { id: 'option-b', label: 'B', value: 'b' },
              ],
              quiz: { correctAnswers: ['a'], points: 2 },
            }],
          }],
        }],
      },
    })

    const response = await GET(new Request('http://localhost'), { params })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({
      fields: {
        quiz: { enabled: true },
        pages: [{
          sections: [{
            fields: [{ id: 'answer' }],
          }],
        }],
      },
    })
    expect(body.fields.pages[0].sections[0].fields[0]).not.toHaveProperty('quiz')
  })
})
