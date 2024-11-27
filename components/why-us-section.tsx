import {
  PersonStandingIcon,
  TimerIcon,
  ZapIcon,
  ZoomInIcon,
} from 'lucide-react'

const WhyUsSection = () => {
  return (
    <section className="py-12">
      <div className="container">
        <p className="mb-4 text-xs text-muted-foreground">Why Thunder Forms?</p>
        <h2 className="text-3xl font-medium lg:text-4xl">
          A better way to build forms
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          <div className="relative flex gap-3 rounded-lg border-dashed md:block md:border-l md:p-5">
            <span className="mb-8 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent md:size-12">
              <TimerIcon className="size-5 md:size-6" />
            </span>
            <div>
              <h3 className="font-medium md:mb-2 md:text-xl">
                Reliability at Scale
                <span className="absolute -left-px hidden h-6 w-px bg-primary md:inline-block"></span>
              </h3>
              {/* <p className="text-sm text-muted-foreground md:text-base">
                  Create forms in minutes with our lightning-fast builder,
                  optimized for quick setup and ease of use.
                </p> */}
              <p className="text-sm text-muted-foreground md:text-base">
                Build forms quickly and efficiently with Thunder Forms, designed
                for speed, scalability, and ease of use.
              </p>
            </div>
          </div>
          <div className="relative flex gap-3 rounded-lg border-dashed md:block md:border-l md:p-5">
            <span className="mb-8 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent md:size-12">
              <ZapIcon className="size-5 md:size-6" />
            </span>
            <div>
              <h3 className="font-medium md:mb-2 md:text-xl">
                Cutting-Edge Features
                <span className="absolute -left-px hidden h-6 w-px bg-primary md:inline-block"></span>
              </h3>
              {/* <p className="text-sm text-muted-foreground md:text-base">
                  advanced features and constant updates that make Thunder Forms
                  stand out from other&lsquo;s.
                </p> */}
              <p className="text-sm text-muted-foreground md:text-base">
                Leverage advanced features and continuous updates that make
                Thunder Forms stand out.
              </p>
            </div>
          </div>
          <div className="relative flex gap-3 rounded-lg border-dashed md:block md:border-l md:p-5">
            <span className="mb-8 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent md:size-12">
              <ZoomInIcon className="size-5 md:size-6" />
            </span>
            <div>
              <h3 className="font-medium md:mb-2 md:text-xl">
                Quality Experience
                <span className="absolute -left-px hidden h-6 w-px bg-primary md:inline-block"></span>
              </h3>
              {/* <p className="text-sm text-muted-foreground md:text-base">
                  Build forms that look great and work seamlessly across
                  devices, all while maintaining top-tier performance.
                </p> */}
              <p className="text-sm text-muted-foreground md:text-base">
                Create stunning forms with seamless user experiences, optimized
                for performance on all devices.
              </p>
            </div>
          </div>
          <div className="relative flex gap-3 rounded-lg border-dashed md:block md:border-l md:p-5">
            <span className="mb-8 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent md:size-12">
              <PersonStandingIcon className="size-5 md:size-6" />
            </span>
            <div>
              <h3 className="font-medium md:mb-2 md:text-xl">
                Success Rate
                <span className="absolute -left-px hidden h-6 w-px bg-primary md:inline-block"></span>
              </h3>
              {/* <p className="text-sm text-muted-foreground md:text-base">
                  Join thousands of users who have successfully created and used
                  forms for a wide range of purposes.
                </p> */}
              <p className="text-sm text-muted-foreground md:text-base">
                Join thousands of satisfied users who have successfully built
                and deployed forms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhyUsSection
