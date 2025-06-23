import fs from 'fs'
import path from 'path'

/**
 * Extracts all type definitions from 'type.ts' files within element folders,
 * removing import statements.
 * @param elementsDirPath The path to the 'FormBuilder/elements' directory.
 * @returns A string containing all extracted type definitions.
 */
export async function extractElementTypeDefinitions(elementsDirPath: string): Promise<string> {
  let allTypeDefs = ''

  try {
    const elementFolders = fs.readdirSync(elementsDirPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const folderName of elementFolders) {
      const typeFilePath = path.join(elementsDirPath, folderName, 'types.ts')

      if (fs.existsSync(typeFilePath)) {
        let fileContent = fs.readFileSync(typeFilePath, 'utf-8')

        // This is the line that removes imports. It MUST be applied here.
        fileContent = fileContent.replace(/import .* from .*\r?\n/g, '') // Added \r? for robustness

        allTypeDefs += `\n// --- Types from ${folderName}/types.ts ---`
        allTypeDefs += fileContent
      }
    }
  } catch (error) {
    throw new Error(`Failed to extract element type definitions: ${error}`)
  }

  return allTypeDefs
}

async function extractBaseFieldConfig(filePath: string): Promise<string> {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    // Regex to match the BaseFieldConfig interface with its JSDoc comment
    const interfaceRegex = /\/\*\*[\s\S]*?\*\/\s*export\s+interface\s+BaseFieldConfig\s*\{[\s\S]*?\n\}/g
    
    const match = fileContent.match(interfaceRegex)
    
    if (!match || match.length === 0) {
      throw new Error('BaseFieldConfig interface not found in the file')
    }
    
    return match[0]
  } catch (error) {
    throw new Error(`Failed to extract BaseFieldConfig: ${error}`)
  }
}

async function generatePrompt() {
  try {
    // Import your types (adjust path as needed)
    const { BASE_PROMPT } = await import('./base-prompt')
    const { AVAILABLE_FIELDS } = await import(
      '@/components/FormBuilder/types/types'
    )
    
    // Extract BaseFieldConfig from the types file
    const typesFilePath = path.resolve('./components/FormBuilder/types/types.ts')
    const baseFieldConfigInterface = await extractBaseFieldConfig(typesFilePath)

    // NEW: Extract all specific element type definitions
    const elementsDirPath = path.resolve('./components/FormBuilder/elements');
    const specificFieldTypeDefinitions = await extractElementTypeDefinitions(elementsDirPath);

    const promptTemplate = `// This file is auto-generated from scripts/prompt/generator.ts
// Do not edit manually - run 'npm run generate-prompt' to regenerate

export const DYNAMIC_SYSTEM_PROMPT = \`${BASE_PROMPT}

## FIELD TYPE SPECIFICATIONS: 

${baseFieldConfigInterface}

${specificFieldTypeDefinitions}

\``
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
