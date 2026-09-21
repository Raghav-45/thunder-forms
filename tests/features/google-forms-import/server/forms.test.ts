import { describe, expect, it } from 'vitest'
import { convertGoogleForm } from '@/features/google-forms-import/server/forms'

describe('Google Forms conversion', () => {
  it('converts supported questions and reports unsupported items', () => {
    const result = convertGoogleForm({
      formId: 'google-form-1',
      info: { title: 'Team survey', description: 'Tell us what you think.' },
      items: [
        {
          itemId: 'name',
          title: 'Your name',
          questionItem: {
            question: { questionId: 'name-question', required: true, textQuestion: {} },
          },
        },
        {
          itemId: 'tools',
          title: 'Tools',
          questionItem: {
            question: {
              questionId: 'tools-question',
              choiceQuestion: {
                type: 'CHECKBOX',
                options: [{ value: 'Figma' }, { value: 'Other', isOther: true }],
              },
            },
          },
        },
      ],
    })

    expect(result.title).toBe('Team survey')
    expect(result.description).toBe('Tell us what you think.')
    expect(result.pages).toEqual([{
      fields: [
      expect.objectContaining({
        uniqueIdentifier: 'text-input',
        label: 'Your name',
        required: true,
      }),
      expect.objectContaining({
        uniqueIdentifier: 'multi-select',
        label: 'Tools',
        options: [{ label: 'Figma', value: 'figma' }],
      }),
      ],
    }])
    expect(result.skippedItems).toEqual([])
  })

  it('maps time and file-upload questions to supported ThunderForms fields', () => {
    const result = convertGoogleForm({
      formId: 'google-form-time-and-files',
      info: { title: 'Appointment' },
      items: [
        {
          itemId: 'start-time',
          title: 'Start time',
          questionItem: {
            question: {
              questionId: 'start-time-question',
              timeQuestion: { duration: false },
            },
          },
        },
        {
          itemId: 'duration',
          title: 'Duration',
          questionItem: {
            question: {
              questionId: 'duration-question',
              timeQuestion: { duration: true },
            },
          },
        },
        {
          itemId: 'portfolio',
          title: 'Portfolio',
          questionItem: {
            question: {
              questionId: 'portfolio-question',
              fileUploadQuestion: {
                maxFiles: 2,
                maxFileSize: '1048576',
                types: ['PDF', 'IMAGE'],
              },
            },
          },
        },
        {
          itemId: 'satisfaction',
          title: 'Satisfaction',
          questionItem: {
            question: {
              questionId: 'satisfaction-question',
              ratingQuestion: { iconType: 'HEART', ratingScaleLevel: 7 },
            },
          },
        },
      ],
    })

    expect(result.pages[0].fields).toEqual([
      expect.objectContaining({ uniqueIdentifier: 'time-picker', mode: 'time' }),
      expect.objectContaining({ uniqueIdentifier: 'time-picker', mode: 'duration' }),
      expect.objectContaining({
        uniqueIdentifier: 'file-upload',
        acceptedTypes: '.pdf,image/*',
        maxFiles: 2,
        maxSizeBytes: 1048576,
      }),
      expect.objectContaining({
        uniqueIdentifier: 'rating',
        style: 'heart',
        maxRating: 7,
      }),
    ])
    expect(result.skippedItems).toEqual([])
  })

  it('keeps choice values unique and preserves a zero-based scale', () => {
    const result = convertGoogleForm({
      formId: 'google-form-2',
      info: { title: 'Edge cases' },
      items: [
        {
          itemId: 'choices',
          title: 'Pick one',
          questionItem: {
            question: {
              questionId: 'choices-question',
              choiceQuestion: {
                type: 'RADIO',
                options: [{ value: 'A/B' }, { value: 'A B' }, { value: ' हिन्दी ' }],
              },
            },
          },
        },
        {
          itemId: 'scale',
          title: 'Confidence',
          questionItem: {
            question: {
              questionId: 'scale-question',
              scaleQuestion: { low: 0, high: 10 },
            },
          },
        },
      ],
    })

    expect(result.pages[0].fields[0]).toEqual(
      expect.objectContaining({
        options: [
          { label: 'A/B', value: 'a_b' },
          { label: 'A B', value: 'a_b_2' },
          { label: ' हिन्दी ', value: 'option_3' },
        ],
      }),
    )
    expect(result.pages[0].fields[1]).toEqual(
      expect.objectContaining({ min: 0, max: 10, defaultValue: 0 }),
    )
  })

  it('preserves Google Form page breaks and their titles', () => {
    const result = convertGoogleForm({
      formId: 'google-form-pages',
      info: { title: 'Application' },
      items: [
        {
          itemId: 'name',
          title: 'Name',
          questionItem: {
            question: { questionId: 'name-question', textQuestion: {} },
          },
        },
        {
          itemId: 'work',
          title: 'Work history',
          description: 'Tell us about your experience.',
          pageBreakItem: {},
        },
        {
          itemId: 'company',
          title: 'Company',
          questionItem: {
            question: { questionId: 'company-question', textQuestion: {} },
          },
        },
        {
          itemId: 'review',
          title: 'Final review',
          pageBreakItem: {},
        },
      ],
    })

    expect(result.pages).toEqual([
      {
        fields: [expect.objectContaining({ label: 'Name' })],
      },
      {
        title: 'Work history',
        description: 'Tell us about your experience.',
        fields: [expect.objectContaining({ label: 'Company' })],
      },
      {
        title: 'Final review',
        fields: [],
      },
    ])
    expect(result.skippedItems).toEqual([])
  })
})
