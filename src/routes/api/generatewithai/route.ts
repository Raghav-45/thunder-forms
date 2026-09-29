import { createFileRoute } from '@tanstack/react-router'
import { GoogleGenAI } from '@google/genai'

import { isKnownFieldIdentifier } from '@/features/form-builder/form-structure'
import { SYSTEM_PROMPT } from './-prompt'

export const Route = createFileRoute('/api/generatewithai')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const aiPrompt = new URL(request.url).searchParams.get('prompt')
        if (!aiPrompt) {
          return Response.json(
            { error: 'Prompt parameter is required' },
            { status: 400 },
          )
        }

        const startTime = Date.now()
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: aiPrompt,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              thinkingConfig: { thinkingBudget: 0 },
              temperature: 0.1,
            },
          })

          const generatedText = response.candidates?.[0]?.content?.parts?.[0]?.text || ''
          const cleanedJson = generatedText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()

          let parsedJson: { title?: unknown; description?: unknown; fields?: unknown }
          try {
            parsedJson = JSON.parse(cleanedJson)
          } catch {
            return Response.json({ error: 'AI returned invalid JSON' }, { status: 502 })
          }

          if (
            typeof parsedJson !== 'object' ||
            parsedJson === null ||
            typeof parsedJson.title !== 'string' ||
            !Array.isArray(parsedJson.fields) ||
            !parsedJson.fields.every(
              (field) =>
                typeof field === 'object' &&
                field !== null &&
                typeof (field as { id?: unknown }).id === 'string' &&
                isKnownFieldIdentifier(
                  (field as { uniqueIdentifier?: unknown }).uniqueIdentifier,
                ),
            )
          ) {
            return Response.json(
              { error: 'AI returned an unexpected form shape' },
              { status: 502 },
            )
          }

          const responseTimeMs = Date.now() - startTime
          return Response.json({
            ...parsedJson,
            meta: {
              responseTime: `${responseTimeMs}ms`,
              responseTimeSeconds: `${(responseTimeMs / 1000).toFixed(2)}s`,
            },
          })
        } catch (error) {
          console.error('AI form generation failed:', error)
          return Response.json({ error: 'Failed to generate form' }, { status: 500 })
        }
      },
    },
  },
})
