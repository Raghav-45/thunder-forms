import fs from 'fs'
import path from 'path'

async function generatePrompt() {
  try {
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
  generatePrompt()
}

export { generatePrompt }
