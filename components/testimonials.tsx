import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const TestimonialsSection = () => {
  return (
    <section className="py-32">
      <div className="container">
        <div className="flex flex-col items-center text-center">
          <p className="mb-12 max-w-5xl px-8 font-medium lg:text-3xl">
            &ldquo;Thunder Forms has been a game-changer for me. It&apos;s
            incredibly easy to use, and the speed with which I can build forms
            is unmatched. The features are always updated, I couldn&apos;t have
            asked for a better tool for creating forms efficiently.&rdquo;
          </p>
          <div className="flex items-center gap-2 md:gap-4">
            <Avatar className="size-12 md:size-16">
              <AvatarImage
                alt="Avatar image"
                src="https://www.shadcnblocks.com/images/block/avatar-2.webp"
              />
              <AvatarFallback>Aditya</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium md:text-base">Aditya</p>
              <p className="text-sm text-muted-foreground md:text-base">
                Founder, Thunder Forms
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
