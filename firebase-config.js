import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Pasted from Firebase console
const firebaseConfig = {
apiKey: "AIzaSyCboKK0uSaUzyZt8VfxPUxu8JCIVkvJH68",
authDomain: "journal-club-voting.firebaseapp.com",
projectId: "journal-club-voting",
storageBucket: "journal-club-voting.firebasestorage.app",
messagingSenderId: "419653638368",
appId: "1:419653638368:web:b3f57c2a90b166f860d885",
measurementId: "G-MRRBFMBN7N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Store globally for access from other functions
window.db = db;
window.addDoc = addDoc;
window.collection = collection;
window.getDocs = getDocs;
window.query = query;
window.orderBy = orderBy;

export { db, addDoc, collection, getDocs, query, orderBy };