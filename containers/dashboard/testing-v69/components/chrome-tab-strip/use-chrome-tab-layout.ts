'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Layout constants and sizing math ported from `chrome-tabs`
// (https://github.com/adamschwartz/chrome-tabs) `js/chrome-tabs.js`
// (`tabContentWidths` / `tabContentPositions` / `tabPositions` / `layoutTabs`).
// Only the drag-sorting part is omitted; widths and positions match upstream.
const TAB_CONTENT_MARGIN = 9
const TAB_CONTENT_OVERLAP_DISTANCE = 1
const TAB_CONTENT_MIN_WIDTH = 24
const TAB_CONTENT_MAX_WIDTH = 240
const TAB_SIZE_SMALL = 84
const TAB_SIZE_SMALLER = 60
const TAB_SIZE_MINI = 48

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export interface ChromeTabLayout {
  contentRef: React.RefObject<HTMLDivElement | null>
  /** Full tab element widths (content width + content margins). */
  tabWidths: number[]
  /** Tab element left offsets within the strip. */
  tabLefts: number[]
  /** Upstream `is-small` / `is-smaller` / `is-mini` size flags per tab. */
  sizeFlags: { isSmall: boolean; isSmaller: boolean; isMini: boolean }[]
  /** Left offset for the new-tab button (right after the last tab). */
  plusLeft: number
}

export function useChromeTabLayout(tabCount: number): ChromeTabLayout {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [contentWidth, setContentWidth] = useState(0)

  useIsomorphicLayoutEffect(() => {
    const element = contentRef.current
    if (!element) return
    const update = () => setContentWidth(element.clientWidth)
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  let contentWidths: number[]
  if (tabCount === 0) {
    contentWidths = []
  } else if (contentWidth <= 0) {
    contentWidths = new Array<number>(tabCount).fill(TAB_CONTENT_MAX_WIDTH)
  } else {
    const targetWidth =
      (contentWidth -
        2 * TAB_CONTENT_MARGIN +
        (tabCount - 1) * TAB_CONTENT_OVERLAP_DISTANCE) /
      tabCount
    const clampedTargetWidth = Math.max(
      TAB_CONTENT_MIN_WIDTH,
      Math.min(TAB_CONTENT_MAX_WIDTH, targetWidth),
    )
    const flooredClampedTargetWidth = Math.floor(clampedTargetWidth)
    const totalTabsWidthUsingTarget =
      flooredClampedTargetWidth * tabCount +
      2 * TAB_CONTENT_MARGIN -
      (tabCount - 1) * TAB_CONTENT_OVERLAP_DISTANCE
    let extraWidthRemaining = contentWidth - totalTabsWidthUsingTarget
    contentWidths = []
    for (let i = 0; i < tabCount; i += 1) {
      const extraWidth =
        flooredClampedTargetWidth < TAB_CONTENT_MAX_WIDTH &&
        extraWidthRemaining > 0
          ? 1
          : 0
      contentWidths.push(flooredClampedTargetWidth + extraWidth)
      if (extraWidthRemaining > 0) extraWidthRemaining -= 1
    }
  }

  const tabWidths = contentWidths.map(
    (contentWidth) => contentWidth + 2 * TAB_CONTENT_MARGIN,
  )

  const tabLefts: number[] = []
  {
    let position = TAB_CONTENT_MARGIN
    contentWidths.forEach((width, i) => {
      const offset = i * TAB_CONTENT_OVERLAP_DISTANCE
      tabLefts.push(position - offset - TAB_CONTENT_MARGIN)
      position += width
    })
  }

  const sizeFlags = contentWidths.map((contentWidth) => ({
    isSmall: contentWidth < TAB_SIZE_SMALL,
    isSmaller: contentWidth < TAB_SIZE_SMALLER,
    isMini: contentWidth < TAB_SIZE_MINI,
  }))

  const plusLeft =
    tabCount === 0
      ? TAB_CONTENT_MARGIN
      : tabLefts[tabCount - 1] + tabWidths[tabCount - 1] + 8

  return { contentRef, tabWidths, tabLefts, sizeFlags, plusLeft }
}
