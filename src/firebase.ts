import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Inicializar a Base de Dados (Firestore) e Autenticação
export const db = getFirestore(app);
export const auth = getAuth(app);

// ATIVAR O CACHE OFFLINE (Fundamental para o seu APK)
// Isso substitui a necessidade de gerir o localForage manualmente para dados do banco
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn("Múltiplas abas abertas, persistência não ativada.");
    } else if (err.code === 'unimplemented') {
        console.warn("O navegador/webview não suporta persistência.");
    }
});