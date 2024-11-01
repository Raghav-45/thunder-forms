import * as React from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Announcement } from '@/components/Announcement'

export default function Page() {
  return (
    <div className="container relative">
      <div className="mx-auto grid grid-cols-12 gap-8 space-y-0 pt-28">
        <section className="space-y-4 col-span-6">
          <div className="space-y-2">
            <Announcement />
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Thunder Forms: Unleash the Power of Forms
            </h1>
          </div>
          <p className="text-base text-gray-200 max-w-2xl mt-4">
            Thunder Forms is a next-gen form builder that combines speed,
            flexibility, and powerful customization for all your data collection
            needs. From surveys to custom workflows, create, share, and analyze
            with ease.
          </p>
          <div className="flex w-full space-x-4 pt-2">
            <Link href="/docs" className={cn(buttonVariants())}>
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
        <section className="col-span-6">
          <div className="relative h-96 w-full overflow-hidden rounded-xl border border-black/20 bg-neutral-300 font-medium dark:border-white/5 dark:bg-neutral-800">
            <div className="flex space-x-1.5 h-8 w-full flex-row border-b border-black/20 px-3 py-1 pt-2 dark:border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="px-4 pt-3 text-sm text-black dark:text-white">
              <pre>
                <code>{`import React from 'react';

const CoolComponent = () => {
  return (
    <div className="p-4 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2">
        Welcome to our awesome site!
      </h2>
      <p className="mb-4">
        Built with cutting-edge components.
      </p>
      <button className="bg-white text-purple-600 px-4 py-2 rounded hover:bg-purple-100 transition-colors">
        Get Started
      </button>
    </div>
  );
};

export default CoolComponent;`}</code>
              </pre>
            </div>
          </div>
        </section>
      </div>

      <section className="pt-40">
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
      </section>
    </div>
  )
}
