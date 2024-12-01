'use client'

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Copy,
  File,
  FileEditIcon,
  InboxIcon,
  ListFilter,
  MoreHorizontalIcon,
  MoreVertical,
} from 'lucide-react'

import { format } from 'date-fns'

import { Badge } from '@/components/ui/badge'
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { useEffect, useState } from 'react'
import { FormResponseTypeWithId, getResponsesByFormId } from '@/lib/dbUtils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const fakeResponse = {
  submissionId: 'TF123456',
  formName: 'Event Registration',
  status: 'Completed',
  SubmittedOn: '2024-11-26 10:15 AM',
  fields: {
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

export default function Responses() {
  const { formId } = useParams()

  const [responses, setResponses] = useState<FormResponseTypeWithId[]>()
  const [selectedResponse, setSelectedResponse] =
    useState<FormResponseTypeWithId>()

  useEffect(() => {
    getResponsesByFormId(
      typeof formId == 'string' ? formId : '2bFG4MkZjcnwBUBSohw7'
    )
      .then((responseData) => {
        if (responseData) {
          setResponses(responseData)
          setSelectedResponse(responseData[0])
        } else {
          toast.error('Failed to load form data')
        }
      })
      .catch((error) => {
        console.error('Error fetching form data:', error)
        toast.error('Error loading form data')
      })
  }, [formId]) // Only depends on slug

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card className="sm:col-span-2" x-chunk="dashboard-05-chunk-0">
            <CardHeader className="pb-3">
              <CardTitle>Form Responses</CardTitle>
              <CardDescription className="text-balance max-w-lg leading-relaxed">
                Introducing Our Dashboard for Seamless Management and Insightful
                Analysis of Form Responses.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button>Create a new form</Button>
            </CardFooter>
          </Card>
          <Card x-chunk="dashboard-05-chunk-1">
            <CardHeader className="pb-2">
              <CardDescription>This Week</CardDescription>
              <CardTitle className="text-4xl">
                {responses?.length ?? '1,329'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                +25% from last week
              </div>
            </CardContent>
            <CardFooter>
              <Progress value={25} aria-label="25% increase" />
            </CardFooter>
          </Card>
          <Card x-chunk="dashboard-05-chunk-2">
            <CardHeader className="pb-2">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-4xl">
                {responses?.length ?? '5,329'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                +10% from last month
              </div>
            </CardContent>
            <CardFooter>
              <Progress value={12} aria-label="12% increase" />
            </CardFooter>
          </Card>
        </div>
        <Tabs defaultValue="week">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-sm"
                  >
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked>
                    Fulfilled
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Declined</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Refunded</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-sm">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Export</span>
              </Button>
            </div>
          </div>
          <TabsContent value="week">
            <Card x-chunk="dashboard-05-chunk-3">
              <CardHeader className="px-7">
                <CardTitle>Form Submissions</CardTitle>
                <CardDescription>
                  Recent Entries from Your Forms.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {responses && responses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Submission ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted On</TableHead>
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responses &&
                        responses.map((response, index) => (
                          <TableRow
                            key={index}
                            className={cn(
                              'cursor-pointer',
                              selectedResponse?.id == response.id
                                ? 'bg-muted/50'
                                : ''
                            )}
                            onClick={() => setSelectedResponse(response)}
                          >
                            <TableCell className="font-medium">
                              {response.id || 'N/A'}
                            </TableCell>
                            <TableCell className="truncate max-w-[200px]">
                              <Badge className="text-xs" variant="outline">
                                completed
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {/* {(response?.submittedAt &&
                                formatDate(response.submittedAt)) ||
                                'Unknown'} */}
                              {response?.submittedAt}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <MoreHorizontalIcon className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Delete Response
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <NoDataComponent />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <Card className="overflow-hidden" x-chunk="dashboard-05-chunk-4">
          <CardHeader className="flex flex-row items-start bg-muted/50">
            <div className="grid gap-0.5">
              <CardTitle className="group flex items-center gap-2 text-lg">
                Thunder Form {fakeResponse?.submissionId ?? 'Oe31b70H'}
                <Button
                  size="icon"
                  variant="outline"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Copy className="size-3" />
                  <span className="sr-only">Copy Response ID</span>
                </Button>
              </CardTitle>
              <CardDescription>
                Date:{' '}
                {fakeResponse
                  ? format(fakeResponse?.SubmittedOn, 'PPP')
                  : 'November 23, 2023'}
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
                  {selectedResponse && (
                    <Link
                      href={`/dashboard/forms/${selectedResponse?.parentFormId}`}
                    >
                      <DropdownMenuItem>Edit form</DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuItem>Copy JSON</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-4 text-sm">
            <pre className="rounded-lg bg-neutral-800/60 px-4 py-2 whitespace-pre-wrap">
              <code className="text-white font-mono text-xs">
                {JSON.stringify(selectedResponse ?? fakeResponse, null, 4)}
              </code>
            </pre>
          </CardContent>
          <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
            <div className="text-xs text-muted-foreground">
              Updated on{' '}
              {fakeResponse && format(fakeResponse?.SubmittedOn, 'PPP')}
            </div>
            <div className="ml-auto mr-0 w-auto flex gap-x-4">
              <Button variant="destructive" size="sm" className="h-6 text-xs">
                Delete response
              </Button>
              <Pagination className="ml-auto mr-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <Button size="icon" variant="outline" className="h-6 w-6">
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                      <span className="sr-only">Previous Order</span>
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <Button size="icon" variant="outline" className="h-6 w-6">
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                      <span className="sr-only">Next Order</span>
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}

function NoDataComponent() {
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
