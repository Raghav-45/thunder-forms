import { Capabilities, FinalCta } from './components/capabilities'
import { Hero } from './components/hero'
import { HonestLedger } from './components/honest-ledger'
import { Timeline } from './components/timeline'
import { Transplant } from './components/transplant'

export default function Home() {
  return (
    <div className="selection:bg-primary selection:text-primary-foreground">
      <Hero />
      <Timeline />
      <Transplant />
      <HonestLedger />
      <Capabilities />
      <FinalCta />
    </div>
  )
}
