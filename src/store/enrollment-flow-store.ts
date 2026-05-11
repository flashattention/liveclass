import { create } from "zustand";

interface EnrollmentFlowState {
	step: number;
	category: string;
	hasDirtyDraft: boolean;
	setStep: (step: number) => void;
	nextStep: () => void;
	prevStep: () => void;
	setCategory: (category: string) => void;
	setDirtyDraft: (hasDirtyDraft: boolean) => void;
	resetFlow: () => void;
}

const initialState = {
	step: 1,
	category: "all",
	hasDirtyDraft: false,
};

export const useEnrollmentFlowStore = create<EnrollmentFlowState>((set) => ({
	...initialState,
	setStep: (step) => set({ step }),
	nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 3) })),
	prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
	setCategory: (category) => set({ category }),
	setDirtyDraft: (hasDirtyDraft) => set({ hasDirtyDraft }),
	resetFlow: () => set(initialState),
}));
