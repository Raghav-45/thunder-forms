import { db } from '@/config/firebaseConfig'
import {
  addDoc,
  //   arrayRemove,
  //   arrayUnion,
  collection,
  //   deleteDoc,
  doc,
  getDoc,
  getDocs,
  //   query,
  //   serverTimestamp,
  //   setDoc,
  //   updateDoc,
  //   where,
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

export { getAllForms, getFormById, createForm }
