// ============================================
// CONFIGURAÇÃO FIREBASE - firebase.ts
// ============================================

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseAuthUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { UserProfile, Client, AppSettings, PaymentMethod } from '../types';

// ⭐⭐ CONFIGURAÇÃO FIREBASE - USANDO VARIÁVEIS DE AMBIENTE ⭐⭐
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// Configurar provedor Google
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Tipos para dados Firebase
export interface FirebaseUserData {
  user: UserProfile;
  clients: Client[];
  settings: AppSettings;
  manualFloatAdjustments: Record<PaymentMethod, number>;
  invoiceCounter: number;
  lastSynced: Timestamp;
  email: string;
  syncEnabled: boolean;
  lastLogin?: Timestamp;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
}

// Sincronizar dados com Firebase
export const syncDataToFirebase = async (
  firebaseUser: FirebaseAuthUser, 
  userData: UserProfile, 
  clients: Client[], 
  settings: AppSettings, 
  manualFloatAdjustments: Record<PaymentMethod, number>, 
  invoiceCounter: number
): Promise<{
  success: boolean;
  message: string;
  timestamp?: Timestamp;
}> => {
  try {
    if (!firebaseUser) {
      return {
        success: false,
        message: 'Usuário não autenticado'
      };
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    
    const dataToSync: FirebaseUserData = {
      user: userData,
      clients,
      settings,
      manualFloatAdjustments,
      invoiceCounter,
      lastSynced: serverTimestamp() as Timestamp,
      email: firebaseUser.email || '',
      syncEnabled: true,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    await setDoc(userDocRef, dataToSync, { merge: true });
    
    return {
      success: true,
      message: '✅ Dados sincronizados com sucesso!',
      timestamp: serverTimestamp() as Timestamp
    };
  } catch (error: any) {
    console.error('❌ Erro ao sincronizar com Firebase:', error);
    
    let errorMessage = 'Erro ao sincronizar dados.';
    if (error.code === 'permission-denied') {
      errorMessage = 'Permissão negada. Verifique suas credenciais.';
    } else if (error.code === 'unavailable') {
      errorMessage = 'Serviço indisponível. Verifique sua conexão.';
    }
    
    return {
      success: false,
      message: `❌ ${errorMessage}`
    };
  }
};

// Carregar dados do Firebase
export const loadDataFromFirebase = async (
  firebaseUser: FirebaseAuthUser
): Promise<{
  success: boolean;
  data?: FirebaseUserData;
  message: string;
}> => {
  try {
    if (!firebaseUser) {
      return {
        success: false,
        message: 'Usuário não autenticado'
      };
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data() as FirebaseUserData;
      return {
        success: true,
        data,
        message: '✅ Dados carregados do Firebase'
      };
    } else {
      return {
        success: false,
        message: '📭 Nenhum dado encontrado no Firebase'
      };
    }
  } catch (error: any) {
    console.error('❌ Erro ao carregar dados do Firebase:', error);
    
    let errorMessage = 'Erro ao carregar dados.';
    if (error.code === 'permission-denied') {
      errorMessage = 'Permissão negada para acessar dados.';
    } else if (error.code === 'unavailable') {
      errorMessage = 'Serviço indisponível.';
    }
    
    return {
      success: false,
      message: `❌ ${errorMessage}`
    };
  }
};

// Login com Google
export const loginWithGoogle = async (): Promise<{
  success: boolean;
  user?: FirebaseAuthUser;
  message: string;
}> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Salvar email para sincronização automática
    localStorage.setItem('auto_sync_email', user.email || '');
    
    return {
      success: true,
      user,
      message: '✅ Login Google realizado com sucesso!'
    };
  } catch (error: any) {
    console.error('❌ Erro no login Google:', error);
    
    let errorMessage = 'Erro ao fazer login com Google.';
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Pop-up fechado pelo usuário.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Requisição de pop-up cancelada.';
    }
    
    return {
      success: false,
      message: `❌ ${errorMessage}`
    };
  }
};

// Login com email e senha
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: FirebaseAuthUser;
  message: string;
}> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Salvar email para sincronização automática
    localStorage.setItem('auto_sync_email', email);
    
    return {
      success: true,
      user,
      message: '✅ Login realizado com sucesso!'
    };
  } catch (error: any) {
    console.error('❌ Erro no login:', error);
    
    let errorMessage = 'Erro ao fazer login.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Senha incorreta.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
    }
    
    return {
      success: false,
      message: `❌ ${errorMessage}`
    };
  }
};

// Criar nova conta
export const createAccount = async (
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: FirebaseAuthUser;
  message: string;
}> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Salvar email para sincronização automática
    localStorage.setItem('auto_sync_email', email);
    
    return {
      success: true,
      user,
      message: '✅ Conta criada com sucesso!'
    };
  } catch (error: any) {
    console.error('❌ Erro ao criar conta:', error);
    
    let errorMessage = 'Erro ao criar conta.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email já está em uso.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido.';
    }
    
    return {
      success: false,
      message: `❌ ${errorMessage}`
    };
  }
};

// Recuperar senha
export const resetPassword = async (email: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: '✅ Email de recuperação enviado! Verifique sua caixa de entrada.'
    };
  } catch (error: any) {
    console.error('❌ Erro ao recuperar senha:', error);
    
    let errorMessage = 'Erro ao enviar email de recuperação.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido.';
    }
    
    return {
      success: false,
      message: `❌ ${errorMessage}`
    };
  }
};

// Logout
export const logout = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    await signOut(auth);
    localStorage.removeItem('auto_sync_email');
    
    return {
      success: true,
      message: '✅ Logout realizado com sucesso.'
    };
  } catch (error: any) {
    console.error('❌ Erro no logout:', error);
    return {
      success: false,
      message: '❌ Erro ao fazer logout.'
    };
  }
};

// Verificar se usuário está logado
export const getCurrentUser = (): FirebaseAuthUser | null => {
  return auth.currentUser;
};

// Monitorar estado de autenticação
export const onAuthStateChange = (
  callback: (user: FirebaseAuthUser | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

// Verificar se há email salvo para sincronização automática
export const getSavedEmail = (): string | null => {
  return localStorage.getItem('auto_sync_email');
};

// Limpar email salvo
export const clearSavedEmail = (): void => {
  localStorage.removeItem('auto_sync_email');
};

// Verificar conexão com Firebase
export const checkFirebaseConnection = async (): Promise<{
  connected: boolean;
  latency: number;
  error?: string;
}> => {
  try {
    const startTime = Date.now();
    await getDoc(doc(db, 'connection_test', 'test'));
    const latency = Date.now() - startTime;
    
    return {
      connected: true,
      latency,
      error: undefined
    };
  } catch (error: any) {
    return {
      connected: false,
      latency: 0,
      error: error.message
    };
  }
};

// Obter estatísticas do usuário no Firebase
export const getUserStats = async (userId: string): Promise<{
  totalClients: number;
  totalTransactions: number;
  lastSync: string;
  storageUsed: number;
}> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data() as FirebaseUserData;
      const totalTransactions = data.clients.reduce((sum, client) => 
        sum + client.activeAccount.length + 
        client.archive.reduce((archSum, arch) => 
          archSum + arch.transactions.length, 0), 0);
      
      return {
        totalClients: data.clients.length,
        totalTransactions,
        lastSync: data.lastSynced?.toDate().toLocaleString('pt-MZ') || 'Nunca',
        storageUsed: JSON.stringify(data).length
      };
    }
    
    return {
      totalClients: 0,
      totalTransactions: 0,
      lastSync: 'Nunca',
      storageUsed: 0
    };
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    return {
      totalClients: 0,
      totalTransactions: 0,
      lastSync: 'Erro',
      storageUsed: 0
    };
  }
};