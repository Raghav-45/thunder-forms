import { cn } from '@/lib/utils'
import { GlobeIcon, PlusIcon, XIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

export interface ChromeTabStripPage {
  id: string
  title?: string
}

interface ChromeTabStripProps {
  pages: ChromeTabStripPage[]
  activePageId: string
  onSelectPage: (pageId: string) => void
  onRemovePage: (pageId: string) => void
  onAddPage: () => void
  canRemovePage: boolean
}

/** Chrome-inspired page tabs, adapted to the canonical builder page model. */
export function ChromeTabStrip({
  pages,
  activePageId,
  onSelectPage,
  onRemovePage,
  onAddPage,
  canRemovePage,
}: ChromeTabStripProps) {
  const shouldReduceMotion = useReducedMotion()
  const navRef = useRef<HTMLElement | null>(null)
  const previousPageCount = useRef(pages.length)

  // Keep the selected tab visible, and keep the add control reachable after
  // it creates a new tab. `nearest` only scrolls the strip horizontally.
  useEffect(() => {
    const addedPage = pages.length > previousPageCount.current
    const nav = navRef.current

    if (addedPage && nav) {
      nav.scrollTo({ left: nav.scrollWidth })
    } else {
      nav
        ?.querySelector('[data-active]')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }

    previousPageCount.current = pages.length
  }, [activePageId, pages.length])

  return (
    <nav
      aria-label="Form pages"
      ref={navRef}
      className="relative flex h-[52px] min-w-0 max-w-full items-end gap-0.5 overflow-x-auto bg-[#111111] px-4 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {pages.map((page, index) => {
        const isActive = page.id === activePageId
        const pageTitle = page.title || `Page ${index + 1}`

        return (
          <div
            key={page.id}
            className={cn(
              'group/tab relative flex h-9 min-w-[180px] max-w-[220px] flex-none cursor-default items-center gap-2 rounded-t-xl px-3 text-[13px] transition-colors duration-200',
              isActive ? 'z-10 text-card-foreground' : 'text-muted-foreground',
            )}
            {...(isActive ? { 'data-active': '' } : {})}
          >
            {isActive ? (
              <motion.div
                aria-hidden="true"
                layoutId="builder-active-page-tab"
                className="absolute inset-0 z-0 rounded-t-xl bg-card shadow-[0_-1px_4px_rgba(0,0,0,0.22)] before:absolute before:bottom-0 before:-left-3 before:size-3 before:bg-[radial-gradient(circle_at_top_left,transparent_12px,var(--card)_12px)] after:absolute after:bottom-0 after:-right-3 after:size-3 after:bg-[radial-gradient(circle_at_top_right,transparent_12px,var(--card)_12px)]"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 400, damping: 30 }
                }
              />
            ) : (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-1.5 inset-y-1.5 z-0 rounded-lg transition-colors group-hover/tab:bg-muted"
              />
            )}
            <GlobeIcon
              className={cn(
                'pointer-events-none relative z-10 size-4 shrink-0 transition-colors',
                isActive
                  ? 'text-card-foreground'
                  : 'text-muted-foreground group-hover/tab:text-foreground',
              )}
            />
            <span className="pointer-events-none relative z-10 flex-1 truncate font-medium tracking-wide">
              {pageTitle}
            </span>
            <button
              type="button"
              aria-label={pageTitle}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectPage(page.id)}
              className="absolute inset-0 z-[1] rounded-t-xl focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#8ab4f8]"
            />
            {canRemovePage ? (
              <button
                type="button"
                aria-label={`Delete ${pageTitle}`}
                title={`Delete ${pageTitle}`}
                onClick={() => onRemovePage(page.id)}
                className={cn(
                  'relative z-20 -mr-1 grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:opacity-100',
                  isActive
                    ? 'opacity-100'
                    : 'group-hover/tab:opacity-100',
                )}
              >
                <XIcon className="size-3.5" />
              </button>
            ) : null}
          </div>
        )
      })}
      <button
        type="button"
        data-add-page
        onClick={onAddPage}
        aria-label="Add page"
        title="Add page"
        className="mb-2 ml-2 grid size-6 flex-none cursor-pointer place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <PlusIcon className="size-4" />
      </button>
    </nav>
  )
}
