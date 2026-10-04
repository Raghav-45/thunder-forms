import {
	AnimatePresence,
	motion,
	type Transition,
	type Variants,
} from "motion/react";
import type { ComponentProps } from "react";
import { Card, CardContent } from "#/components/ui/card";
import { BuilderPalette } from "#/containers/dashboard/builder/[slug]/components/builder-palette";
import { FormCustomization } from "#/containers/dashboard/builder/[slug]/components/form-customization";
import type { AvailableFieldsType } from "#/features/form-builder/types";

interface BuilderRightSidebarProps {
	customizationProps: Omit<
		ComponentProps<typeof FormCustomization>,
		"side"
	> | null;
	customizationSessionId: number;
	mode: string;
	pageTransition: Transition;
	pageTransitionVariants: Variants;
	sidebarDirection: number;
	onAddField: (fieldType: AvailableFieldsType) => void;
	onAddSection: () => void;
}

export function BuilderRightSidebar({
	customizationProps,
	customizationSessionId,
	mode,
	pageTransition,
	pageTransitionVariants,
	sidebarDirection,
	onAddField,
	onAddSection,
}: BuilderRightSidebarProps) {
	return (
		<Card
			data-testid="builder-right-sidebar"
			className="hidden h-screen w-80 shrink-0 overflow-hidden rounded-none border-0 border-l-2 md:block"
		>
			<AnimatePresence mode="wait" custom={sidebarDirection} initial={false}>
				<motion.div
					key={customizationProps ? `${mode}-${customizationSessionId}` : mode}
					custom={sidebarDirection}
					variants={pageTransitionVariants}
					initial="initial"
					animate="animate"
					exit="exit"
					transition={pageTransition}
					className="h-full min-h-0"
				>
					{customizationProps ? (
						<CardContent className="flex h-full min-h-0 flex-col gap-4 pt-0 pr-0 pb-4 pl-4">
							<h2 className="shrink-0 pr-4 text-2xl font-bold">Layout</h2>
							<FormCustomization {...customizationProps} side="layout" />
						</CardContent>
					) : (
						<BuilderPalette
							onAddField={onAddField}
							onAddSection={onAddSection}
						/>
					)}
				</motion.div>
			</AnimatePresence>
		</Card>
	);
}
