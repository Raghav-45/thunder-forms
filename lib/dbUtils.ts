import { FormFieldOrGroup } from '@/types/types'
import { db } from '@/config/firebaseConfig'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'

export interface FormType {
  title: string
  description: string
  fields: FormFieldOrGroup[]
}

export interface FormTypeWithId extends FormType {
  id: string
}

const FORMS_COLLECTION = 'forms'
const RESPONSES_COLLECTION = 'responses'

// Function to clean up form fields before storing them in Firestore
function cleanedFormFields(formFields: FormFieldOrGroup[]) {
  return formFields.map((field) => {
    // Destructure and exclude properties dynamically // TODO: Temp Fix
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const { onChange, onSelect, setValue, ...cleanedField } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      field as unknown as any
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

// Delete a form by ID
async function deleteFormById(id: string) {
  const formRef = doc(db, FORMS_COLLECTION, id)

  // Delete the form document
  await deleteDoc(formRef)

  return id // Return the ID of the deleted form
}

// Response Utils

export interface FormResponseType {
  parentFormId: string
  submittedAt: string
  data: Record<string, string | number | boolean> // Adjust type as needed for form field values
}

export interface FormResponseTypeWithId extends FormResponseType {
  id: string
}

// Create a new form in Firestore
async function createResponse(
  parentFormId: string,
  data: Record<string, string | number | boolean>
) {
  // Prepare the response object
  const newResponse: FormResponseType = {
    parentFormId,
    submittedAt: new Date().toISOString(), // Record the submission timestamp
    data, // Store the submitted data
  }

  // Add the new response to Firestore
  const docRef = await addDoc(collection(db, RESPONSES_COLLECTION), newResponse)
  return docRef.id // Return the ID of the new response document
}

async function getResponsesByFormId(id: string) {
  const data: FormResponseTypeWithId[] = []
  const q = query(
    collection(db, RESPONSES_COLLECTION),
    where('parentFormId', '==', id)
  )
  const querySnapshot = await getDocs(q)
  querySnapshot.forEach((doc) => {
    data.push({ id: doc.id, ...doc.data() } as FormResponseTypeWithId)
  })
  return data
}

export {
  getAllForms,
  getFormById,
  createForm,
  updateFormbyId,
  deleteFormById,
  createResponse,
  getResponsesByFormId,
}
