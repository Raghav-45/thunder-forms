import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Copy,
  MoreVertical
} from 'lucide-react'
import { FC } from 'react'

const fakeResponse = {
  id: 'TF123456',
  formsId: 'form123',
  createdAt: '2024-11-26T10:15:00Z',
  data: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    age: 29,
    address: {
      street: '456 Elm St',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
    },
    phoneNumber: '987-654-3210',
    feedback: 'Great experience! The event was well-organized and informative.',
    rating: 4.5,
    preferences: {
      newsletter: true,
      interestedInSessions: ['Tech Talks', 'Workshops'],
    },
  },
}

const FormResponseViewerCard: FC = ({}) => {
  return (
    <Card className="w-full max-w-2xl rounded-xl border shadow-lg bg-card">
      <CardHeader className="flex flex-row items-start gap-4 border-b">
        <div className="flex-1 space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            Thunder Forms
          </CardTitle>
          <CardDescription className="flex items-center gap-2 group text-xs">
            {/* {selectedResponse?.id} */}sad
            <Button
              size="icon"
              variant="ghost"
              className="size-5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="size-3" />
              <span className="sr-only">Copy Response ID</span>
            </Button>
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
          {/* <Button size="sm" variant="outline" className="h-8 gap-1">
            <FileEditIcon className="h-4 w-4" />
            <span className="sr-only lg:not-sr-only">Edit Response</span>
          </Button> */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Copy JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-neutral-950/60 px-4 py-3 overflow-x-auto">
          <pre className="whitespace-pre-wrap text-xs text-white font-mono">
            {JSON.stringify(fakeResponse, null, 4)}
          </pre>
        </div>
      </CardContent>
      <CardFooter className="flex flex-row items-center gap-4 border-t px-6">
        {/* <div className="text-xs text-muted-foreground">
          {selectedResponse?.createdAt &&
            `Submitted on ${format(
              new Date(selectedResponse.createdAt),
              'PPP'
            )} @ ${format(new Date(selectedResponse.createdAt), 'p')}`}
        </div> */}
        <Button variant="destructive" size="sm" className="h-7 text-xs">
          Delete response
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  // disabled={!responses || selectedResponseIndex <= 0}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  // disabled={
                  //   !responses ||
                  //   selectedResponseIndex >= (responses?.length ?? 0) - 1
                  // }
                >
                  <ChevronRightIcon className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardFooter>
    </Card>
  )
}

export default FormResponseViewerCard
