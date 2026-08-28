"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function login(data: { email: string; password: string }) {
  const { email, password } = data

  try {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: await headers(),
    })

    if (!result) {
      return {
        success: false,
        error: { message: "Invalid login credentials", type: "Error" },
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error?.message || "Invalid login credentials",
        type: "Error",
      },
    }
  }

  redirect("/dashboard")
}

export async function signup(data: {
  displayName: string
  email: string
  password: string
}) {
  const { displayName, email, password } = data

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: displayName,
        email,
        password,
        displayName,
      },
      headers: await headers(),
    })

    if (!result) {
      return {
        success: false,
        error: { message: "Signup failed. Please try again.", type: "Error" },
      }
    }
  } catch (error: any) {
    const message = error?.message || "Signup failed. Please try again."
    if (message.includes("already")) {
      return {
        success: false,
        error: { message: "User already registered", type: "Error" },
      }
    }
    return {
      success: false,
      error: { message, type: "Error" },
    }
  }

  redirect("/dashboard")
}
