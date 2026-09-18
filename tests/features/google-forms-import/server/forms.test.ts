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
        {
          itemId: 'upload',
          title: 'Portfolio',
          questionItem: {
            question: {
              questionId: 'upload-question',
              fileUploadQuestion: {},
            },
          },
        },
      ],
    })

    expect(result.title).toBe('Team survey')
    expect(result.description).toBe('Tell us what you think.')
    expect(result.fields).toEqual([
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
    ])
    expect(result.skippedItems).toEqual([
      '"Portfolio" (File upload — not supported)',
    ])
  })
})
