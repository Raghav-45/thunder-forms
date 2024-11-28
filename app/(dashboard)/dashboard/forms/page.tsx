'use client'

import { InboxIcon, MoreHorizontalIcon, PlusCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { deleteFormById, FormTypeWithId, getAllForms } from '@/lib/dbUtils'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function Forms() {
  const [forms, setForms] = useState<FormTypeWithId[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteFormId, setDeleteFormId] = useState<string>('')
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState<boolean>(false)

  useEffect(() => {
    async function fetchForms() {
      try {
        if (forms.length == 0) {
          setIsLoading(true)
          const data = await getAllForms()
          setForms(data)
        }
      } catch (error) {
        console.error('Error fetching forms:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchForms()
  }, [forms])

  const handleDeleteForm = async () => {
    const id = await deleteFormById(deleteFormId)
    setForms((prevForms) => prevForms.filter((form) => form.id !== id))
  }

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="archived" className="hidden sm:flex">
              Archived
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/dashboard/forms/new-form"
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'h-7 gap-1'
              )}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                New Form
              </span>
            </Link>
          </div>
        </div>
        <TabsContent value="all">
          <Card x-chunk="dashboard-06-chunk-0">
            <CardHeader>
              <CardTitle>Manage Your Forms</CardTitle>
              <CardDescription>
                Effortlessly create, organize, and track your forms in one
                place.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>loading...</p>
              ) : forms && forms.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Total Responses
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Created at
                      </TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forms.map((form, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {form.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Active</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {0}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {form.description}
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
                              <Link href={`/dashboard/forms/${form.id}`}>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeleteFormId(form.id)
                                  setIsDeleteConfirmationOpen(true)
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}

                    <Dialog
                      open={isDeleteConfirmationOpen}
                      onOpenChange={setIsDeleteConfirmationOpen}
                    >
                      <DialogContent isClosable={false}>
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently
                            delete your form and remove your data from our
                            servers.
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
                              handleDeleteForm()
                              setIsDeleteConfirmationOpen(false)
                            }}
                          >
                            Continue
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableBody>
                </Table>
              ) : (
                <NoDataComponent />
              )}
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{forms?.length ?? 10}</strong> of{' '}
                <strong>{forms?.length ?? 10}</strong> forms
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
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
        <h2 className="text-2xl font-bold tracking-tight">
          You haven&apos;t created any forms yet
        </h2>
        <p className="text-muted-foreground text-sm">
          Welcome to Thunder Forms, Ready to create your first form?
          <br />
          Click the{' '}
          <span className="text-primary font-semibold">
            &quot;New Form&quot;
          </span>{' '}
          button above and get started in seconds.
        </p>
        <p className="text-muted-foreground text-xs italic">
          Your journey to seamless form creation begins here.
        </p>
      </div>
    </div>
  )
}
