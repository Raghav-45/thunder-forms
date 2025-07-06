'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function login(data: { email: string; password: string }) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // Return the error instead of throwing
    return {
      success: false,
      error: {
        message: error.message,
        type: error.constructor.name,
      },
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(data: {
  displayName: string
  email: string
  password: string
}) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.displayName,
      },
    },
  })

  if (error) {
    // Return the error instead of throwing
    return {
      success: false,
      error: {
        message: error.message,
        type: error.constructor.name,
      },
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithGithub() {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { error, data } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect('/error')
  }

  if (data.url) {
    redirect(data.url) // use the redirect API for your server framework
  }
}
