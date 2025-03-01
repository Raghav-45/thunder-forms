import { FC, useState } from 'react'
import { FormFieldOrGroup, FormFieldType, TemplateType } from '@/types/types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/Icons'
import { Textarea } from '@/components/ui/textarea'
import { fieldTypes } from '@/constants'
import { Card, CardContent, CardDescription } from '@/components/ui/card'

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

  const availableFieldNames = fieldTypes
    .filter((field) => field.isAvaliable === true)
    .map((field) => field.name)

  async function handleAiPrompt() {
    const templatePrompt = `User Input: ${aiPrompt}

    Instructions = Generate a JSON object for a single form template. The form should have the following structure:

{
  [
    {
      "variant": "Input",
      "type": "text",
      "required": true,
      "label": "Your Name",
      "placeholder": "e.g., John Doe"
      "description": "Provide your name for identification.",
    },
    {
      "variant": "Input",
      "type": "email",
      "required": true,
      "label": "Your Email",
      "placeholder": "Enter your email"
      "description": "The user's email address for follow-up.",
    },
    {
      "variant": "Textarea",
      "type": "textarea",
      "required": false,
      "label": "Feedback",
      "placeholder": "Write your feedback here"
      "description": "Detailed feedback from the user.",
    }
  ]
}

make sure to Strictly follow these Properties:

title: The name of the form.
description: A short description of the form's purpose.
fields: An array containing field definitions with the following:
{
  type: Field type (text, email, number are supported currently).
  label: Field label visible to users.
  variant: Indicates input type ({${availableFieldNames.join(
    ', '
  )}} are only supported currently).
  required: Boolean (true or false) for mandatory fields.
  description: A short explanation of the field.
  placeholder: Placeholder text inside the field.
}

remember just give JSON, no extra TEXTS`

    try {
      const getGeminiResponse = async () => {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
    <Card className=" w-full max-w-xl border-0">
      <CardContent className="p-4 pt-6 text-left">
        {/* <h2 className="text-2xl font-bold">AI Prompt</h2>
        <CardDescription>Enter your prompt and click Generate</CardDescription> */}
        <h2 className="text-xl font-semibold">
          Drag elements here or Generate with AI
        </h2>
        {/* <CardDescription>
          Explain AI which type of form you want to build
        </CardDescription> */}
        <div className="relative mt-4">
          <Icons.Sparkles className="absolute left-3 top-2.5 size-4 fill-white" />
          <Textarea
            className="w-full pl-9 rounded-xl resize-none overflow-hidden h-24 min-h-24"
            name="prompt"
            placeholder="Which type of form you want to build?"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <Button
            variant="secondary"
            className="absolute shadow-[0px_0px_15px_4px_#000000] right-2 bottom-2 h-6 rounded-lg"
            onClick={() => handleAiPrompt()}
          >
            Generate
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default GenerateWithAiPrompt
