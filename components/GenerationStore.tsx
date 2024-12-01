import { create } from 'zustand'
import { FormTypeWithId, getAllForms } from '@/lib/dbUtils'

interface generationState {
  userForms: FormTypeWithId[] | null
  setUserForms: (forms: FormTypeWithId[] | null) => void
  addForm: (formToAdd: FormTypeWithId) => void
  updateForm: (id: string, updatedForm: FormTypeWithId) => void
  fetchForms: () => Promise<void>
  refetchForms: () => Promise<void>
}

export const useGenerationStore = create<generationState>()((set, get) => ({
  userForms: null,
  setUserForms: (forms: FormTypeWithId[] | null) => set({ userForms: forms }),
  addForm: (formToAdd: FormTypeWithId) => {
    const { userForms, setUserForms } = get()

    if (userForms) {
      // Use properties of formToAdd directly
      setUserForms([...userForms, formToAdd])
    } else {
      // If no userForms exist, set a new array with the new form
      setUserForms([formToAdd])
    }
  },
  updateForm: (id: string, updatedForm: FormTypeWithId) => {
    const { userForms, setUserForms } = get()

    if (userForms) {
      const updatedForms = userForms.map((form) =>
        form.id === id ? { ...form, ...updatedForm } : form
      )
      setUserForms(updatedForms)
    }
  },

  fetchForms: async () => {
    const { userForms } = get()
    if (!userForms) {
      await get().refetchForms()
    }
  },
  refetchForms: async () => {
    try {
      const data = await getAllForms()
      set({ userForms: data })
    } catch (error) {
      console.error('Error fetching forms:', error)
    }
  },
}))
