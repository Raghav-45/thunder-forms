import {
	Capabilities,
	FinalCta,
} from "#/containers/landing-page/components/capabilities";
import { Hero } from "#/containers/landing-page/components/hero";
import { HonestLedger } from "#/containers/landing-page/components/honest-ledger";
import { Timeline } from "#/containers/landing-page/components/timeline";
import { Transplant } from "#/containers/landing-page/components/transplant";

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
	);
}
