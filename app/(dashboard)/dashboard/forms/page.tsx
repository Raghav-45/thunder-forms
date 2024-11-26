import Image from 'next/image'
import { MoreHorizontal, PlusCircle } from 'lucide-react'

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

interface Product {
  name: string
  status: 'Draft' | 'Active'
  price: string
  stock: number
  date: string
  imageSrc: string
}

const allForms: Product[] = [
  {
    name: 'Laser Lemonade Machine',
    status: 'Draft',
    price: '499',
    stock: 25,
    date: '07-12-2023',
    imageSrc: 'https://avatars.githubusercontent.com/u/77260113?v=4',
  },
  {
    name: 'Hypernova Headphones',
    status: 'Active',
    price: '129',
    stock: 100,
    date: '10-18-2023',
    imageSrc: 'https://avatars.githubusercontent.com/u/77260113?v=4',
  },
  {
    name: 'AeroGlow Desk Lamp',
    status: 'Active',
    price: '39',
    stock: 50,
    date: '11-29-2023',
    imageSrc: 'https://avatars.githubusercontent.com/u/77260113?v=4',
  },
  {
    name: 'TechTonic Energy Drink',
    status: 'Draft',
    price: '2',
    stock: 0,
    date: '12-25-2023',
    imageSrc: 'https://avatars.githubusercontent.com/u/77260113?v=4',
  },
  {
    name: 'Gamer Gear Pro Controller',
    status: 'Active',
    price: '59',
    stock: 75,
    date: '01-01-2024',
    imageSrc: 'https://avatars.githubusercontent.com/u/77260113?v=4',
  },
  {
    name: 'Luminous VR Headset',
    status: 'Active',
    price: '199',
    stock: 30,
    date: '02-14-2024',
    imageSrc: 'https://avatars.githubusercontent.com/u/77260113?v=4',
  },
]

export default async function Forms() {
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
              <CardTitle>Your forms</CardTitle>
              <CardDescription>Seamlessly manage your forms.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">
                      <span className="sr-only">Image</span>
                    </TableHead>
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
                  {allForms.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          alt={`${product.name} image`}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={product.imageSrc!}
                          width="64"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Active</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {0}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.date}
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
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-10</strong> of <strong>32</strong> forms
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
