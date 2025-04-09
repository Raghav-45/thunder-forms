'use client'

import { GithubIcon } from 'lucide-react'
import { Button } from './ui/button'
import { signInWithGithub } from '@/app/(auth)/auth/actions'

export const ContinueWithGithubButton = ({}) => {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => signInWithGithub()}
      type="button"
    >
      <GithubIcon className="h-4 w-4" />
      GitHub
    </Button>
  )
}
