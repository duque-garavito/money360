// Configuración de Firebase - Proyecto Money360
const firebaseConfig = {
    apiKey: "AIzaSyAWyNGegiBizbnGZueRCCaX3TwhXrForXo",
    authDomain: "money360-ce04b.firebaseapp.com",
    projectId: "money360-ce04b",
    storageBucket: "money360-ce04b.firebasestorage.app",
    messagingSenderId: "635327572596",
    appId: "1:635327572596:web:53f5d2697877df86933f21"
};

// Usando versiones estables 10.7.1
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    doc, 
    deleteDoc, 
    updateDoc, 
    query, 
    orderBy, 
    enableIndexedDbPersistence,
    increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("Intentando inicializar Firebase...");

// Inicializar Firebase
let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase inicializado correctamente.");
} catch (error) {
    console.error("Error crítico inicializando Firebase:", error);
    alert("Error al conectar con la base de datos: " + error.message);
}

// Habilitar persistencia offline
enableIndexedDbPersistence(db).catch((err) => {
    console.log("Info persistencia:", err.code);
});

export { 
    db, 
    auth, 
    collection, 
    addDoc, 
    onSnapshot, 
    doc, 
    deleteDoc, 
    updateDoc, 
    query, 
    orderBy,
    increment,
    signInAnonymously,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
};
