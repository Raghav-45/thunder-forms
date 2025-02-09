import { Icons } from '@/components/Icons'
import { Card } from '@/components/ui/card'

export default function FormSubmissionPage() {
  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex flex-col flex-1 p-6 md:p-10">
        <div className="flex items-center justify-center text-2xl font-medium text-white mb-8">
          <Icons.ThunderFormsLogo className="h-8 w-8 mr-2" />
          Thunder Forms
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md px-2 py-4 bg-neutral-800">
            <div className="text-center">
              <h1 className="text-xl font-bold mb-4 text-white">
                Thank you for your submission!
              </h1>
              <p className="text-muted-foreground">
                We have received your response.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
