import { db } from '@/config/firebaseConfig'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'

const FORMS_COLLECTION = 'forms'

// Fetch all forms from Firestore
async function getAllForms() {
  const data: FormTypeWithId[] = []
  const q = collection(db, FORMS_COLLECTION)
  const querySnapshot = await getDocs(q)
  querySnapshot.forEach((doc) => {
    // console.log(data)
    data.push({ id: doc.id, ...doc.data() } as FormTypeWithId)
  })
  return data
}

// Fetch a single form by ID
async function getFormById(id: string) {
  const q = doc(db, FORMS_COLLECTION, id)
  const docSnap = await getDoc(q)
  if (docSnap.exists()) {
    // console.log('Document data:', docSnap.data())
    return { id: docSnap.id, ...docSnap.data() } as FormTypeWithId
  } else {
    return null
  }
}

// Create a new form in Firestore
async function createForm(
  name: string,
  description: string,
  fields: FieldType[]
) {
  const newForm: FormType = {
    name,
    description,
    fields,
  }
  const docRef = await addDoc(collection(db, FORMS_COLLECTION), newForm)
  return docRef.id
}

// Update a form by ID
async function updateFormbyId(
  id: string,
  name: string,
  description: string,
  fields: FieldType[]
) {
  const formRef = doc(db, FORMS_COLLECTION, id)

  // Update the form with the new name, description, and fields
  await updateDoc(formRef, {
    name: name,
    description: description,
    fields: fields,
  })

  return id // Return the ID of the updated form
}

export { getAllForms, getFormById, createForm, updateFormbyId }
