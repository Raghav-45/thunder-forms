import { InboxIcon } from 'lucide-react'
import { FC } from 'react'

const NoResponsesYetCard: FC = ({}) => {
  return (
    <div className="flex flex-col w-full items-center justify-center h-[50vh] gap-6">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted">
        <InboxIcon className="w-10 h-10 text-muted-foreground" />
      </div>
      <div className="space-y-3 text-center">
        <h2 className="text-2xl font-bold tracking-tight">No Responses Yet</h2>
        <p className="text-muted-foreground text-sm">
          Your form hasn&apos;t received any responses yet.
          <br />
          Share your form link and start collecting responses today!
        </p>
        <p className="text-muted-foreground text-xs italic">
          ThunderForms helps you collect and manage responses with ease.
        </p>
      </div>
    </div>
  )
}

export default NoResponsesYetCard
