import { FormFieldOrGroup } from '@/components/field-item'
import { db } from '@/config/firebaseConfig'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'

export interface FormType {
  title: string
  description: string
  fields: FormFieldOrGroup[]
}

declare interface FormTypeWithId extends FormType {
  id: string
}

const FORMS_COLLECTION = 'forms'

// Function to clean up form fields before storing them in Firestore
function cleanedFormFields(formFields: FormFieldOrGroup[]) {
  return formFields.map(({ onChange, onSelect, setValue, ...cleanedField }) => {
    // Default values for any potentially missing properties
    return {
      ...cleanedField,
    } as FormFieldOrGroup
  })
}

// Fetch all forms from Firestore
async function getAllForms() {
  const data: FormTypeWithId[] = []
  const q = collection(db, FORMS_COLLECTION)
  const querySnapshot = await getDocs(q)
  querySnapshot.forEach((doc) => {
    data.push({ id: doc.id, ...doc.data() } as FormTypeWithId)
  })
  return data
}

// Fetch a single form by ID
async function getFormById(id: string) {
  const q = doc(db, FORMS_COLLECTION, id)
  const docSnap = await getDoc(q)
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as FormTypeWithId
  } else {
    return null
  }
}

// Create a new form in Firestore
async function createForm(
  title: string,
  description: string,
  fields: FormFieldOrGroup[]
) {
  // Clean the fields
  const cleanedFields = cleanedFormFields(fields)

  const newForm: FormType = {
    title,
    description,
    fields: cleanedFields, // Use cleaned fields without functions
  }

  // Add the new form to Firestore
  const docRef = await addDoc(collection(db, FORMS_COLLECTION), newForm)
  return docRef.id
}

// Update a form by ID
async function updateFormbyId(
  id: string,
  title: string,
  description: string,
  fields: FormFieldOrGroup[]
) {
  const formRef = doc(db, FORMS_COLLECTION, id)

  // Clean the fields
  const cleanedFields = cleanedFormFields(fields)

  await updateDoc(formRef, {
    title: title,
    description: description,
    fields: cleanedFields, // Use cleaned fields without functions
  })

  return id // Return the ID of the updated form
}

export { getAllForms, getFormById, createForm, updateFormbyId }
