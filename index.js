import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  // Replace these with your actual keys from your Firebase Console settings!
  apiKey: "YOUR_API_KEY",
  authDomain: "xx-1-2e007.firebaseapp.com",
  projectId: "xx-1-2e007",
  storageBucket: "xx-1-2e007.firebasestorage.app",
  messagingSenderId: "115055699187",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testConnection() {
  try {
    const docRef = await addDoc(collection(db, "testCollection"), {
      message: "Hello from my Web App!",
      createdAt: new Date()
    });
    console.log("Document successfully written with ID: ", docRef.id);
  } catch (error) {
    console.error("Error writing document: ", error);
  }
}

testConnection();


import { getDocs } from "firebase/firestore";

async function readData() {
  try {
    const querySnapshot = await getDocs(collection(db, "testCollection"));
    querySnapshot.forEach((doc) => {
      console.log(`Retrieved document (${doc.id}):`, doc.data());
    });
  } catch (error) {
    console.error("Error reading document: ", error);
  }
}

// Call it to see your data printed in the console
readData();
