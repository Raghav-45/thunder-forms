import { FC, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FormFieldOrGroup, FormFieldType, TemplateType } from '@/types/types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icons } from './Icons'

interface GenerateWithAiPromptProps {
  onGeneratedFields: (
    title: string,
    description: string,
    fields: FormFieldOrGroup[]
  ) => void
}

const GenerateWithAiPrompt: FC<GenerateWithAiPromptProps> = ({
  onGeneratedFields,
}) => {
  const [aiPrompt, setAiPrompt] = useState('')

  async function handleAiPrompt() {
    const templatePrompt = `User Input: ${aiPrompt}

    Instructions = Generate a JSON object for a single form template. The form should have the following structure:

{
  [
    {
      "type": "text",
      "label": "Your Name",
      "variant": "Input",
      "required": true,
      "description": "The user's full name for personalization.",
      "placeholder": "Enter your name"
    },
    {
      "type": "email",
      "label": "Your Email",
      "variant": "Input",
      "required": true,
      "description": "The user's email address for follow-up.",
      "placeholder": "Enter your email"
    },
    {
      "type": "textarea",
      "label": "Feedback",
      "variant": "Textarea",
      "required": false,
      "description": "Detailed feedback from the user.",
      "placeholder": "Write your feedback here"
    }
  ]
}

Required Properties:
title: The name of the form.
description: A short description of the form's purpose.
fields: An array containing field definitions with the following:
type: Field type (text, email, number are supported currently).
label: Field label visible to users.
variant: Indicates input type (Input or Textarea are supported currently).
required: Boolean (true or false) for mandatory fields.
description: A short explanation of the field.
placeholder: Placeholder text inside the field.

remember just give JSON, no extra TEXTS`

    try {
      const getGeminiResponse = async () => {
        const res = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCKktPBcP5xHerZxIP5AYNb6L1n_dVNn-M',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: templatePrompt }],
                },
              ],
            }),
          }
        )
        if (!res.ok) throw new Error('Failed to generate form')
        // console.log(res.json())
        return res.json()
      }

      // const data = await getGeminiResponse()

      const generateFormFields = async () => {
        const geminiResponse = await getGeminiResponse()
        const parsedFormFields =
          geminiResponse.candidates[0].content.parts[0].text.match(
            /\{[\s\S]*\}/
          )[0]

        if (parsedFormFields) {
          const generatedFormResponse: Pick<
            TemplateType,
            'title' | 'description' | 'fields'
          > = JSON.parse(parsedFormFields)
          // setFormTitle(generatedFormResponse.title)
          // setFormDescription(generatedFormResponse.description)

          const generatedFormFields: FormFieldOrGroup[] = []
          generatedFormResponse.fields.map((field) => {
            const newFieldName = `name_${Math.random().toString().slice(-10)}` // Generate a unique field name using a random number
            const newField: FormFieldType = {
              checked: true, // Field is initially checked
              description: field.description || '', // Use default or fallback to an empty string
              disabled: false, // Field is enabled by default
              label: field.label || newFieldName, // Use label from config or fallback to generated field name
              name: newFieldName, // Unique field name
              onChange: () => {}, // Placeholder for the onChange handler
              onSelect: () => {}, // Placeholder for the onSelect handler
              placeholder: field.placeholder || 'Placeholder', // Default placeholder if not provided
              required: true, // Field is required by default
              rowIndex: 0, // Index to track field's position
              setValue: () => {}, // Placeholder for the setValue handler
              type: '', // Type of the field (left empty for now)
              value: '', // Default value (empty)
              variant: field.variant, // Field type/variant (e.g., text, checkbox, etc.)
              order: generatedFormFields.length,
            }
            generatedFormFields.push(newField)
          })
          // setFormFields(generatedFormFields)
          onGeneratedFields(
            generatedFormResponse.title,
            generatedFormResponse.description,
            generatedFormFields
          )
        }
      }

      toast.promise(generateFormFields(), {
        loading: 'Generating...',
        success: () => 'Form generated successfully!',
        error: 'Failed to generate form',
      })
    } catch (error) {
      console.error('Error generating content:', error)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div>
          <Button className="w-full mt-8" variant="secondary">
            <Icons.Sparkles className="size-4 fill-white" />
            Generate with AI
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Prompt</DialogTitle>
          <DialogDescription>
            Enter your prompt and click Generate or press Enter
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full">
          <Icons.Sparkles className="absolute left-3 top-1/2 size-4 -translate-y-1/2 fill-white" />
          <Input
            id="aiPrompt"
            type="text"
            className="w-full h-10 pl-10 pr-24 rounded-full"
            name="prompt"
            placeholder="Ask AI..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <DialogClose asChild>
            <Button
              variant="secondary"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 rounded-full"
              onClick={() => handleAiPrompt()}
            >
              Generate
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default GenerateWithAiPrompt
