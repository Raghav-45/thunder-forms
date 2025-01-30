'use client'

import { Edit2Icon, InboxIcon, PlusCircle } from 'lucide-react'

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
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LuTrash2 } from 'react-icons/lu'
import { useGenerationStore } from '@/components/GenerationStore'
import { format } from 'date-fns'

export default function Forms() {
  const { userForms, setUserForms } = useGenerationStore()
  const [isLoading, setIsLoading] = useState(!userForms)

  const [deleteFormId, setDeleteFormId] = useState<string | null>(null)
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState<boolean>(false)

  useEffect(() => {
    const fetchFormsData = async () => {
      if (isLoading) {
        try {
          const response = await fetch('/api/forms')
          const data = await response.json()
          setUserForms(data)
        } catch (error) {
          console.error('Error fetching forms:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchFormsData()
  }, [isLoading, setUserForms])

  const handleDeleteForm = async () => {
    if (!deleteFormId || !userForms) {
      return
    }

    try {
      const response = await fetch(`/api/forms/${deleteFormId}/delete`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete form')
      const id = deleteFormId
      setUserForms(userForms.filter((form) => form.id !== id))
    } catch (error) {
      console.error('Error deleting form:', error)
    }
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
              {!userForms ? (
                <p>loading...</p>
              ) : userForms && userForms.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Total Responses
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Created on
                      </TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userForms.map((form, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {form.title}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">Active</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {0}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(form.createdAt, 'PPP')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-row space-x-2 items-center justify-end">
                            <Link href={`/dashboard/forms/${form.id}`}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8"
                              >
                                <Edit2Icon />
                              </Button>
                            </Link>
                            <Button
                              size="icon"
                              variant="outline"
                              className="size-8"
                              onClick={() => {
                                setDeleteFormId(form.id)
                                setIsDeleteConfirmationOpen(true)
                              }}
                            >
                              <LuTrash2 />
                            </Button>
                            <Link href={`/dashboard/forms/${form.id}`}>
                              <Button size="sm" variant="secondary">
                                View Responses
                              </Button>
                            </Link>

                            {/* <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                  className="size-8"
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
                            </DropdownMenu> */}
                          </div>
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
                Showing <strong>1-{userForms?.length ?? 10}</strong> of{' '}
                <strong>{userForms?.length ?? 10}</strong> forms
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
