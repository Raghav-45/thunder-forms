import Providers from '@/components/Providers'
import { cn } from '@/lib/utils'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Anton, Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import UmamiAnalytics from '@/components/UmamiAnalytics'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const anton = Anton({
  variable: '--font-anton',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Thunder Forms',
  description:
    'Thunder Forms lets you create, customize, and manage powerful forms with ease. Start building your forms today',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <UmamiAnalytics />
      <Analytics />
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased dark',
          geistSans.variable,
          geistMono.variable,
          anton.variable
        )}
      >
        <div className="relative flex min-h-screen flex-col bg-background">
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </div>
      </body>
    </html>
  )
}
