import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { cn } from '@/lib/utils'
import { logout } from '@/app/(auth)/auth/logout/actions'

export async function UserNav({
  isDashboard = true,
}: {
  isDashboard?: boolean
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'relative rounded-full',
            isDashboard ? 'size-9' : 'size-7'
          )}
        >
          <Avatar className={cn(isDashboard ? 'size-9' : 'size-7')}>
            <AvatarImage src="https://github.com/raghav-45.png" alt="@aditya" />
            <AvatarFallback>
              <UserCircle className="size-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Thunder Forms</p>
            <p className="text-xs leading-none text-muted-foreground">
              {data.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          {/* <DropdownMenuItem>Billing</DropdownMenuItem> */}
          <DropdownMenuItem>Account Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <button type="submit" className={cn('w-full cursor-pointer')}>
              Log Out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
