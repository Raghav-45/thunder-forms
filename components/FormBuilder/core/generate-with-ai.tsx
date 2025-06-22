import { FieldConfig } from '@/components/FormBuilder/elements'
import { Icons } from '@/components/Icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { FC, useState } from 'react'
import { toast } from 'sonner'

interface GenerateWithAiPromptProps {
  onGeneratedFields: (
    title: string,
    description: string,
    fields: FieldConfig[]
  ) => void
}

const GenerateWithAiPrompt: FC<GenerateWithAiPromptProps> = ({
  onGeneratedFields,
}) => {
  const [aiPrompt, setAiPrompt] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)

  async function handleAiPrompt() {
    try {
      const getGeminiResponse = async () => {
        const res = await fetch(`/api/generatewithai?prompt=${aiPrompt}`)
        if (!res.ok) throw new Error('Failed to generate form')
        const resJson = await res.json()
        onGeneratedFields(resJson.title, resJson.description, resJson.fields)
        return resJson
      }

      toast.promise(getGeminiResponse(), {
        loading: 'Generating...',
        success: () => 'Form generated successfully!',
        error: 'Failed to generate form',
      })
    } catch (error) {
      console.error('Error generating content:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            className="w-full pl-9 rounded-xl resize-none overflow-hidden h-24 min-h-24"
            name="prompt"
            placeholder="Ask me anything..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAiPrompt()
                setIsOpen(false)
              }
            }}
          />
          <DialogClose asChild>
            <Button
              variant="secondary"
              className="absolute shadow-[0px_0px_15px_4px_#000000] right-2 bottom-2 h-6 rounded-lg"
              onClick={() => {
                handleAiPrompt()
                setIsOpen(false)
              }}
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
