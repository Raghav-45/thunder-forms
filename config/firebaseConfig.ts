// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBSM1iZDnYmuf-VcQiMAIeQu6aK97gHlZs',
  authDomain: 'thunder-forms.firebaseapp.com',
  projectId: 'thunder-forms',
  storageBucket: 'thunder-forms.firebasestorage.app',
  messagingSenderId: '223721005757',
  appId: '1:223721005757:web:a218816b5848bbd61ecdd4',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }
