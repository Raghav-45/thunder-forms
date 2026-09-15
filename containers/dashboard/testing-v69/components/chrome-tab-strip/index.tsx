import { cn } from '@/lib/utils'
import { ChromeIcon, PlusIcon } from 'lucide-react'

export interface ChromeTabStripPage {
  id: string
}

interface ChromeTabStripProps {
  pages: ChromeTabStripPage[]
  activePageId: string
  onSelectPage: (pageId: string) => void
  onRemovePage: (pageId: string) => void
  onAddPage: () => void
  canRemovePage: boolean
}

const closeIconClassName =
  "bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%208%208%27%3E%3Cpath%20stroke%3D%27rgba(198%2C%20198%2C%20198%2C%20.8)%27%20stroke-linecap%3D%27square%27%20stroke-width%3D%271.5%27%20d%3D%27M0%200%20L8%208%20M8%200%20L0%208%27%3E%3C%2Fpath%3E%3C%2Fsvg%3E')]"
const closeIconHoverClassName =
  "hover:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%208%208%27%3E%3Cpath%20stroke%3D%27rgba(255%2C%20255%2C%20255%2C%20.7)%27%20stroke-linecap%3D%27square%27%20stroke-width%3D%271.5%27%20d%3D%27M0%200%20L8%208%20M8%200%20L0%208%27%3E%3C%2Fpath%3E%3C%2Fsvg%3E')]"
const closeIconActiveClassName =
  "active:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%208%208%27%3E%3Cpath%20stroke%3D%27rgba(255%2C%20255%2C%20255%2C%20.9)%27%20stroke-linecap%3D%27square%27%20stroke-width%3D%271.5%27%20d%3D%27M0%200%20L8%208%20M8%200%20L0%208%27%3E%3C%2Fpath%3E%3C%2Fsvg%3E')]"

/**
 * Chrome-style tab strip.
 *
 * Geometry and spacing ported from `chrome-tabs` v5.4.0 by Adam Schwartz
 * (https://github.com/adamschwartz/chrome-tabs), MIT License, Copyright 2013.
 */
export function ChromeTabStrip({
  pages,
  activePageId,
  onSelectPage,
  onRemovePage,
  onAddPage,
  canRemovePage,
}: ChromeTabStripProps) {
  return (
    <nav
      aria-label="Form pages"
      className="relative box-border h-[46px] min-w-0 max-w-full overflow-hidden rounded-t-[5px] bg-[#450a0a] px-[3px] pb-1 pt-2 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol'] text-[12px]"
    >
      <div className="relative flex h-full w-full min-w-0 max-w-full items-start overflow-x-auto overscroll-x-contain [scroll-snap-type:x_proximity] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <svg
          aria-hidden="true"
          focusable="false"
          className="absolute size-0"
        >
          <defs>
            <symbol id="chrome-tab-geometry-left" viewBox="0 0 214 36">
              <path d="M17 0h197v36H0v-2c4.5 0 9-3.5 9-8V8c0-4.5 3.5-8 8-8z" />
            </symbol>
            <symbol id="chrome-tab-geometry-right" viewBox="0 0 214 36">
              <use href="#chrome-tab-geometry-left" />
            </symbol>
          </defs>
        </svg>
        {pages.map((page, index) => {
          const isActive = page.id === activePageId
          const geometryClassName = cn(
            'fill-[#450a0a]',
            isActive
              ? 'fill-[#b91c1c]'
              : 'group-hover/tab:fill-[#b91c1c]',
          )

          return (
            <div
              key={page.id}
              className={cn(
                'group/tab pointer-events-none relative z-[1] ml-[-1px] h-9 flex-[0_0_258px] cursor-default select-none [scroll-snap-align:start] [&_*]:cursor-default [&_*]:select-none',
                index === 0 && 'ml-0',
                isActive ? 'z-[5]' : 'hover:z-[2]',
              )}
              {...(isActive ? { 'data-active': '' } : {})}
            >
              <div className="pointer-events-none absolute inset-x-[9px] bottom-[7px] top-[7px] before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:block before:w-px before:bg-[#7f1d1d] before:opacity-100 before:[transition:opacity_0.2s_ease] after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:block after:w-px after:bg-[#7f1d1d] after:opacity-100 after:[transition:opacity_0.2s_ease]" />
              <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-100 [transition:opacity_0.2s_ease]">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-full"
                >
                  <svg width="52%" height="100%">
                    <use
                      href="#chrome-tab-geometry-left"
                      width="214"
                      height="36"
                      className={geometryClassName}
                    />
                  </svg>
                  <g transform="scale(-1, 1)">
                    <svg width="52%" height="100%" x="-100%" y="0">
                      <use
                        href="#chrome-tab-geometry-right"
                        width="214"
                        height="36"
                        className={geometryClassName}
                      />
                    </svg>
                  </g>
                </svg>
              </div>
              <div className="pointer-events-auto absolute inset-y-0 left-[9px] right-[9px] flex overflow-hidden rounded-t-lg px-2 py-[9px]">
                <div
                  className={cn(
                    'relative ml-1 flex size-4 grow-0 shrink-0 items-center justify-center text-[#c6c6c6]',
                    isActive && 'text-[#e2e2e2]',
                  )}
                >
                  <ChromeIcon className="size-4" />
                </div>
                <div
                  className={cn(
                    "ml-2 flex-1 overflow-hidden whitespace-nowrap align-top text-[#c6c6c6] [-webkit-mask-image:linear-gradient(90deg,#000_0%,#000_calc(100%-24px),transparent)] [mask-image:linear-gradient(90deg,#000_0%,#000_calc(100%-24px),transparent)]",
                    isActive && 'text-[#e2e2e2]',
                  )}
                >
                  Page {index + 1}
                </div>
                <button
                  type="button"
                  aria-label={`Page ${index + 1}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onSelectPage(page.id)}
                  className="absolute inset-0 z-0 w-full rounded-t-lg border-0 bg-transparent p-0 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#8ab4f8]"
                />
                {canRemovePage ? (
                  <button
                    type="button"
                    aria-label={`Delete page ${index + 1}`}
                    title={`Delete page ${index + 1}`}
                    onClick={() => onRemovePage(page.id)}
                    className={cn(
                      'relative z-[1] size-4 grow-0 shrink-0 rounded-full border-0 bg-[length:8px_8px] bg-center bg-no-repeat p-0 opacity-100 hover:bg-[#5f6368] hover:opacity-100 active:bg-[#80868b] active:opacity-100 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#8ab4f8]',
                      closeIconClassName,
                      closeIconHoverClassName,
                      closeIconActiveClassName,
                      !isActive && '[@media(hover:hover)]:[opacity:0.8]',
                    )}
                  />
                ) : null}
              </div>
            </div>
          )
        })}
        <button
          type="button"
          onClick={onAddPage}
          aria-label="Add page"
          title="Add page"
          className="relative z-[11] ml-2 mt-[3px] grid size-6 flex-none cursor-pointer place-items-center rounded-full border-0 bg-[#1d4973] p-0 text-[#e8eaed] hover:bg-[#2a5a8a] focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#8ab4f8]"
        >
          <PlusIcon className="size-3.5" />
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 h-1 bg-[#450a0a]" />
    </nav>
  )
}
