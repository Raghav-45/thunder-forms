import { create } from 'zustand'
import { FormTypeWithId } from '@/lib/dbUtils'

interface generationState {
  //   isLoading: boolean
  //   setIsLoading: (isLoading: boolean) => void
  //   forms: Form[] | null
  //   setForms: (forms: Form[] | null) => void
  //   selectedForm: Form | null
  //   setSelectedForm: (form: Form | null) => void
  userForms: FormTypeWithId[] | null
  setUserForms: (forms: FormTypeWithId[] | null) => void
  //   isEditing: boolean
  //   setIsEditing: (isEditing: boolean) => void
}

export const useGenerationStore = create<generationState>()((set) => ({
  //   isLoading: false,
  //   setIsLoading: (isLoading: boolean) => set({ isLoading }),
  //   forms: null,
  //   setForms: (forms: Form[] | null) => set({ forms }),
  //   selectedForm: null,
  //   setSelectedForm: (form: Form | null) => set({ selectedForm: form }),
  userForms: null,
  setUserForms: (forms: FormTypeWithId[] | null) => set({ userForms: forms }),
  //   isEditing: false,
  //   setIsEditing: (isEditing: boolean) => set({ isEditing }),
}))
