import {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/features/form-builder/types/types'
import { z } from 'zod'

/**
 * Abstract base class for all form field definitions.
 *
 * This enforces a contract: every field type MUST provide:
 * - A unique identifier string
 * - A display name for the UI
 * - A React component for rendering the field
 * - A React component for editing field configuration
 * - A default configuration factory
 * - A Zod validation schema factory
 *
 * To add a new field type:
 * 1. Create a file in `elements/fields/`
 * 2. Extend `FormFieldDefinition<YourConfig>`
 * 3. Implement the renderer, editor, defaults, and validation in that file
 * 4. Register an instance in `elements/index.ts`
 *
 */
export abstract class FormFieldDefinition<
  TConfig extends BaseFieldConfig = BaseFieldConfig,
> {
  /** Unique string key for this field type (e.g. 'text-input', 'multi-select') */
  abstract readonly identifier: TConfig['uniqueIdentifier']

  /** The React component that renders this field in a live form */
  abstract readonly component: React.FC<FieldProps<TConfig>>

  /** The React component that renders the editor panel for configuring this field */
  abstract readonly editor: React.FC<EditorProps<TConfig> & { isOpen: boolean }>

  /** Creates a fresh default configuration for a new instance of this field */
  abstract defaultConfig(): TConfig

  /** Builds a Zod validation schema based on the field's current configuration */
  abstract getValidationSchema(field: TConfig): z.ZodTypeAny
}
