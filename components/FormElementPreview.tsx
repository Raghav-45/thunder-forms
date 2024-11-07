import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export const FormElementPreview = ({
  type,
  label,
}: {
  type: string
  label: string
}) => {
  switch (type) {
    case 'text':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${type}-${label}`}>Text</Label>
          <Input type="text" id={`${type}-${label}`} placeholder="Text" />
        </div>
      )
    case 'email':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${type}-${label}`}>Email</Label>
          <Input type="email" id={`${type}-${label}`} placeholder="Email" />
        </div>
      )
    case 'number':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${type}-${label}`}>Number</Label>
          <Input type="number" id={`${type}-${label}`} placeholder="Number" />
        </div>
      )
    case 'textarea':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`textarea-${label}`}>Textarea</Label>
          <Textarea
            id={`textarea-${label}`}
            placeholder="Type your message here."
          />
        </div>
      )
    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox id={`checkbox-${label}`} />
          <label
            htmlFor={`checkbox-${label}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Accept terms and conditions
          </label>
        </div>
      )
    case 'radio':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${type}-${label}`}>Radio</Label>
          <RadioGroup defaultValue="option-one">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-one" id="option-one" />
              <Label htmlFor="option-one">Option One</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-two" id="option-two" />
              <Label htmlFor="option-two">Option Two</Label>
            </div>
          </RadioGroup>
        </div>
      )
    case 'select':
      return (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${type}-${label}`}>Theme</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    default:
      return null
  }
}
