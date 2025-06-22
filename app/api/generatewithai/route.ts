import { AVAILABLE_FIELDS } from '@/components/FormBuilder/types/types'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const aiPrompt = searchParams.get('prompt') || 'generate a feedback form'

  const templatePrompt = `Generate a form based on: "${aiPrompt}"

CRITICAL: Return ONLY valid JSON. No markdown, no explanations, no extra text.

Required JSON Structure:
{
  "title": "Form Title",
  "description": "Brief form description",
  "fields": [
    {
      "variant": "one of: ${AVAILABLE_FIELDS.join(', ')}",
      "type": "field type based on variant",
      "required": true/false,
      "label": "User-friendly label",
      "placeholder": "Helper text for input",
      "description": "Field purpose explanation"
    }
  ]
}

Field Mapping Rules:
- TextInput variant: type = "text", "email", "password", "tel", "url"
- MultiSelect variant: type = "multi-select", add "options": [{"label": "Display", "value": "key"}]
- TextArea variant: type = "textarea"
- SwitchField variant: type = "switch", add "defaultValue": false

Form Guidelines:
1. Create 3-8 relevant fields based on the request
2. Mix required (true) and optional (false) fields logically
3. Use descriptive labels and helpful placeholders
4. Include contact fields (name/email) for most forms
5. Add field descriptions that explain purpose
6. For multi-select, provide 3-6 realistic options

Example for "feedback form":
{
  "title": "Customer Feedback Form",
  "description": "Help us improve by sharing your experience",
  "fields": [
    {
      "variant": "TextInput",
      "type": "text",
      "required": true,
      "label": "Full Name",
      "placeholder": "Enter your full name",
      "description": "Your name for personalized follow-up"
    },
    {
      "variant": "TextInput",
      "type": "email",
      "required": true,
      "label": "Email Address",
      "placeholder": "your.email@example.com",
      "description": "We'll use this to respond to your feedback"
    },
    {
      "variant": "MultiSelect",
      "type": "multi-select",
      "required": false,
      "label": "Areas of Interest",
      "placeholder": "Select relevant areas",
      "description": "Help us categorize your feedback",
      "options": [
        {"label": "Product Quality", "value": "quality"},
        {"label": "Customer Service", "value": "service"},
        {"label": "Website Experience", "value": "website"},
        {"label": "Pricing", "value": "pricing"}
      ]
    },
    {
      "variant": "TextArea",
      "type": "textarea",
      "required": true,
      "label": "Your Feedback",
      "placeholder": "Share your thoughts and suggestions...",
      "description": "Detailed feedback helps us serve you better"
    },
    {
      "variant": "SwitchField",
      "type": "switch",
      "required": false,
      "label": "Subscribe to Updates",
      "placeholder": "",
      "description": "Receive occasional updates about improvements",
      "defaultValue": false
    }
  ]
}

Now generate the JSON for: "${aiPrompt}"`

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
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  )

  const data = await response.json()

  try {
    // Extract JSON from Gemini's response and validate
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Clean up the response to ensure it's valid JSON
    const cleanedJson = generatedText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Validate JSON before returning
    const parsedJson = JSON.parse(cleanedJson)

    return NextResponse.json(parsedJson)
  } catch (error) {
    console.error('JSON parsing error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate valid form JSON',
        rawResponse: data,
      },
      { status: 500 }
    )
  }
}
