import Dither from '@/components/background_Dither'
import { BrowserMockup } from '@/components/SafariMockup'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { siteConfig } from '@/config/site'

export default function Home() {
  return (
    <div className="flex items-center justify-center relative">
      <div className="absolute top-0 left-0 w-full h-full">
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
        </div>
      </div>
      <section>
        <div className="relative container py-32">
          <header className="mx-auto max-w-3xl text-center">
            <h1 className="font-anton text-5xl font-normal tracking-tight text-foreground md:text-7xl">
              Thunder Forms <br /> Unleash the Power of Forms
            </h1>
            <p className="my-7 max-w-3xl tracking-tight text-muted-foreground md:text-xl">
              Thunder Forms is a next-gen form builder that combines speed,
              flexibility, and powerful customization for all your data
              collection needs.
            </p>
          </header>

          <Badge
            variant="outline"
            className="mx-auto mt-10 flex w-fit cursor-pointer items-center justify-center rounded-full border py-1 pr-3 pl-2 font-normal transition-all ease-in-out hover:gap-3"
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

          <div className="relative mt-12 flex h-full w-full flex-col items-center justify-center">
            <BrowserMockup
              className="w-full"
              url={siteConfig.url.replace('https://', '')}
              DahboardUrlDesktop="https://ui.shadcn.com/r/styles/new-york-v4/dashboard-01-dark.png"
              DahboardUrlMobile="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/dashboard/dashboard-mobile-1.png"
            />
            <div className="absolute bottom-0 h-2/3 w-full bg-linear-to-b from-transparent to-background" />
          </div>
        </div>
      </section>
    </div>
  )
}
