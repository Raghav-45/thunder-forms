import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from '../prompt'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const aiPrompt = searchParams.get('prompt')

  if (!aiPrompt) {
    return NextResponse.json(
      { error: 'Prompt parameter is required' },
      { status: 400 }
    )
  }

  const startTime = Date.now()

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: aiPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      thinkingConfig: {
        thinkingBudget: 0, // Disables thinking
      },
      temperature: 0.1,
    },
  })

  const endTime = Date.now()
  const responseTimeMs = endTime - startTime

  const generatedText =
    response.candidates?.[0]?.content?.parts?.[0]?.text || ''

  const cleanedJson = generatedText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const parsedJson = JSON.parse(cleanedJson)

  return NextResponse.json({
    ...parsedJson,
    meta: {
      responseTime: `${responseTimeMs}ms`,
      responseTimeSeconds: `${(responseTimeMs / 1000).toFixed(2)}s`,
    },
  })
}
