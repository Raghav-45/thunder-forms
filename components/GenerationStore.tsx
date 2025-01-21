import { create } from 'zustand'

import { forms as FormsType } from '@prisma/client'
// import { response as ResponseType } from '@prisma/client'

interface generationState {
  userForms: FormsType[] | null
  setUserForms: (forms: FormsType[] | null) => void
  addForm: (formToAdd: FormsType) => void
  updateForm: (id: string, updatedForm: FormsType) => void
}

export const useGenerationStore = create<generationState>()((set, get) => ({
  userForms: null,
  setUserForms: (forms: FormsType[] | null) => set({ userForms: forms }),
  addForm: (formToAdd: FormsType) => {
    const { userForms, setUserForms } = get()

    if (userForms) {
      // Use properties of formToAdd directly
      setUserForms([...userForms, formToAdd])
    } else {
      // If no userForms exist, set a new array with the new form
      setUserForms([formToAdd])
    }
  },
  updateForm: (id: string, updatedForm: FormsType) => {
    const { userForms, setUserForms } = get()

    if (userForms) {
      const updatedForms = userForms.map((form) =>
        form.id === id ? { ...form, ...updatedForm } : form
      )
      setUserForms(updatedForms)
    }
  },
}))
