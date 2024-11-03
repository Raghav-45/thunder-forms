// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBxdHCmE32xrVmnHxGn_wc-5hpWICqxwc0',
  authDomain: 'online-store-fcbca.firebaseapp.com',
  projectId: 'online-store-fcbca',
  storageBucket: 'online-store-fcbca.appspot.com',
  messagingSenderId: '1063287582876',
  appId: '1:1063287582876:web:0e4739b66aaef169e27d59',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }
