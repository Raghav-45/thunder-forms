import { FC } from 'react'

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
  FileEditIcon,
  MoreVertical,
} from 'lucide-react'

const FormResponseViewerCard: FC = ({}) => {
  return (
    <Card className="overflow-hidden" x-chunk="dashboard-05-chunk-4">
      <CardHeader className="flex flex-row items-start bg-muted/50">
        <div className="grid gap-0.5">
          <CardTitle className="flex items-center gap-2 text-lg">
            Thunder Forms
          </CardTitle>
          <CardDescription className="group flex items-center gap-2">
            {/* {selectedResponse?.id} */}sad
            <Button
              size="icon"
              variant="outline"
              className="size-5 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Copy className="!size-3" />
              <span className="sr-only">Copy Response ID</span>
            </Button>
          </CardDescription>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <FileEditIcon className="h-3.5 w-3.5" />
            <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
              Edit Response
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Copy JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 text-sm">
        <pre className="rounded-lg bg-neutral-800/60 px-4 py-2 whitespace-pre-wrap">
          <code className="text-white font-mono text-xs">
            {JSON.stringify(
              {
                id: 'TF123456',
                formsId: 'form123', // Added for hard-coded data
                createdAt: '2024-11-26T10:15:00Z', // ISO string for date
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
                  feedback:
                    'Great experience! The event was well-organized and informative.',
                  rating: 4.5,
                  preferences: {
                    newsletter: true,
                    interestedInSessions: ['Tech Talks', 'Workshops'],
                  },
                },
              },
              null,
              4
            )}
          </code>
        </pre>
      </CardContent>
      <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
        {/* <div className="text-xs text-muted-foreground">
          {selectedResponse?.createdAt &&
            `Submitted on ${format(
              new Date(selectedResponse.createdAt),
              'PPP'
            )} @ ${format(new Date(selectedResponse.createdAt), 'p')}`}
        </div> */}
        <div className="ml-auto mr-0 w-auto flex gap-x-4">
          <Button variant="destructive" size="sm" className="h-6 text-xs">
              Delete response
            </Button>

          <Pagination className="ml-auto mr-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <Button
                  // onClick={() => {
                  //   if (selectedResponseIndex > 0 && responses) {
                  //     const newIndex = selectedResponseIndex - 1
                  //     setSelectedResponseIndex(newIndex)
                  //     setSelectedResponse(responses[newIndex])
                  //   }
                  // }}
                  size="icon"
                  variant="outline"
                  className="h-6 w-6"
                  // disabled={!responses || selectedResponseIndex <= 0}
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                  <span className="sr-only">Previous</span>
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  // onClick={() => {
                  //   if (
                  //     responses &&
                  //     selectedResponseIndex < responses.length - 1
                  //   ) {
                  //     const newIndex = selectedResponseIndex + 1
                  //     setSelectedResponseIndex(newIndex)
                  //     setSelectedResponse(responses[newIndex])
                  //   }
                  // }}
                  size="icon"
                  variant="outline"
                  className="h-6 w-6"
                  // disabled={
                  //   !responses ||
                  //   selectedResponseIndex >= (responses?.length ?? 0) - 1
                  // }
                >
                  <ChevronRightIcon className="h-3.5 w-3.5" />
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
