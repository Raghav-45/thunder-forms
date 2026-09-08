'use client'

import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { GithubIcon } from 'lucide-react'

export const ContinueWithOAuthButtonsGroup = () => {
  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          authClient.signIn.social({
            provider: 'github',
            callbackURL: '/',
          })
        }
      >
        <GithubIcon className="mr-2 h-4 w-4" />
        Login with Github
      </Button>
    </div>
  )
}
