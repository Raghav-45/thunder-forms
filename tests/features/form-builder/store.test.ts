import { useFormStore } from '@/features/form-builder/store'
import {
  DEFAULT_FORM_DESCRIPTION,
  DEFAULT_FORM_TITLE,
} from '@/features/form-builder/constants'
import { afterEach, describe, expect, it } from 'vitest'

describe('form builder store', () => {
  afterEach(() => {
    useFormStore.getState().resetForm()
  })

  it('replaces form settings through setFormSettings', () => {
    const settings = {
      title: 'Feedback',
      description: 'Tell us what you think',
      maxSubmissions: 10,
      redirectUrl: 'https://example.com/thanks',
      submitButtonText: 'Send feedback',
    }

    useFormStore.getState().setFormSettings(settings)

    expect(useFormStore.getState().formSettings).toEqual(settings)
  })

  it('restores initial settings and count through resetForm', () => {
    useFormStore.getState().setFormSettings({ title: 'Changed' })

    useFormStore.getState().resetForm()

    expect(useFormStore.getState()).toMatchObject({
      count: 1,
      formSettings: {
        title: DEFAULT_FORM_TITLE,
        description: DEFAULT_FORM_DESCRIPTION,
      },
    })
  })
})
