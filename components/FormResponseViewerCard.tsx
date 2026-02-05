import { FC } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
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
import { format } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, MoreVertical } from 'lucide-react'

const fakeResponse = {
  id: 'cmc94ml0v000bybkgit97n0e0',
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
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold">Response Viewer</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {fakeResponse?.id}
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shadow-none"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Copy JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-neutral-950/60 px-4 py-3 overflow-x-auto">
          <pre className="whitespace-pre-wrap text-xs text-white font-mono">
            {JSON.stringify(fakeResponse, null, 4)}
          </pre>
        </div>
      </CardContent>
      <CardFooter className="flex flex-row items-center gap-4 border-t px-6">
        <div className="text-xs text-muted-foreground">
          {fakeResponse?.createdAt &&
            `${format(new Date(fakeResponse.createdAt), 'PPP')} @ ${format(
              new Date(fakeResponse.createdAt),
              'p'
            )}`}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button size="icon" variant="outline" className="h-7 w-7">
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button size="icon" variant="outline" className="h-7 w-7">
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
