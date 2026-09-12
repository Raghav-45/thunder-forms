'use client'

import { ChromeIcon, PlusIcon } from 'lucide-react'
import { useId } from 'react'
import styles from './chrome-tab-strip.module.css'
import { useChromeTabLayout } from './use-chrome-tab-layout'

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

/**
 * Tab strip using the original `chrome-tabs` tab geometry, styling, and
 * layout math (https://github.com/adamschwartz/chrome-tabs). Drag-sorting
 * is intentionally omitted; tab widths/positions follow upstream exactly.
 */
export function ChromeTabStrip({
  pages,
  activePageId,
  onSelectPage,
  onRemovePage,
  onAddPage,
  canRemovePage,
}: ChromeTabStripProps) {
  const geometryId = useId()
  const leftGeometryId = `${geometryId}-left`
  const rightGeometryId = `${geometryId}-right`
  const { contentRef, tabWidths, tabLefts, sizeFlags, plusLeft } =
    useChromeTabLayout(pages.length)

  return (
    <nav
      aria-label="Form pages"
      className={styles['chrome-tabs']}
      style={{ ['--tab-content-margin' as string]: '9px' }}
    >
      <div ref={contentRef} className={styles['chrome-tabs-content']}>
        <svg
          aria-hidden="true"
          focusable="false"
          style={{ position: 'absolute', width: 0, height: 0 }}
        >
          <defs>
            <symbol id={leftGeometryId} viewBox="0 0 214 36">
              <path d="M17 0h197v36H0v-2c4.5 0 9-3.5 9-8V8c0-4.5 3.5-8 8-8z" />
            </symbol>
            <symbol id={rightGeometryId} viewBox="0 0 214 36">
              <use href={`#${leftGeometryId}`} />
            </symbol>
          </defs>
        </svg>
        {pages.map((page, index) => {
          const isActive = page.id === activePageId
          const flags = sizeFlags[index] ?? {
            isSmall: false,
            isSmaller: false,
            isMini: false,
          }
          return (
            <div
              key={page.id}
              className={styles['chrome-tab']}
              style={{
                width: tabWidths[index],
                transform: `translate3d(${tabLefts[index]}px, 0, 0)`,
              }}
              {...(isActive ? { 'data-active': '' } : {})}
              {...(flags.isSmall ? { 'data-is-small': '' } : {})}
              {...(flags.isSmaller ? { 'data-is-smaller': '' } : {})}
              {...(flags.isMini ? { 'data-is-mini': '' } : {})}
            >
              <div className={styles['chrome-tab-dividers']} />
              <div className={styles['chrome-tab-background']}>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
                  <svg width="52%" height="100%">
                    <use
                      href={`#${leftGeometryId}`}
                      width="214"
                      height="36"
                      className={styles['chrome-tab-geometry']}
                    />
                  </svg>
                  <g transform="scale(-1, 1)">
                    <svg width="52%" height="100%" x="-100%" y="0">
                      <use
                        href={`#${rightGeometryId}`}
                        width="214"
                        height="36"
                        className={styles['chrome-tab-geometry']}
                      />
                    </svg>
                  </g>
                </svg>
              </div>
              <div className={styles['chrome-tab-content']}>
                <div className={styles['chrome-tab-favicon']}>
                  <ChromeIcon className="size-4" />
                </div>
                <div className={styles['chrome-tab-title']}>
                  Page {index + 1}
                </div>
                <button
                  type="button"
                  aria-label={`Page ${index + 1}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onSelectPage(page.id)}
                  className={styles['chrome-tab-drag-handle']}
                />
                {canRemovePage ? (
                  <button
                    type="button"
                    aria-label={`Delete page ${index + 1}`}
                    title={`Delete page ${index + 1}`}
                    onClick={() => onRemovePage(page.id)}
                    className={styles['chrome-tab-close']}
                  />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      <div className={styles['chrome-tabs-bottom-bar']} />
      <button
        type="button"
        onClick={onAddPage}
        aria-label="Add page"
        title="Add page"
        style={{ left: plusLeft }}
        className={styles['chrome-tabs-new-tab']}
      >
        <PlusIcon className="size-3.5" />
      </button>
    </nav>
  )
}
