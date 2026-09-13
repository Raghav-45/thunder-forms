import { ChromeIcon, PlusIcon } from 'lucide-react'
import styles from './chrome-tab-strip.module.css'

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
 * Tab strip using the original `chrome-tabs` visual treatment. The layout is
 * intentionally CSS-only; React only handles the page actions themselves.
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
      className={styles['chrome-tabs']}
    >
      <div className={styles['chrome-tabs-content']}>
        <svg
          aria-hidden="true"
          focusable="false"
          style={{ position: 'absolute', width: 0, height: 0 }}
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
          return (
            <div
              key={page.id}
              className={styles['chrome-tab']}
              {...(isActive ? { 'data-active': '' } : {})}
            >
              <div className={styles['chrome-tab-dividers']} />
              <div className={styles['chrome-tab-background']}>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
                  <svg width="52%" height="100%">
                    <use
                      href="#chrome-tab-geometry-left"
                      width="214"
                      height="36"
                      className={styles['chrome-tab-geometry']}
                    />
                  </svg>
                  <g transform="scale(-1, 1)">
                    <svg width="52%" height="100%" x="-100%" y="0">
                      <use
                        href="#chrome-tab-geometry-right"
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
        <button
          type="button"
          onClick={onAddPage}
          aria-label="Add page"
          title="Add page"
          className={styles['chrome-tabs-new-tab']}
        >
          <PlusIcon className="size-3.5" />
        </button>
      </div>
      <div className={styles['chrome-tabs-bottom-bar']} />
    </nav>
  )
}
