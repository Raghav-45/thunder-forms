import Link from 'next/link'
import { ArrowRight, Leaf, Scissors, Sun } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BEDS = [
  {
    icon: Leaf,
    title: 'What carries over',
    text: 'Structured questions and options move across with roots intact — labels, choices, and order preserved in the new form.',
  },
  {
    icon: Scissors,
    title: 'What gets pruned',
    text: 'Anything without a direct mapping arrives flagged as an explicit note. Nothing is silently reshaped into something it is not.',
  },
  {
    icon: Sun,
    title: 'Aftercare',
    text: 'Tailor with AI, sync rows to Google Sheets, export CSV, or duplicate the form and run it again.',
  },
]

export function Transplant() {
  return (
    <section
      aria-labelledby="landing-1-transplant"
      className="container py-20 md:py-28"
    >
      <h2
        id="landing-1-transplant"
        className="max-w-3xl text-3xl font-semibold tracking-tight text-balance md:text-4xl"
      >
        Repot your Google Form. Roots intact.
      </h2>
      <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
        Bring the form you already have. We move it into a stronger pot —
        same questions, better light.
      </p>

      <div className="mt-10 flex max-w-4xl flex-col border-t">
        {BEDS.map((bed) => (
          <article
            key={bed.title}
            className="grid gap-2 border-b py-6 sm:grid-cols-[240px_1fr] sm:items-baseline sm:gap-6"
          >
            <h3 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight md:text-2xl">
              <bed.icon
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              {bed.title}
            </h3>
            <p className="max-w-xl leading-relaxed text-muted-foreground">
              {bed.text}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/auth/signup"
          className={cn(buttonVariants({ size: 'lg' }), 'px-6')}
        >
          Start the transplant
          <ArrowRight className="size-4" />
        </Link>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Import is loss-aware by design: the mapping is direct where one
          exists, and explicit where it does not.
        </p>
      </div>
    </section>
  )
}
