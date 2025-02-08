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
import { Icons } from '@/components/Icons'
import { Textarea } from '@/components/ui/textarea'

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
  const [aiPrompt, setAiPrompt] = useState<string>('')

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
        return res.json()
      }

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

          const generatedFormFields: FormFieldOrGroup[] = []
          generatedFormResponse.fields.map((field) => {
            const newFieldName = `name_${Math.random().toString().slice(-10)}` // Generate a unique field name using a random number
            const newField: FormFieldType = {
              checked: true, // Field is initially checked
              label: field.label || '', // Use label from config or fallback to generated field name
              description: field.description || '', // Use default or fallback to an empty string
              required: false, // Field is required by default
              disabled: false, // Field is enabled by default
              name: newFieldName, // Unique field name
              placeholder: field.placeholder || '', // Default placeholder if not provided
              rowIndex: 0, // Index to track field's position
              type: field.type || (field.variant == 'Input' ? 'text' : ''), // Type of the field (left empty for now)
              value: '', // Default value (empty)
              variant: field.variant, // Field type/variant (e.g., text, checkbox, etc.)
              order: generatedFormFields.length,
              onChange: () => {}, // Placeholder for the onChange handler
              onSelect: () => {}, // Placeholder for the onSelect handler
              setValue: () => {}, // Placeholder for the setValue handler
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
        <Button className="w-full" variant="secondary">
          <Icons.Sparkles className="size-4 fill-white" />
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-4">
        <DialogHeader>
          <DialogTitle>AI Prompt</DialogTitle>
          <DialogDescription>
            Enter your prompt and click Generate
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full">
          <Icons.Sparkles className="absolute left-3 top-2.5 size-4 fill-white" />
          <Textarea
            className="w-full pl-9 rounded-xl resize-none overflow-hidden h-10 min-h-10 group focus:h-24 focus:min-h-24 transition-all"
            name="prompt"
            placeholder="Ask me anything..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <DialogClose asChild>
            <Button
              variant="secondary"
              className="absolute shadow-[0px_0px_15px_4px_#000000] right-2 bottom-2 h-6 rounded-lg"
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
