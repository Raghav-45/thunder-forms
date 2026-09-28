import { createFileRoute } from '@tanstack/react-router'
import Landing1Page from '../containers/landing-page'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return <Landing1Page />
}
