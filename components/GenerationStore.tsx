import { create } from 'zustand'

import { forms as FormType } from '@prisma/client'
// import { response as ResponseType } from '@prisma/client'

interface generationState {
  userForms: FormType[] | null
  setUserForms: (forms: FormType[] | null) => void
  addForm: (formToAdd: FormType) => void
  updateForm: (id: string, updatedForm: FormType) => void
}

export const useGenerationStore = create<generationState>()((set, get) => ({
  userForms: null,
  setUserForms: (forms: FormType[] | null) => set({ userForms: forms }),
  addForm: (formToAdd: FormType) => {
    const { userForms, setUserForms } = get()

    if (userForms) {
      // Use properties of formToAdd directly
      setUserForms([...userForms, formToAdd])
    } else {
      // If no userForms exist, set a new array with the new form
      setUserForms([formToAdd])
    }
  },
  updateForm: (id: string, updatedForm: FormType) => {
    const { userForms, setUserForms } = get()

    if (userForms) {
      const updatedForms = userForms.map((form) =>
        form.id === id ? { ...form, ...updatedForm } : form
      )
      setUserForms(updatedForms)
    }
  },
}))
