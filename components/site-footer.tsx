import { siteConfig } from '@/config/site'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Icons } from './Icons'

export function SiteFooter() {
  return (
    // <footer className="py-6 md:px-8 md:py-0">
    //   <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
    //     <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
    //       Built by Aditya. Building in public at{' '}
    //       <a
    //         href={siteConfig.links.github}
    //         target="_blank"
    //         rel="noreferrer"
    //         className="font-medium underline underline-offset-4"
    //       >
    //         GitHub
    //       </a>
    //       .
    //     </p>
    //   </div>
    // </footer>

    <footer className="flex flex-col px-6 py-10 gap-y-8 items-center container">
      <div className=" grid grid-cols-12 items-center">
        <div className="flex flex-col gap-5 col-span-7">
          <div className="flex items-center space-x-1">
            <Icons.ThunderFormsLogo className="h-7 w-7" />
            <span className="font-semibold text-lg">Thunder Forms</span>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Create dynamic, powerful, and user-friendly forms effortlessly with
            Thunder Forms. Designed to simplify your workflow and empower you
            with advanced features.
          </p>
          <p className="text-sm text-muted-foreground">
            &quot;Thunder Forms makes form-building efficient and
            seamless!&quot;
          </p>
        </div>
        <div className="flex flex-col col-span-5">
          <div className="mt-6 place-items-end space-y-2">
            <div className="flex items-center space-x-3 border rounded-full w-4/5 p-1">
              <Input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-full !border-none focus:!border-none focus:!ring-0"
                required
              />
              <Button variant="secondary" className="px-6 py-2 rounded-full">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Subscribe to our newsletter — just the good stuff, no spam.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between w-full">
        <div className="flex flex-row items-center h-10 space-x-0.5">
          <p className="text-sm text-muted-foreground">Made by</p>
          <div className="w-7 h-7 rounded-full overflow-hidden">
            <Image
              src="https://framerusercontent.com/images/rt5mxZqWgQQGIgCq47tZN4972CU.png"
              // src="https://www.shadcnblocks.com/images/block/avatar-2.webp"
              alt="Creator"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <Link
            href={siteConfig.links.twitter}
            target="_blank"
            rel="noopener"
            className="text-sm text-muted-foreground"
          >
            @aditya
          </Link>
        </div>
        <p className="text-xs text-muted-foreground inline-flex align-bottom">
          © 2024
          <Icons.ThunderFormsLogo className="h-4 w-4 mx-1" />
          Thunder Forms
        </p>
      </div>
    </footer>
  )
}
