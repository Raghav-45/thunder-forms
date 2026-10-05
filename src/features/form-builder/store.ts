import { create } from "zustand";
import {
	DEFAULT_FORM_DESCRIPTION,
	DEFAULT_FORM_TITLE,
} from "#/features/form-builder/constants";
import type { SuccessBlockId, SuccessExtraButton } from "#/lib/validators/form";

type FormStore = {
	count: number;
	formSettings: {
		title: string;
		description?: string;
		expiresAt?: Date;
		maxSubmissions?: number;
		redirectUrl?: string;
		submitButtonText?: string;
		submitAnotherResponseText?: string;
		returnToHomepageText?: string;
		showSubmitAnotherResponse?: boolean;
		showReturnToHomepage?: boolean;
		successExtraButtons?: SuccessExtraButton[];
		successTitle?: string;
		successMessage?: string;
		successBlockOrder?: SuccessBlockId[];
	};
	// Actions
	setFormSettings: (settings: FormStore["formSettings"]) => void;
	resetForm: () => void;
};

const initialFormSettings = {
	title: DEFAULT_FORM_TITLE,
	description: DEFAULT_FORM_DESCRIPTION,
	expiresAt: undefined,
	maxSubmissions: undefined,
	redirectUrl: undefined,
	submitButtonText: undefined,
	submitAnotherResponseText: undefined,
	returnToHomepageText: undefined,
	showSubmitAnotherResponse: undefined,
	showReturnToHomepage: undefined,
	successExtraButtons: undefined,
	successTitle: undefined,
	successMessage: undefined,
	successBlockOrder: undefined,
};

export const useFormStore = create<FormStore>()((set) => ({
	count: 1,
	formSettings: initialFormSettings,

	setFormSettings: (formSettings: FormStore["formSettings"]) =>
		set(() => ({ formSettings })),

	// Reset form to initial state
	resetForm: () =>
		set(() => ({
			count: 1,
			formSettings: initialFormSettings,
		})),
}));
