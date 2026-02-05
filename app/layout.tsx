import Providers from '@/components/Providers'
import UmamiAnalytics from '@/components/UmamiAnalytics'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Anton, Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { ScrollArea } from '@/components/ui/scroll-area'

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
  title: siteConfig.name,
  description:
    'Thunder Forms lets you create, customize, and manage powerful forms with ease. Start building your forms today',
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        // width: 1200,
        // height: 630,
        width: 1352,
        height: 639,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: `@${siteConfig.links.twitter_personal.split('/').pop()}`,
  },
  authors: [
    {
      name: 'Aditya',
      url: siteConfig.links.github,
    },
  ],
  creator: 'Aditya',
  keywords: siteConfig.keywords,
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
            <ScrollArea className="h-[100vh] w-full">{children}</ScrollArea>
            <Toaster />
          </Providers>
        </div>
      </body>
    </html>
  )
}
