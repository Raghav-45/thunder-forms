import Link from 'next/link'
import { ArrowRight, LayoutTemplate } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Dither from './background-dither'

export function Hero() {
  return (
    <div className="relative flex items-center justify-center">
      <div aria-hidden="true" className="absolute top-0 left-0 h-full w-full">
        <div
          style={{
            width: '100%',
            height: '60%',
            position: 'relative',
            opacity: 0.35,
          }}
        >
          <Dither
            waveColor={[0.5, 0.5, 0.5]}
            disableAnimation={false}
            enableMouseInteraction={true}
            mouseRadius={0}
            colorNum={4}
            waveAmplitude={0.3}
            waveFrequency={3}
            waveSpeed={0.05}
          />
          <div className="absolute bottom-0 h-1/3 w-full bg-linear-to-b from-transparent to-background" />
        </div>
      </div>
      <section aria-labelledby="hero-heading" className="w-full">
        <div className="relative container py-28 pt-40 md:py-32 md:pt-46">
          <header className="mx-auto flex max-w-3xl flex-col text-center">
            <h1
              id="hero-heading"
              className="font-anton text-5xl font-normal tracking-tight text-balance text-foreground md:text-7xl"
              style={{
                textShadow:
                  '0 0 40px rgba(0, 0, 0, 0.8), 0 0 80px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.5)',
              }}
            >
              Thunder Forms <br /> Unleash the Power of Forms
            </h1>
            <p className="z-20 my-7 max-w-3xl text-shadow-[0px_0px_9px_rgb(0_0_0_/_1)] tracking-tight text-muted-foreground md:text-xl">
              Describe the form you need. Thunder Forms drafts the fields with
              AI, you refine them in the builder, and share a link that
              collects responses straight into your workflow.
            </p>
            <div className="z-20 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className={cn(buttonVariants({ size: 'lg' }), 'px-6')}
              >
                Start building free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/templates"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'px-6'
                )}
              >
                <LayoutTemplate className="size-4" />
                Browse templates
              </Link>
            </div>
          </header>
          <Badge
            variant="outline"
            className="mx-auto mt-8 flex w-fit cursor-pointer items-center justify-center rounded-full border bg-black/60 py-1 pr-3 pl-2 font-normal shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all ease-in-out hover:gap-3"
          >
            <Avatar className="relative -mr-5 overflow-hidden rounded-full border md:size-10">
              <AvatarImage
                src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-2.webp"
                alt=""
              />
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <Avatar className="relative -mr-5 overflow-hidden rounded-full border md:size-10">
              <AvatarImage
                src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-5.webp"
                alt=""
              />
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <Avatar className="relative -mr-5 overflow-hidden rounded-full border md:size-10">
              <AvatarImage
                src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-6.webp"
                alt=""
              />
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <p className="ml-6 tracking-tight capitalize md:text-lg">
              {' '}
              Trusted by <span className="font-bold text-foreground">
                10k+
              </span>{' '}
              users.
            </p>
          </Badge>
        </div>
      </section>
    </div>
  )
}
