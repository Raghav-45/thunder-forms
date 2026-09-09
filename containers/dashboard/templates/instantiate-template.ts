'use client'

import type { FieldConfig } from '@/features/form-builder/elements'
import type { avaliableFieldsType } from '@/features/form-builder/types/types'
import { createDefaultFieldConfig } from '@/features/form-builder/utils/helperFunctions'
import type { FormTemplateSpec } from './types'

export interface BuiltSection {
  id: string
  fields: FieldConfig[]
}

export interface BuiltFormStructure {
  pages: {
    sections: BuiltSection[]
  }[]
}

/**
 * Materialize a template spec into builder-ready form structure.
 *
 * Every section and field gets a fresh UUID so template instances never
 * collide with each other (or with fields the user adds afterwards).
 * Field shapes always come from the registry's own `defaultConfig`, with
 * only presentational overrides applied from the spec.
 */
export function instantiateTemplate(
  template: FormTemplateSpec,
): BuiltFormStructure {
  return {
    pages: [
      {
        sections: template.sections.map((section) => ({
          id: crypto.randomUUID(),
          fields: section.fields.map((spec) => {
            const field = createDefaultFieldConfig(
              spec.type as avaliableFieldsType,
            ) as unknown as Record<string, unknown>

            field.id = `${spec.type}_${crypto.randomUUID().slice(0, 8)}`
            field.label = spec.label
            if (spec.placeholder !== undefined) {
              field.placeholder = spec.placeholder
            }
            if (spec.description !== undefined) {
              field.description = spec.description
            }
            if (spec.required !== undefined) {
              field.required = spec.required
            }
            if (spec.options !== undefined && 'options' in field) {
              field.options = spec.options
            }
            if (spec.inputType !== undefined && 'inputType' in field) {
              field.inputType = spec.inputType
            }

            return field as unknown as FieldConfig
          }),
        })),
      },
    ],
  }
}
