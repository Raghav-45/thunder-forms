import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { BrowserMockup } from './browser-mockup'

const STEPS = [
  {
    n: '01',
    id: 'step-describe',
    title: 'Describe it in a sentence',
    copy: 'Type what you are collecting — attendees, applicants, feedback. Thunder Forms drafts the fields, so you start from a working form instead of a blank canvas.',
    link: { href: '/auth/signup', label: 'Try the AI draft' },
    url: 'thunderforms.in/describe',
    image: '/images/landing/step-describe.jpg',
  },
  {
    n: '02',
    id: 'step-refine',
    title: 'Make it yours in the builder',
    copy: 'Drag fields between pages and sections, tune options and validation, preview as you go. The AI drafted it — you decide what ships.',
    link: { href: '/templates', label: 'See what you can start from' },
    url: 'thunderforms.in/builder',
    image: '/images/landing/step-refine.jpg',
  },
  {
    n: '03',
    id: 'step-share',
    title: 'Share a link, watch responses land',
    copy: 'Publish a public link, collect answers in a live table, then export a CSV or sync every row to Google Sheets as it arrives.',
    link: { href: '/auth/signup', label: 'Publish your first form' },
    url: 'thunderforms.in/forms/event-rsvp',
    image: '/images/landing/step-share.jpg',
  },
]

export function Timeline() {
  return (
    <div className="container flex flex-col gap-20 pb-8 md:gap-28">
      {STEPS.map((step) => (
        <section
          key={step.id}
          aria-labelledby={step.id}
          className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12"
        >
          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <span
              aria-hidden="true"
              className="font-anton text-6xl text-foreground/10 md:text-7xl"
            >
              {step.n}
            </span>
            <h2
              id={step.id}
              className="-mt-6 text-3xl font-semibold tracking-tight text-balance md:-mt-8 md:text-4xl"
            >
              {step.title}
            </h2>
            <p className="max-w-md leading-relaxed text-muted-foreground">
              {step.copy}
            </p>
            <Link
              href={step.link.href}
              className="inline-flex w-fit items-center gap-1 text-sm font-medium text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"
            >
              {step.link.label}
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div aria-hidden="true">
            <BrowserMockup
              url={step.url}
              dashboardImageUrlDesktop={step.image}
              dashboardImageUrlMobile={step.image}
            />
          </div>
        </section>
      ))}
    </div>
  )
}
