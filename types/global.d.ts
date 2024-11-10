// Field structure
declare interface FieldType {
  id: string // Unique identifier for each field
  label: string // Field label, e.g., 'Full Name'
  placeholder: string // Placeholder text, e.g., 'Enter your name'
  type: string // Input type, e.g., 'text', 'email'
  order: number // Order to arrange fields in the form
}

// Main form structure with fields
declare interface FormType {
  name: string
  description: string
  fields: FieldType[] // Array of field objects
}

// FormType with Firestore document ID
declare interface FormTypeWithId extends FormType {
  id: string
}
