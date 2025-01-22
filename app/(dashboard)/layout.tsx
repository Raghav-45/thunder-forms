'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  FileText,
  Home,
  LineChart,
  PanelLeft,
  Search,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DashboardBreadcrumb } from '@/components/dashboardNav'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/forms', label: 'My Forms', icon: FileText }, // To view and manage created forms
  // { href: '/dashboard/responses', label: 'Responses', icon: CheckCircle }, // To view form submissions
  // { href: '/dashboard/templates', label: 'Templates', icon: FilePlus }, // For pre-made form templates
  // { href: '#', label: 'Analytics', icon: LineChart },
]

export default function DashboardLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <TooltipProvider>
          <nav className="flex flex-col items-center gap-4 px-2 py-4">
            <Image
              src="/favicon.ico"
              alt="Thunder Forms"
              width={2}
              height={2}
              className="flex h-10 w-10 border-[2px] hover:border transition-all hover:scale-110 cursor-pointer rounded-full md:h-8 md:w-8"
            />
            {/* <DashboardNav /> */}

            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href

              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={link.href}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="sr-only">{link.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{link.label}</TooltipContent>
                </Tooltip>
              )
            })}
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </nav>
        </TooltipProvider>
      </aside>
      {/* {children} */}
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Image
                  src="/favicon.ico"
                  alt="Thunder Forms"
                  width={2}
                  height={2}
                  className="flex h-10 w-10 border shrink-0 transition-all hover:scale-110 rounded-full md:h-8 md:w-8"
                />

                {navLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      // className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      className={`flex items-center gap-4 px-2.5 ${
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  )
                })}
                <Link
                  href="#"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <LineChart className="h-5 w-5" />
                  Settings
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <DashboardBreadcrumb />
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Image
                  src="https://github.com/raghav-45.png"
                  width={36}
                  height={36}
                  alt="Avatar"
                  className="overflow-hidden rounded-full"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        {children}
      </div>
    </div>
  )
}
