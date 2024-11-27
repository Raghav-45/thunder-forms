import { InboxIcon, MoreHorizontal, PlusCircle } from 'lucide-react'

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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAllForms } from '@/lib/dbUtils'

export default async function Forms() {
  const formsss = await getAllForms()
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
            <Button size="sm" className="h-7 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                New Form
              </span>
            </Button>
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
              {formsss && formsss?.length > 0 ? (
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
                    {formsss.map((form, index) => (
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
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Delete</DropdownMenuItem>
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
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{formsss?.length ?? 10}</strong> of{' '}
                <strong>{formsss?.length ?? 10}</strong> forms
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
