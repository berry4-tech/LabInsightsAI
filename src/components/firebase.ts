import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBe92y4yJRh6bzfa3qcgqyaTB1-jOBJw-0",
  authDomain: "lab-interpreter.firebaseapp.com",
  projectId: "lab-interpreter",
  storageBucket: "lab-interpreter.appspot.com",
  messagingSenderId: "606183834566",
  appId: "1:606183834566:web:7302ea46a85e74560da8c7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
