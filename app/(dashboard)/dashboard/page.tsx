'use client'

import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useEffect } from 'react'
import { siteConfig } from '@/config/site'

const transactions = [
  {
    customer: 'Liam Johnson',
    email: 'liam@example.com',
    type: 'Sale',
    status: 'Approved',
    date: '2023-06-23',
    amount: 250.0,
  },
  {
    customer: 'Olivia Smith',
    email: 'olivia@example.com',
    type: 'Refund',
    status: 'Declined',
    date: '2023-06-24',
    amount: 150.0,
  },
  {
    customer: 'Noah Williams',
    email: 'noah@example.com',
    type: 'Subscription',
    status: 'Approved',
    date: '2023-06-25',
    amount: 350.0,
  },
  {
    customer: 'Emma Brown',
    email: 'emma@example.com',
    type: 'Sale',
    status: 'Approved',
    date: '2023-06-26',
    amount: 450.0,
  },
  {
    customer: 'Liam Johnson',
    email: 'liam@example.com',
    type: 'Sale',
    status: 'Approved',
    date: '2023-06-27',
    amount: 550.0,
  },
]

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

  useEffect(() => {
    const fetchFormsData = async () => {
      if (!userForms) {
        try {
          const response = await fetch(`${siteConfig.url}/api/forms/userId`)
          const data = await response.json()
          setUserForms(data)
        } catch (error) {
          console.error('Error fetching forms:', error)
        }
      }
    }

    fetchFormsData()
  }, [userForms, setUserForms])

  if (!userForms) {
    return <Loading />
  }

  return (
    // <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card x-chunk="dashboard-01-chunk-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Forms Created
            </CardTitle>
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
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                Recent transactions from your store.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="#">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden xl:table-column">Type</TableHead>
                  <TableHead className="hidden xl:table-column">
                    Status
                  </TableHead>
                  <TableHead className="hidden xl:table-column">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium">{transaction.customer}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {transaction.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-column">
                      {transaction.type}
                    </TableCell>
                    <TableCell className="hidden xl:table-column">
                      <Badge className="text-xs" variant="outline">
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell lg:hidden xl:table-column">
                      {transaction.date}
                    </TableCell>
                    <TableCell className="text-right">
                      ${transaction.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
