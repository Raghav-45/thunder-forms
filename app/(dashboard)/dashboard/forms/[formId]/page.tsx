'use client'

import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Copy,
  Edit2Icon,
  File,
  FileEditIcon,
  InboxIcon,
  ListFilter,
  MoreHorizontalIcon,
  MoreVertical,
} from 'lucide-react'

import {
  endOfMonth,
  endOfWeek,
  format,
  formatDistance,
  isThisMonth,
  isThisWeek,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'

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
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ResponseType } from '@/types/types'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Loading from '../../loading'

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

const currentDate = new Date()

export default function Responses() {
  const { formId } = useParams()

  const [responses, setResponses] = useState<ResponseType[]>()
  const [selectedResponse, setSelectedResponse] = useState<ResponseType>()
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<number>(0)

  const [isLoading, setIsLoading] = useState(true)

  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState<boolean>(false)

  // Calculate statistics for different time periods
  const stats = useMemo(() => {
    if (!responses?.length)
      return {
        week: { current: 0, previous: 0, change: 0 },
        month: { current: 0, previous: 0, change: 0 },
      }

    // Week calculations
    const startOfCurrentWeek = startOfWeek(currentDate)
    const startOfPreviousWeek = subWeeks(startOfCurrentWeek, 1)
    const endOfPreviousWeek = endOfWeek(startOfPreviousWeek)

    // Month calculations
    const startOfCurrentMonth = startOfMonth(currentDate)
    const startOfPreviousMonth = subMonths(startOfCurrentMonth, 1)
    const endOfPreviousMonth = endOfMonth(startOfPreviousMonth)

    const calculateStats = (
      currentFilter: (date: Date) => boolean,
      previousInterval: { start: Date; end: Date }
    ) => {
      const currentCount = responses.filter((response) =>
        currentFilter(new Date(response.createdAt))
      ).length

      const previousCount = responses.filter((response) => {
        const date = new Date(response.createdAt)
        return isWithinInterval(date, previousInterval)
      }).length

      const percentageChange =
        previousCount === 0
          ? currentCount === 0
            ? 0
            : 100
          : ((currentCount - previousCount) / previousCount) * 100

      return {
        current: currentCount,
        previous: previousCount,
        change: Math.round(percentageChange),
      }
    }

    return {
      week: calculateStats((date) => isThisWeek(date), {
        start: startOfPreviousWeek,
        end: endOfPreviousWeek,
      }),
      month: calculateStats((date) => isThisMonth(date), {
        start: startOfPreviousMonth,
        end: endOfPreviousMonth,
      }),
    }
  }, [responses])

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await fetch(`/api/forms/${formId}/responses`)
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const responseData = await response.json()
        if (responseData.responses) {
          setResponses(responseData.responses)
          setSelectedResponse(responseData.responses[0])
          setIsLoading(false)
        } else {
          toast.error('Failed to load form data')
        }
      } catch (error) {
        console.error('Error fetching form data:', error)
        toast.error('Error loading form data')
      }
    }

    fetchResponses()
  }, [formId]) // Only depends on slug

  const handleDeleteResponse = async (id: string) => {
    if (!id || !responses) {
      return
    }

    // try {
    //   const response = await fetch(
    //     `/api/forms/${formId}/responses/${id}/delete`,
    //     {
    //       method: 'DELETE',
    //     }
    //   )
    //   if (!response.ok) throw new Error('Failed to delete response')
    //   setResponses(responses!.filter((response) => response.id !== id))
    //   setIsDeleteConfirmationOpen(false)
    // } catch (error) {
    //   console.error('Error deleting response:', error)
    // }
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card
            className="sm:col-span-2 relative"
            x-chunk="dashboard-05-chunk-0"
          >
            <CardHeader className="pb-3">
              <CardTitle>Form Insights</CardTitle>
              <CardDescription className="text-balance max-w-lg leading-relaxed">
                Introducing Our Dashboard for Seamless Management and Insightful
                Analysis of Form.
              </CardDescription>
            </CardHeader>
            <CardFooter className="absolute bottom-0 right-0 gap-x-2">
              <Button
                size="sm"
                variant="secondary"
                className="ml-auto gap-1"
                asChild
              >
                <Link
                  href={`/forms/${selectedResponse?.formsId}`}
                  target="_blank"
                >
                  View form
                  <ArrowUpRightIcon className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 ml-auto gap-2"
                asChild
              >
                <Link href={`/dashboard/builder/${selectedResponse?.formsId}`}>
                  <Edit2Icon className="h-4 w-4" />
                  Edit form
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* This Week Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>This Week</CardDescription>
              <CardTitle className="text-4xl">{stats.week.current}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {stats.week.change >= 0 ? '+' : ''}
                {stats.week.change}% from last week
              </div>
            </CardContent>
            <CardFooter>
              <Progress
                value={Math.abs(stats.week.change)}
                aria-label={`${stats.week.change}% change`}
              />
            </CardFooter>
          </Card>

          {/* This Month Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-4xl">{stats.month.current}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {stats.month.change >= 0 ? '+' : ''}
                {stats.month.change}% from last month
              </div>
            </CardContent>
            <CardFooter>
              <Progress
                value={Math.abs(stats.month.change)}
                aria-label={`${stats.month.change}% change`}
              />
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
                  Recent Entries from Your Form.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {responses && responses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Submission ID</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Status
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Submitted
                        </TableHead>
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
                            onClick={() => {
                              setSelectedResponse(response)
                              setSelectedResponseIndex(index)
                            }}
                          >
                            <TableCell className="font-medium">
                              {response.id || 'N/A'}
                            </TableCell>
                            <TableCell className="truncate max-w-[200px] hidden md:table-cell">
                              <Badge className="text-xs" variant="outline">
                                completed
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {formatDistance(
                                new Date(response.createdAt),
                                currentDate,
                                {
                                  addSuffix: true,
                                }
                              )}
                            </TableCell>
                            <TableCell className="text-right">
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

      <div className="hidden md:block">
        <Card className="overflow-hidden" x-chunk="dashboard-05-chunk-4">
          <CardHeader className="flex flex-row items-start bg-muted/50">
            <div className="grid gap-0.5">
              <CardTitle className="flex items-center gap-2 text-lg">
                Thunder Forms
              </CardTitle>
              <CardDescription className="group flex items-center gap-2">
                {selectedResponse?.id}
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
                {JSON.stringify(selectedResponse ?? fakeResponse, null, 4)}
              </code>
            </pre>
          </CardContent>
          <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
            <div className="text-xs text-muted-foreground">
              {selectedResponse?.createdAt &&
                `Submitted on ${format(
                  new Date(selectedResponse.createdAt),
                  'PPP'
                )} @ ${format(new Date(selectedResponse.createdAt), 'p')}`}
            </div>
            <div className="ml-auto mr-0 w-auto flex gap-x-4">
              {selectedResponse && (
                <Dialog
                  open={isDeleteConfirmationOpen}
                  onOpenChange={setIsDeleteConfirmationOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 text-xs"
                    >
                      Delete response
                    </Button>
                  </DialogTrigger>
                  <DialogContent isClosable={false}>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete your form and remove your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Close
                        </Button>
                      </DialogClose>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          handleDeleteResponse(selectedResponse?.id)
                        }}
                      >
                        Continue
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <Pagination className="ml-auto mr-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      onClick={() => {
                        if (selectedResponseIndex > 0 && responses) {
                          const newIndex = selectedResponseIndex - 1
                          setSelectedResponseIndex(newIndex)
                          setSelectedResponse(responses[newIndex])
                        }
                      }}
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      disabled={!responses || selectedResponseIndex <= 0}
                    >
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                      <span className="sr-only">Previous</span>
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      onClick={() => {
                        if (
                          responses &&
                          selectedResponseIndex < responses.length - 1
                        ) {
                          const newIndex = selectedResponseIndex + 1
                          setSelectedResponseIndex(newIndex)
                          setSelectedResponse(responses[newIndex])
                        }
                      }}
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      disabled={
                        !responses ||
                        selectedResponseIndex >= (responses?.length ?? 0) - 1
                      }
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
