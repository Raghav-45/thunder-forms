import type { avaliableFieldsType } from '@/components/FormBuilder/types/types'

/**
 * Built-in form templates.
 *
 * Pure data — no runtime imports from the field registry, so this module is
 * safe to import from both server and client components. Fields are
 * materialized into real `FieldConfig` objects at use-time via
 * `instantiateTemplate` (which calls `createDefaultFieldConfig` and applies
 * these overrides), guaranteeing the shapes always match the registry.
 */

export interface TemplateFieldSpec {
  type: avaliableFieldsType
  label: string
  placeholder?: string
  description?: string
  required?: boolean
  /** For option-based fields (single-select, multi-select, radio-group). */
  options?: { label: string; value: string }[]
  /** For text-input (e.g. 'email', 'url'). */
  inputType?: string
}

export interface TemplateSectionSpec {
  fields: TemplateFieldSpec[]
}

export interface FormTemplateSpec {
  slug: string
  title: string
  description: string
  category: string
  submitButtonText?: string
  sections: TemplateSectionSpec[]
}

export const FORM_TEMPLATES: FormTemplateSpec[] = [
  {
    slug: 'contact-us',
    title: 'Contact Us',
    description: 'Let visitors reach out with their name, email and message.',
    category: 'Contact',
    submitButtonText: 'Send message',
    sections: [
      {
        fields: [
          {
            type: 'text-input',
            label: 'Full name',
            placeholder: 'e.g., Jane Cooper',
            required: true,
          },
          {
            type: 'text-input',
            label: 'Email address',
            placeholder: 'you@example.com',
            description: 'We will reply to this address.',
            required: true,
            inputType: 'email',
          },
          {
            type: 'text-input',
            label: 'Subject',
            placeholder: 'What is this about?',
            required: false,
          },
          {
            type: 'text-area',
            label: 'Message',
            placeholder: 'Write your message here...',
            required: true,
          },
        ],
      },
    ],
  },
  {
    slug: 'customer-feedback',
    title: 'Customer Feedback',
    description: 'Collect satisfaction ratings and suggestions from customers.',
    category: 'Feedback',
    submitButtonText: 'Submit feedback',
    sections: [
      {
        fields: [
          {
            type: 'single-select',
            label: 'How satisfied are you with our service?',
            required: true,
            options: [
              { label: 'Very satisfied', value: 'very_satisfied' },
              { label: 'Satisfied', value: 'satisfied' },
              { label: 'Neutral', value: 'neutral' },
              { label: 'Dissatisfied', value: 'dissatisfied' },
              { label: 'Very dissatisfied', value: 'very_dissatisfied' },
            ],
          },
          {
            type: 'radio-group',
            label: 'Would you recommend us to a friend?',
            required: true,
            options: [
              { label: 'Definitely', value: 'definitely' },
              { label: 'Maybe', value: 'maybe' },
              { label: 'No', value: 'no' },
            ],
          },
          {
            type: 'slider',
            label: 'Rate your overall experience',
            description: 'Drag the slider from 0 to 10.',
            required: false,
          },
          {
            type: 'text-area',
            label: 'What can we improve?',
            placeholder: 'Share your suggestions...',
            required: false,
          },
        ],
      },
    ],
  },
  {
    slug: 'job-application',
    title: 'Job Application',
    description: 'Collect applicant details, role preference and cover letter.',
    category: 'Application',
    submitButtonText: 'Apply now',
    sections: [
      {
        fields: [
          {
            type: 'text-input',
            label: 'Full name',
            placeholder: 'e.g., Jane Cooper',
            required: true,
          },
          {
            type: 'text-input',
            label: 'Email address',
            placeholder: 'you@example.com',
            required: true,
            inputType: 'email',
          },
          {
            type: 'single-select',
            label: 'Position applying for',
            required: true,
            options: [
              { label: 'Frontend Developer', value: 'frontend' },
              { label: 'Backend Developer', value: 'backend' },
              { label: 'Designer', value: 'designer' },
              { label: 'Product Manager', value: 'pm' },
            ],
          },
          {
            type: 'date-picker',
            label: 'Earliest start date',
            required: false,
          },
          {
            type: 'text-area',
            label: 'Cover letter',
            placeholder: 'Tell us why you are a great fit...',
            required: true,
          },
        ],
      },
    ],
  },
  {
    slug: 'event-rsvp',
    title: 'Event RSVP',
    description: 'Track attendance, guest count and dietary requirements.',
    category: 'Event',
    submitButtonText: 'Confirm RSVP',
    sections: [
      {
        fields: [
          {
            type: 'text-input',
            label: 'Full name',
            placeholder: 'e.g., Jane Cooper',
            required: true,
          },
          {
            type: 'radio-group',
            label: 'Will you attend?',
            required: true,
            options: [
              { label: 'Yes, I will be there', value: 'yes' },
              { label: 'Sorry, cannot make it', value: 'no' },
            ],
          },
          {
            type: 'number-input',
            label: 'Number of guests',
            placeholder: '0',
            description: 'Including yourself.',
            required: false,
          },
          {
            type: 'text-area',
            label: 'Dietary requirements',
            placeholder: 'Allergies, vegetarian, etc.',
            required: false,
          },
        ],
      },
    ],
  },
  {
    slug: 'product-survey',
    title: 'Product Survey',
    description: 'Learn how users use your product and what to build next.',
    category: 'Survey',
    submitButtonText: 'Submit survey',
    sections: [
      {
        fields: [
          {
            type: 'radio-group',
            label: 'How often do you use the product?',
            required: true,
            options: [
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Rarely', value: 'rarely' },
            ],
          },
          {
            type: 'multi-select',
            label: 'Which features do you use?',
            required: false,
            options: [
              { label: 'Dashboard', value: 'dashboard' },
              { label: 'Analytics', value: 'analytics' },
              { label: 'Templates', value: 'templates' },
              { label: 'AI Builder', value: 'ai_builder' },
            ],
          },
          {
            type: 'slider',
            label: 'How likely are you to renew?',
            required: false,
          },
          {
            type: 'text-area',
            label: 'What should we build next?',
            placeholder: 'Your ideas matter...',
            required: false,
          },
        ],
      },
    ],
  },
  {
    slug: 'support-ticket',
    title: 'Support Ticket',
    description: 'Let users report issues with priority and details.',
    category: 'Support',
    submitButtonText: 'Raise ticket',
    sections: [
      {
        fields: [
          {
            type: 'text-input',
            label: 'Email address',
            placeholder: 'you@example.com',
            required: true,
            inputType: 'email',
          },
          {
            type: 'single-select',
            label: 'Priority',
            required: true,
            options: [
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Urgent', value: 'urgent' },
            ],
          },
          {
            type: 'text-input',
            label: 'Issue summary',
            placeholder: 'Briefly describe the problem',
            required: true,
          },
          {
            type: 'text-area',
            label: 'Detailed description',
            placeholder: 'Steps to reproduce, screenshots, etc.',
            required: true,
          },
        ],
      },
    ],
  },
]

export function getTemplateBySlug(slug: string): FormTemplateSpec | undefined {
  return FORM_TEMPLATES.find((template) => template.slug === slug)
}

export function countTemplateFields(template: FormTemplateSpec): number {
  return template.sections.reduce(
    (total, section) => total + section.fields.length,
    0,
  )
}
