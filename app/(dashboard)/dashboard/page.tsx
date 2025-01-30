'use client'

import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  InboxIcon,
  PlusCircle,
  Users,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
import { useGenerationStore } from '@/components/GenerationStore'
import Loading from './loading'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const recentActivity = [
  {
    avatarSrc: 'https://ui.shadcn.com/avatars/01.png',
    avatarFallback: 'OM',
    name: 'Olivia Martin',
    action: 'Submitted a form',
    extraInfo: '+1 response',
  },
  {
    avatarSrc: 'https://ui.shadcn.com/avatars/02.png',
    avatarFallback: 'JL',
    name: 'Jackson Lee',
    action: 'Submitted a form',
    extraInfo: '+1 response',
  },
  {
    avatarSrc: 'https://ui.shadcn.com/avatars/03.png',
    avatarFallback: 'IN',
    name: 'Isabella Nguyen',
    action: 'Submitted a form',
    extraInfo: '+1 response',
  },
  {
    avatarSrc: 'https://ui.shadcn.com/avatars/04.png',
    avatarFallback: 'WK',
    name: 'William Kim',
    action: 'Submitted a form',
    extraInfo: '+1 response',
  },
  {
    avatarSrc: 'https://ui.shadcn.com/avatars/05.png',
    avatarFallback: 'SD',
    name: 'Sofia Davis',
    action: 'Submitted a form',
    extraInfo: '+1 response',
  },
]

export default function Dashboard() {
  const { userForms, setUserForms } = useGenerationStore()
  const [isLoading, setIsLoading] = useState(!userForms)

  useEffect(() => {
    const fetchFormsData = async () => {
      if (isLoading) {
        try {
          // Use cache: 'no-store' to ensure fresh data on each request
          const response = await fetch('/api/forms', {
            cache: 'no-store',
            next: {
              revalidate: 0, // Disable caching completely
            },
          })
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

  if (isLoading) {
    return <Loading />
  }

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card x-chunk="dashboard-01-chunk-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,523.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userForms?.length || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Form Submissions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2" x-chunk="dashboard-01-chunk-4">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Forms</CardTitle>
              <CardDescription>All your forms in one place.</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              {userForms ? (
                <Link href="/dashboard/forms">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/dashboard/builder/new-form"
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
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {userForms ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right w-[150px]">
                      Created on
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell>
                        <div className="font-medium">{form.title}</div>
                        <div className="text-sm line-clamp-1 text-muted-foreground">
                          {form.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {format(form.createdAt, 'PPP')}
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
        <Card x-chunk="dashboard-01-chunk-5">
          <CardHeader>
            <CardTitle>Recent Form Activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8">
            {recentActivity.map((user, index) => (
              <div key={index} className="flex items-center gap-4">
                <Avatar className="hidden h-9 w-9 sm:flex">
                  <AvatarImage src={user.avatarSrc} alt="Avatar" />
                  <AvatarFallback>{user.avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.action}</p>
                </div>
                <div className="ml-auto font-medium">{user.extraInfo}</div>
              </div>
            ))}
          </CardContent>
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
