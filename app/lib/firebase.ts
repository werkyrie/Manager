import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth } from "firebase/auth"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgNSSoQtjvsOsS1K4ERdmX7v3oMUBB9wo",
  authDomain: "adminmenu-97d4f.firebaseapp.com",
  projectId: "adminmenu-97d4f",
  storageBucket: "adminmenu-97d4f.appspot.com",
  messagingSenderId: "581993604609",
  appId: "1:581993604609:web:3b7f5096e4ad723ae28200",
}

// Initialize Firebase with SSR safety checks
let app, db, storage, auth

// Check if we're in the browser environment
if (typeof window !== "undefined") {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }

  db = getFirestore(app)
  storage = getStorage(app)
  auth = getAuth(app)
}

export { app, db, storage, auth }
