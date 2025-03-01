import { NextResponse } from 'next/server'
import { fieldTypes } from '@/constants'

const availableFieldNames = fieldTypes
  .filter((field) => field.isAvaliable === true)
  .map((field) => field.name)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const aiPrompt = searchParams.get('prompt') || 'generate a feedback form'

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

  const response = await fetch(
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

  const data = await response.json()
  return NextResponse.json(data)
}
