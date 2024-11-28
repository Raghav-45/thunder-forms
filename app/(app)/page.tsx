import * as React from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Announcement } from '@/components/Announcement'
import { DemoReportAnIssue } from '@/components/report-an-issue'
import Testimonials from '@/components/testimonials'
import WhyUsSection from '@/components/why-us-section'

export default function Page() {
  return (
    <div className="container relative">
      <div className="mx-auto grid grid-cols-12 gap-8 space-y-0 py-28 px-8">
        <section className="space-y-4 col-span-6 mt-8">
          <div className="space-y-2">
            <Announcement />
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-pink-600 bg-clip-text text-transparent">
              Thunder Forms
            </h1>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Unleash the Power of Forms
            </h2>
          </div>
          <p className="text-base text-gray-200 max-w-2xl mt-4">
            Thunder Forms is a next-gen form builder that combines speed,
            flexibility, and powerful customization for all your data collection
            needs. From surveys to custom workflows, create, share, and analyze
            with ease.
          </p>
          <div className="flex w-full space-x-4 pt-2">
            <Link
              href="/dashboard/forms/new-form"
              className={cn(buttonVariants())}
            >
              Get started
            </Link>
            <Link
              href="/pricing"
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              How it works
            </Link>
          </div>
        </section>
        <section className="col-span-5 col-start-8">
          <DemoReportAnIssue />
        </section>
      </div>

      <WhyUsSection />
      <Testimonials />

      {/* <section className="pt-40">
        <div className="flex flex-col gap-y-2">
          <div className="flex flex-row items-center">
            <h1 className="text-4xl">As simple as</h1>
            <span className="translate-y-1 mx-3 h-full cursor-default content-center rounded-lg border border-gray-200 bg-gray-100 px-1.5 py-1 text-sm font-semibold text-gray-800 transition-transform hover:translate-y-1.5 dark:border-white/50 dark:bg-black dark:text-gray-200">
              DRAG
            </span>
            <h1 className="text-4xl">and</h1>
            <span className="translate-y-1 mx-3 h-full cursor-default content-center rounded-lg border border-gray-200 bg-gray-100 px-1.5 py-1 text-sm font-semibold text-gray-800 transition-transform hover:translate-y-1.5 dark:border-white/50 dark:bg-black dark:text-gray-200">
              DROP
            </span>
          </div>
        </div>
      </section> */}
    </div>
  )
}
