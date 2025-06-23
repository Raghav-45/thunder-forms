// scripts/generate-prompt.ts
import fs from 'fs'
import path from 'path'

async function generatePromptFromTypes() {
  try {
    // Import your types (adjust path as needed)
    const { AVAILABLE_FIELDS } = await import(
      '@/components/FormBuilder/types/types'
    )
    const { createDefaultFieldConfig } = await import(
      '@/components/FormBuilder/utils/helperFunctions'
    )

    const promptTemplate = `// This file is auto-generated from types.ts
// Do not edit manually - run 'npm run generate-prompt' to regenerate

export const DYNAMIC_SYSTEM_PROMPT = \`You are an AI assistant with access to these field types:

${AVAILABLE_FIELDS.map((field) => {
  const config = createDefaultFieldConfig(field)
  return `- ${field}: ${JSON.stringify(config, null, 2)}`
}).join('\n')}

Available fields: ${AVAILABLE_FIELDS.join(', ')}
Total field count: ${AVAILABLE_FIELDS.length}
Generated at: ${new Date().toISOString()}
\`;

export const FIELD_CONFIGS = {
${AVAILABLE_FIELDS.map((field) => {
  const config = createDefaultFieldConfig(field)
  return `  ${field}: ${JSON.stringify(config, null, 2)}`
}).join(',\n')}
};
`

    // Ensure the output directory exists
    const outputDir = path.join(__dirname, './generated')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Write the generated file
    const outputPath = path.join(outputDir, 'ai-prompt.ts')
    fs.writeFileSync(outputPath, promptTemplate)

    console.log(`✅ Generated AI prompt at: ${outputPath}`)
    console.log(`📊 Generated configs for ${AVAILABLE_FIELDS.length} fields`)
  } catch (error) {
    console.error('❌ Error generating prompt:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  generatePromptFromTypes()
}

export { generatePromptFromTypes }
