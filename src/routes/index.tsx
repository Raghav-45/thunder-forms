import { createFileRoute } from '@tanstack/react-router'
import Landing1Page from '../containers/landing-page'
import { SiteHeader } from '#/components/site-header'
import { SiteFooter } from '#/components/site-footer'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <>
      <SiteHeader />
        <main className="flex-1">
          <Landing1Page />
        </main>
      <SiteFooter />
    </>
  )
}
