import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFo0fycajRXGlaiWs7HfR1EXyHkz3fvTg",
  authDomain: "post-its-interactivos.firebaseapp.com",
  projectId: "post-its-interactivos",
  storageBucket: "post-its-interactivos.firebasestorage.app",
  messagingSenderId: "1049845881161",
  appId: "1:1049845881161:web:6114526bf0d915eac4e298"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);