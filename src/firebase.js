// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore, collection } from "firebase/firestore";
import { getAuth } from 'firebase/auth'


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUi5oOqFooSPa9SOJsE2Xmmg8fKl7gL3Q",
  authDomain: "todo-project-4a55d.firebaseapp.com",
  projectId: "todo-project-4a55d",
  storageBucket: "todo-project-4a55d.firebasestorage.app",
  messagingSenderId: "47808024887",
  appId: "1:47808024887:web:463bbdbe7f78ab254d8ab2",
  measurementId: "G-76L93QQZR7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app)
export const todosCol = collection(db, 'todos')
export const auth = getAuth(app)   // NEW




