import { FieldType } from '@/types/types'

export const fieldTypes: FieldType[] = [
  { name: 'Checkbox', isAvaliable: true },
  { name: 'Combobox', isAvaliable: true },
  { name: 'Date Picker', isAvaliable: false },
  { name: 'Datetime Picker', isAvaliable: false },
  { name: 'File Input', isAvaliable: false },
  { name: 'Input', isAvaliable: true },
  { name: 'Input OTP', isAvaliable: false },
  { name: 'Location Input', isAvaliable: false },
  { name: 'Multi Select', isAvaliable: false },
  { name: 'Password', isAvaliable: false },
  { name: 'Phone', isAvaliable: false },
  { name: 'Select', isAvaliable: true },
  { name: 'Signature Input', isAvaliable: false },
  { name: 'Slider', isAvaliable: false },
  { name: 'Smart Datetime Input', isAvaliable: false },
  { name: 'Switch', isAvaliable: true },
  { name: 'Tags Input', isAvaliable: false },
  { name: 'Textarea', isAvaliable: true },
]

export const defaultFieldConfig: Record<
  string,
  { label: string; description: string; placeholder?: string }
> = {
  Checkbox: {
    label: 'Use different settings for my mobile devices',
    description:
      'You can manage your mobile notifications in the mobile settings page.',
  },
  Combobox: {
    label: 'Language',
    description: 'This is the language that will be used in the dashboard.',
  },
  'Date Picker': {
    label: 'Date of birth',
    description: 'Your date of birth is used to calculate your age.',
  },
  'Datetime Picker': {
    label: 'Submission Date',
    description: 'Add the date of submission with detailly.',
  },
  'File Input': {
    label: 'Select File',
    description: 'Select a file to upload.',
  },
  Input: {
    label: 'Username',
    description: 'This is your public display name.',
    placeholder: 'shadcn',
  },
  'Input OTP': {
    label: 'One-Time Password',
    description: 'Please enter the one-time password sent to your phone.',
  },
  'Location Input': {
    label: 'Select Country',
    description:
      'If your country has states, it will be appear after selecting country',
  },
  'Multi Select': {
    label: 'Select your framework',
    description: 'Select multiple options.',
  },
  Select: {
    label: 'Email',
    description: 'You can manage email addresses in your email settings.',
    placeholder: 'Select a verified email to display',
  },
  Slider: {
    label: 'Set Price Range',
    description: 'Adjust the price by sliding.',
  },
  'Signature Input': {
    label: 'Sign here',
    description: 'Please provide your signature above',
  },
  'Smart Datetime Input': {
    label: "What's the best time for you?",
    description: 'Please select the full time',
  },
  Switch: {
    label: 'Marketing emails',
    description: 'Receive emails about new products, features, and more.',
  },
  'Tags Input': { label: 'Enter your tech stack.', description: 'Add tags.' },
  Textarea: {
    label: 'Bio',
    description: 'You can @mention other users and organizations.',
  },
  Password: {
    label: 'Password',
    description: 'Enter your password.',
  },
  Phone: {
    label: 'Phone number',
    description: 'Enter your phone number.',
  },
}
