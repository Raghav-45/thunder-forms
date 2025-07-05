import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  RotateCw,
  Share,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import Image from 'next/image'

export const BrowserMockup = ({
  className = '',
  url = 'localhost:3000',
  DahboardUrlDesktop = 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/dashboard/dashboard-1.png',
  DahboardUrlMobile = 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/dashboard/dashboard-mobile-1.png',
}) => (
  <div
    className={cn(
      'relative w-full overflow-hidden rounded-4xl border',
      className
    )}
  >
    <div className="flex items-center justify-between gap-10 bg-muted px-8 py-4 lg:gap-25">
      <div className="flex items-center gap-2">
        <div className="size-3 rounded-full bg-red-500" />
        <div className="size-3 rounded-full bg-yellow-500" />
        <div className="size-3 rounded-full bg-green-500" />
        <div className="ml-6 hidden items-center gap-2 opacity-40 lg:flex">
          <ChevronLeft className="size-5" />
          <ChevronRight className="size-5" />
        </div>
      </div>
      <div className="flex w-full items-center justify-center">
        <p className="relative hidden w-full rounded-full bg-black/30 px-4 py-1 text-center text-sm tracking-tight md:block">
          {url}
          <RotateCw className="absolute top-2 right-3 size-3.5" />
        </p>
      </div>

      <div className="flex items-center gap-4 opacity-40">
        <Share className="size-4" />
        <Plus className="size-4" />
        <Copy className="size-4" />
      </div>
    </div>

    <div className="relative w-full">
      <Image
        src={DahboardUrlDesktop}
        alt=""
        width={1880}
        height={1175}
        priority
        className="object-cover hidden aspect-video h-full w-full object-top md:block"
      />
      <Image
        src={DahboardUrlMobile}
        alt=""
        width={1880}
        height={1175}
        priority
        className="block h-full w-full object-cover md:hidden"
      />
    </div>
    <div className="absolute bottom-0 z-10 flex w-full items-center justify-center bg-muted py-3 md:hidden">
      <p className="relative flex items-center gap-2 rounded-full px-8 py-1 text-center text-sm tracking-tight">
        {url}
      </p>
    </div>
  </div>
)
