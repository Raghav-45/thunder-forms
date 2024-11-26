'use client'

import { Copy, File, ListFilter, MoreVertical, Truck } from 'lucide-react'

import { format, formatDistance } from 'date-fns'

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
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'

const currentDate = new Date()

const fakeOrder = {
  orderId: 'Oe31b70H',
  productName: 'Green T-Shirt',
  price: 329,
  orderDate: currentDate,
  status: 'Filled',
  shippingAddress: {
    fullName: 'John Doe',
    addressLine1: '1234 Main St',
    addressLine2: 'Apt 101',
    nearby: 'Near Central Park',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    Contact: '123-456-7890',
  },
  productImage:
    'https://cdn.shopify.com/s/files/1/0754/3727/7491/files/t-shirt-1.png',
}

export default function Responses() {
  const [selectedOrder, setSelectedOrder] =
    useState<typeof fakeOrder>(fakeOrder)

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
              <CardTitle className="text-4xl">1,329</CardTitle>
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
              <CardTitle className="text-4xl">5,329</CardTitle>
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
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  Recent orders from your store.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      {/* <TableHead className="hidden sm:table-cell">
                        Type
                      </TableHead> */}
                      <TableHead className="hidden sm:table-cell">
                        Status
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Date
                      </TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      fakeOrder,
                      fakeOrder,
                      fakeOrder,
                      fakeOrder,
                      fakeOrder,
                      fakeOrder,
                      fakeOrder,
                    ].map((order, index) => (
                      <TableRow
                        key={index}
                        onClick={() => setSelectedOrder(order)}
                        className={
                          selectedOrder?.orderId == order.orderId
                            ? 'bg-muted/50'
                            : ''
                        }
                      >
                        <TableCell>
                          <div className="font-medium">
                            {order.shippingAddress.fullName}
                          </div>
                          <div className="hidden text-sm text-muted-foreground md:inline">
                            {order.shippingAddress.Contact}
                          </div>
                        </TableCell>
                        {/* <TableCell className="hidden sm:table-cell">
                          Sale
                        </TableCell> */}
                        <TableCell className="hidden sm:table-cell">
                          <Badge className="text-xs" variant="outline">
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDistance(order.orderDate, currentDate, {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{order.price}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                Order {selectedOrder?.orderId ?? 'Oe31b70H'}
                <Button
                  size="icon"
                  variant="outline"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Copy className="h-3 w-3" />
                  <span className="sr-only">Copy Order ID</span>
                </Button>
              </CardTitle>
              <CardDescription>
                Date:{' '}
                {selectedOrder
                  ? format(selectedOrder?.orderDate, 'PPP')
                  : 'November 23, 2023'}
              </CardDescription>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <Truck className="h-3.5 w-3.5" />
                <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
                  Track Order
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
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Export</DropdownMenuItem>

                  {/* {selectedOrder?.status != 'completed' &&
                    selectedOrder?.status != 'cancelled' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleActionButtonClick(
                              selectedOrder?.paymentId,
                              'cancelled'
                            )
                          }
                        >
                          Cancel Order
                        </DropdownMenuItem>
                      </>
                    )} */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-sm">
            <div className="grid gap-3">
              {/* <div className="font-semibold">Order Details</div> */}

              <div className="flex gap-x-4 pb-4">
                <div className="border w-1/4 aspect-square rounded-2xl">
                  <img
                    src="https://cdn.shopify.com/s/files/1/0754/3727/7491/files/t-shirt-1.png"
                    alt="Product Image"
                  />
                </div>
                <div className="flex flex-col w-3/4 text-left py-2.5 gap-y-1.5">
                  <div className="w-full pr-2">
                    <h3 className="text-lg font-extrabold line-clamp-2 leading-none tracking-tight text-ellipsis overflow-hidden">
                      {selectedOrder?.productName} x <span>1</span>
                    </h3>
                  </div>
                  <ul className="grid gap-0">
                    <li className="flex items-center justify-between text-muted-foreground">
                      Colour: green
                    </li>
                    <li className="flex items-center justify-between text-muted-foreground">
                      Size: 12
                    </li>
                    <li className="flex items-center justify-between text-muted-foreground">
                      Qty: 1
                    </li>
                  </ul>
                </div>
              </div>

              <div className="font-semibold">Order Details</div>

              <ul className="grid gap-3">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {selectedOrder?.productName} x <span>1</span>
                  </span>
                  <span>₹{selectedOrder?.price}</span>
                </li>
              </ul>
              <Separator className="my-2" />
              <ul className="grid gap-3">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{selectedOrder?.price}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>Free</span>
                </li>
                <li className="flex items-center justify-between font-semibold">
                  <span className="text-muted-foreground">Total</span>
                  <span>₹{selectedOrder?.price}</span>
                </li>
              </ul>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <div className="font-semibold">Shipping Information</div>
                <address className="grid gap-0.5 not-italic text-muted-foreground">
                  <span>{selectedOrder?.shippingAddress.fullName}</span>
                  <span>
                    {selectedOrder?.shippingAddress.addressLine1}
                    {selectedOrder?.shippingAddress.addressLine2
                      ? ` | ${selectedOrder.shippingAddress.addressLine2}`
                      : ''}
                    {selectedOrder?.shippingAddress.nearby
                      ? ` | ${selectedOrder.shippingAddress.nearby}`
                      : ''}
                  </span>
                  <span>
                    {selectedOrder?.shippingAddress.city},{' '}
                    {selectedOrder?.shippingAddress.state}{' '}
                    {selectedOrder?.shippingAddress.postalCode}
                  </span>
                </address>
              </div>
              <div className="grid auto-rows-max gap-3">
                <div className="font-semibold">Billing Information</div>
                <div className="text-muted-foreground">
                  Same as shipping address
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-3">
              <div className="font-semibold">Customer Information</div>
              <dl className="grid gap-3">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd>{selectedOrder?.shippingAddress.fullName}</dd>
                </div>
                {/* <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>
                    <a href="mailto:">liam@acme.com</a>
                  </dd>
                </div> */}
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>
                    <a href={`tel: ${selectedOrder?.shippingAddress.Contact}`}>
                      {selectedOrder?.shippingAddress.Contact}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
            {/* <Separator className="my-4" />
            <div className="grid gap-3">
              <div className="font-semibold">Payment Information</div>
              <dl className="grid gap-3">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Visa
                  </dt>
                  <dd>**** **** **** 4532</dd>
                </div>
              </dl>
            </div> */}
          </CardContent>
          <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
            <div className="text-xs text-muted-foreground">
              Updated on{' '}
              {selectedOrder && format(selectedOrder?.orderDate, 'PPP')}
            </div>
            {/* <Pagination className="ml-auto mr-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <Button size="icon" variant="outline" className="h-6 w-6">
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="sr-only">Previous Order</span>
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button size="icon" variant="outline" className="h-6 w-6">
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="sr-only">Next Order</span>
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination> */}

            {/* {selectedOrder?.paymentId && (
              <div className="ml-auto mr-0 w-auto flex gap-x-2">
                {selectedOrder?.status != 'completed' &&
                  selectedOrder?.status != 'cancelled' && (
                    <Button
                      onClick={() =>
                        handleActionButtonClick(
                          selectedOrder?.paymentId,
                          'cancelled'
                        )
                      }
                      className="w-full bg-red-500"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  )}

                {selectedOrder?.status == 'New' && (
                  <Button
                    onClick={() =>
                      handleActionButtonClick(
                        selectedOrder?.paymentId,
                        'shipping'
                      )
                    }
                    className="w-full bg-blue-500"
                    variant="outline"
                  >
                    Ship
                  </Button>
                )}

                {selectedOrder?.status == 'shipping' && (
                  <Button
                    onClick={() =>
                      handleActionButtonClick(
                        selectedOrder?.paymentId,
                        'completed'
                      )
                    }
                    className="w-full bg-blue-500"
                    variant="outline"
                  >
                    Delivered / Completed
                  </Button>
                )}
              </div>
            )} */}
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
