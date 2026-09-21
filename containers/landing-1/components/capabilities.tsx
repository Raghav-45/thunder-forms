import Link from 'next/link'
import { ArrowRight, LayoutTemplate } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LEDGER = [
  {
    capability: 'AI generation',
    evidence:
      'Prompt-to-form drafts plus guided template tailoring that asks about your use case.',
  },
  {
    capability: 'Templates that work',
    evidence:
      'Contact Us, Event RSVP, Job Application, Customer Feedback, Product Survey, Support Ticket — each with real fields.',
  },
  {
    capability: 'A builder with control',
    evidence:
      'Pages, sections, and fourteen field types — choice, rating, date, file upload — arranged by drag and drop.',
  },
  {
    capability: 'Collection without friction',
    evidence:
      'Public links respondents can open on any phone, with validation and file uploads built in.',
  },
  {
    capability: 'Answers go somewhere',
    evidence:
      'A live responses table, one-click CSV export, and row-by-row Google Sheets sync.',
  },
  {
    capability: 'No lock-in on the way in',
    evidence:
      'Import an existing Google Form or duplicate any form with one action and keep editing.',
  },
]

export function Capabilities() {
  return (
    <section aria-labelledby="capabilities-heading" className="container py-20 md:py-28">
      <h2
        id="capabilities-heading"
        className="font-anton max-w-2xl text-4xl font-normal tracking-tight text-balance md:text-6xl"
      >
        Everything after the first sentence, covered
      </h2>
      <dl className="mt-10 flex flex-col">
        {LEDGER.map((row) => (
          <div
            key={row.capability}
            className="grid gap-1 border-t py-5 last:border-b sm:grid-cols-[220px_1fr] sm:gap-6"
          >
            <dt className="text-sm font-semibold tracking-tight">
              {row.capability}
            </dt>
            <dd className="max-w-2xl leading-relaxed text-muted-foreground">
              {row.evidence}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="container pb-24 md:pb-32"
    >
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-muted/40 px-6 py-14 text-center md:py-20">
        <h2
          id="final-cta-heading"
          className="font-anton max-w-2xl text-4xl font-normal tracking-tight text-balance md:text-6xl"
        >
          Your next form is one sentence away
        </h2>
        <p className="max-w-xl leading-relaxed text-muted-foreground">
          Describe it, refine it, share the link. Your first response can land
          today.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
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
      </div>
    </section>
  )
}
