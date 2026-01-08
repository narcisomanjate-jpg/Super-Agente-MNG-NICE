import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings as SettingsIcon, 
  Plus, 
  Search, 
  Phone, 
  MessageSquare, 
  History, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownLeft,
  ChevronLeft,
  Moon,
  Sun,
  Globe,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Send,
  Edit2,
  Printer,
  Trash2,
  AlertCircle,
  Wallet,
  Minus,
  Check,
  CreditCard,
  Palette,
  UserPlus,
  Archive,
  Copy,
  FileText,
  Cloud,
  CloudOff,
  LogOut,
  MoreVertical,
  CheckCircle,
  Circle,
  Download,
  Upload
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Client, Transaction, UserProfile, AppSettings, ViewState, PaymentMethod, FirebaseUser } from './types';
import { INITIAL_SETTINGS, translations } from './constants';
import localforage from 'localforage';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseAuthUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  serverTimestamp 
} from 'firebase/firestore';

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
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// ⭐⭐ SOLICITAR ARMAZENAMENTO PERSISTENTE ⭐⭐
const requestPersistentStorage = async () => {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      
      if (!isPersisted) {
        await navigator.storage.persist();
      }
    }
  } catch (error) {
    // Silenciar erros de persistência
  }
};

// --- Helper Functions ---
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const PRESET_COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#a855f7', '#06b6d4', '#ec4899'];

// --- Função para criar Backup Automático ---
const createAutomaticBackup = (user: UserProfile, clients: Client[], settings: AppSettings, manualFloatAdjustments: Record<PaymentMethod, number>, invoiceCounter: number) => {
  try {
    const backupData = {
      app: "Super Agente",
      tipo: "backup_automatico",
      data: new Date().toLocaleString('pt-MZ'),
      conteudo: {
        user,
        clients,
        settings,
        manualFloatAdjustments,
        invoiceCounter
      }
    };
    
    // Salvar no LocalStorage (sobrescreve o anterior)
    localStorage.setItem('super_agente_backup', JSON.stringify(backupData));
    
  } catch (erro) {
    console.error('❌ Erro ao criar backup automático:', erro);
  }
};

// --- NOVAS FUNÇÕES: EXPORTAR/IMPORTAR DADOS LOCAIS ---
const exportLocalData = (
  user: UserProfile, 
  clients: Client[], 
  settings: AppSettings, 
  manualFloatAdjustments: Record<PaymentMethod, number>, 
  invoiceCounter: number
) => {
  try {
    const exportData = {
      app: "Super Agente - Backup Manual",
      exportDate: new Date().toISOString(),
      version: "1.0",
      data: {
        user,
        clients,
        settings,
        manualFloatAdjustments,
        invoiceCounter
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_super_agente_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ Backup exportado com sucesso! Guarde este arquivo em segurança.');
    return true;
  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error);
    alert('❌ Erro ao exportar dados.');
    return false;
  }
};

const importLocalData = (
  file: File,
  setUser: (user: UserProfile) => void,
  setClients: (clients: Client[]) => void,
  setSettings: (settings: AppSettings) => void,
  setManualFloatAdjustments: (adjustments: Record<PaymentMethod, number>) => void,
  setInvoiceCounter: (counter: number) => void
): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Validação básica do arquivo
        if (!importedData.data || !Array.isArray(importedData.data.clients)) {
          alert('❌ Arquivo de backup inválido ou corrompido.');
          resolve(false);
          return;
        }
        
        const { user, clients, settings, manualFloatAdjustments, invoiceCounter } = importedData.data;
        
        // Confirmar substituição
        if (!window.confirm('⚠️  Isso substituirá todos os seus dados atuais. Deseja continuar?')) {
          resolve(false);
          return;
        }
        
        // Atualizar estados
        setUser(user || { name: 'Agente', isFirstTime: false });
        setClients(clients || []);
        setSettings(settings || INITIAL_SETTINGS);
        setManualFloatAdjustments(manualFloatAdjustments || {});
        setInvoiceCounter(invoiceCounter || 1);
        
        // Salvar no storage local
        await Promise.all([
          localforage.setItem('agent_user', user),
          localforage.setItem('agent_clients', clients || []),
          localforage.setItem('agent_settings', settings || INITIAL_SETTINGS),
          localforage.setItem('agent_float', manualFloatAdjustments || {}),
          localforage.setItem('agent_invoice_counter', invoiceCounter || 1)
        ]);
        
        // Criar backup automático com os novos dados
        createAutomaticBackup(user, clients, settings, manualFloatAdjustments, invoiceCounter);
        
        alert(`✅ Backup importado com sucesso!\n${clients?.length || 0} clientes restaurados.`);
        resolve(true);
      } catch (error) {
        console.error('❌ Erro ao importar dados:', error);
        alert('❌ Erro ao importar arquivo. Verifique se o arquivo está correto.');
        resolve(false);
      }
    };
    
    reader.onerror = () => {
      alert('❌ Erro ao ler o arquivo.');
      resolve(false);
    };
    
    reader.readAsText(file);
  });
};

// --- Funções Firebase ---
const syncDataToFirebase = async (
  firebaseUser: FirebaseAuthUser, 
  userData: UserProfile, 
  clients: Client[], 
  settings: AppSettings, 
  manualFloatAdjustments: Record<PaymentMethod, number>, 
  invoiceCounter: number
) => {
  try {
    if (!firebaseUser) {
      return false;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    
    const dataToSync = {
      user: userData,
      clients,
      settings,
      manualFloatAdjustments,
      invoiceCounter,
      lastSynced: serverTimestamp(),
      email: firebaseUser.email,
      syncEnabled: true
    };

    await setDoc(userDocRef, dataToSync, { merge: true });
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar com Firebase:', error);
    return false;
  }
};

const loadDataFromFirebase = async (firebaseUser: FirebaseAuthUser) => {
  try {
    if (!firebaseUser) {
      return null;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return data;
    } else {
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao carregar dados do Firebase:', error);
    return null;
  }
};

// Função para gerar PDF da fatura
const generateInvoicePDF = async (client: Client, archiveData: any, settings: AppSettings) => {
  try {
    // Criar um elemento temporário para o preview
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para gerar a fatura.');
      return;
    }

    // Formatar data
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-MZ');
    };

    // Calcular totais
    let totalInflow = 0;
    let totalOutflow = 0;
    archiveData.transactions.forEach((tx: Transaction) => {
      if (tx.type === 'Inflow') {
        totalInflow += tx.amount;
      } else {
        totalOutflow += tx.amount;
      }
    });

    const saldoFinal = totalOutflow - totalInflow;

    // HTML para o preview
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fatura ${archiveData.invoiceNumber}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background: #f8fafc;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            padding: 30px;
            position: relative;
            overflow: hidden;
          }
          .header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
            position: relative;
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100px;
            height: 4px;
            background: ${settings.uiConfig.primaryColor};
            border-radius: 2px;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 5px;
          }
          .invoice-number {
            font-size: 18px;
            color: ${settings.uiConfig.primaryColor};
            font-weight: 700;
          }
          .client-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          .client-name {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 5px;
          }
          .client-phone {
            color: #64748b;
            font-size: 14px;
          }
          .transaction-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .transaction-table th {
            background: #f1f5f9;
            padding: 12px 15px;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .transaction-table td {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
          }
          .transaction-table tr:last-child td {
            border-bottom: none;
          }
          .transaction-type {
            font-weight: 700;
            text-transform: uppercase;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 6px;
            display: inline-block;
          }
          .inflow { background: #dcfce7; color: #166534; }
          .outflow { background: #fee2e2; color: #991b1b; }
          .amount {
            font-weight: 700;
            font-size: 14px;
          }
          .total-section {
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            padding: 25px;
            border-radius: 12px;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .final-total {
            font-size: 22px;
            font-weight: 800;
            color: ${settings.uiConfig.primaryColor};
            border-top: 2px dashed #cbd5e1;
            padding-top: 15px;
            margin-top: 15px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            color: #94a3b8;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          @media print {
            body { background: white; }
            .invoice-container { box-shadow: none; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="invoice-title">FATURA DE LIQUIDAÇÃO</div>
            <div class="invoice-number">${archiveData.invoiceNumber}</div>
            <div style="color: #64748b; margin-top: 10px;">
              Data: ${formatDate(archiveData.dateClosed)}
            </div>
          </div>

          <div class="client-info">
            <div class="client-name">${client.name}</div>
            <div class="client-phone">${client.phone}</div>
          </div>

          <table class="transaction-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Descrição</th>
                <th>Método</th>
                <th>Tipo</th>
                <th style="text-align: right;">Valor (${settings.currency})</th>
              </tr>
            </thead>
            <tbody>
              ${archiveData.transactions.map((tx: Transaction) => `
                <tr>
                  <td>
                    <div>${formatDate(tx.date)}</div>
                    <small style="color: #94a3b8;">${new Date(tx.date).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}</small>
                  </td>
                  <td>${tx.description || tx.type}</td>
                  <td>${tx.method}</td>
                  <td>
                    <span class="transaction-type ${tx.type.toLowerCase()}">${tx.type === 'Inflow' ? 'Entrada' : 'Saída'}</span>
                  </td>
                  <td style="text-align: right;">
                    <span class="amount ${tx.type === 'Inflow' ? 'inflow' : 'outflow'}" style="color: ${tx.type === 'Inflow' ? '#166534' : '#991b1b'};">
                      ${tx.type === 'Inflow' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Total de Saídas:</span>
              <span style="font-weight: 700; color: #991b1b;">${totalOutflow.toLocaleString()} ${settings.currency}</span>
            </div>
            <div class="total-row">
              <span>Total de Entradas:</span>
              <span style="font-weight: 700; color: #166534;">${totalInflow.toLocaleString()} ${settings.currency}</span>
            </div>
            <div class="total-row final-total">
              <span>SALDO FINAL:</span>
              <span>${saldoFinal.toLocaleString()} ${settings.currency}</span>
            </div>
          </div>

          <div class="footer">
            <p>Super Agente • Fatura gerada automaticamente</p>
            <p>Data de impressão: ${new Date().toLocaleDateString('pt-MZ')}</p>
            <button class="no-print" onclick="window.print()" style="
              background: ${settings.uiConfig.primaryColor};
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 700;
              cursor: pointer;
              margin-top: 15px;
            ">Imprimir/Guardar como PDF</button>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

  } catch (error) {
    console.error('❌ Erro ao gerar fatura:', error);
    alert('Erro ao gerar fatura. Tente novamente.');
  }
};

// --- Helper Components ---

const GlassCard: React.FC<{ children: React.ReactNode, className?: string, isDark: boolean }> = ({ children, className = "", isDark }) => (
  <div className={`rounded-3xl border shadow-sm transition-all overflow-hidden ${isDark ? 'bg-slate-800/40 border-slate-700/50 text-white' : 'bg-white/60 border-gray-100 text-gray-900'} glass ${className}`}>
    {children}
  </div>
);

const AddClientModal: React.FC<{ 
  isDark: boolean, 
  t: any, 
  clients: Client[], 
  setShowAddClient: (show: boolean) => void, 
  handleSaveNewClient: (name: string, phone: string) => void,
  initialSearch: string,
  onCreateAutomaticBackup: () => void
}> = ({ isDark, t, clients, setShowAddClient, handleSaveNewClient, initialSearch, onCreateAutomaticBackup }) => {
  const [name, setName] = useState(initialSearch || '');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    
    if (!trimmedName || !trimmedPhone) {
      setError("Preencha todos os campos.");
      return;
    }

    const isDuplicate = clients.some(c => 
      c.name.toLowerCase() === trimmedName.toLowerCase() || c.phone === trimmedPhone
    );

    if (isDuplicate) {
      setError("Já existe um cliente com este nome ou número.");
      return;
    }

    // ⭐⭐ CRIAR BACKUP AUTOMÁTICO ⭐⭐
    onCreateAutomaticBackup();
    
    handleSaveNewClient(trimmedName, trimmedPhone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'} w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
        <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-blue-900'}`}>Novo Cliente</h3>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-bold">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <input type="text" placeholder={t.login_name} className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'} active:scale-[0.98] transition-transform`} value={name} onChange={(e) => { setName(e.target.value); setError(null); }} />
          <input type="tel" placeholder={t.login_phone} className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'} active:scale-[0.98] transition-transform`} value={phone} onChange={(e) => { setPhone(e.target.value); setError(null); }} />
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowAddClient(false)} className={`flex-1 p-4 rounded-2xl font-bold active:scale-[0.95] transition-all duration-100 ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{t.tx_cancel}</button>
          <button onClick={handleSave} className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.95] transition-all duration-100 hover:bg-blue-700">{t.modal_save}</button>
        </div>
      </div>
    </div>
  );
};

// --- Modais ---

const EditClientModal: React.FC<{ 
  isDark: boolean, 
  t: any, 
  client: Client, 
  clients: Client[], 
  onClose: () => void, 
  onSave: (name: string, phone: string) => void, 
  onDelete: () => void,
  onCreateAutomaticBackup: () => void
}> = ({ isDark, t, client, clients, onClose, onSave, onDelete, onCreateAutomaticBackup }) => {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [error, setError] = useState<string | null>(null);
  
  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    
    if (!trimmedName || !trimmedPhone) {
      setError("Preencha todos os campos.");
      return;
    }

    const isDuplicate = clients.some(c => 
      c.id !== client.id && 
      (c.name.toLowerCase() === trimmedName.toLowerCase() || c.phone === trimmedPhone)
    );

    if (isDuplicate) {
      setError("Já existe um cliente com este nome ou número.");
      return;
    }

    // Atualizar cliente
    const updatedClients = clients.map(c => 
      c.id === client.id ? {...c, name: trimmedName, phone: trimmedPhone} : c
    );
    
    // ⭐⭐ SALVAR APENAS AQUI - quando clica em "Salvar" ⭐⭐
    localforage.setItem('agent_clients', updatedClients).catch(console.error);
    
    // ⭐⭐ CRIAR BACKUP AUTOMÁTICO ⭐⭐
    onCreateAutomaticBackup();
    
    onSave(trimmedName, trimmedPhone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'} w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>{t.client_edit}</h3>
          <button onClick={() => { if(window.confirm(t.confirm_delete)) onDelete(); }} className="text-rose-500 p-2 hover:bg-rose-500/10 rounded-xl transition-colors active:scale-90"><Trash2 className="w-5 h-5" /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-bold">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <input type="text" placeholder={t.login_name} className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'} active:scale-[0.98] transition-transform`} value={name} onChange={(e) => { setName(e.target.value); setError(null); }} />
          <input type="tel" placeholder={t.login_phone} className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'} active:scale-[0.98] transition-transform`} value={phone} onChange={(e) => { setPhone(e.target.value); setError(null); }} />
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className={`flex-1 p-4 rounded-2xl font-bold active:scale-[0.95] transition-all duration-100 ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{t.tx_cancel}</button>
          <button onClick={handleSave} className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.95] transition-all duration-100 hover:bg-blue-700">{t.modal_save}</button>
        </div>
      </div>
    </div>
  );
};

// Modal para editar transação
const EditTransactionModal: React.FC<{
  isDark: boolean,
  t: any,
  transaction: Transaction,
  onClose: () => void,
  onSave: (updatedTx: Transaction) => void,
  onSendConfirmation: (tx: Transaction) => void,
  settings: AppSettings,
  selectedClient: Client
}> = ({ isDark, t, transaction, onClose, onSave, onSendConfirmation, settings, selectedClient }) => {
  const [formData, setFormData] = useState({
    amount: transaction.amount.toString(),
    method: transaction.method,
    date: transaction.date.split('T')[0],
    desc: transaction.description || '',
    type: transaction.type
  });

  const handleSave = () => {
    const updatedTx: Transaction = {
      ...transaction,
      amount: parseFloat(formData.amount),
      method: formData.method,
      date: `${formData.date}T${new Date(transaction.date).toTimeString().split(' ')[0]}`,
      description: formData.desc,
      type: formData.type as 'Inflow' | 'Outflow'
    };
    
    onSave(updatedTx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'} w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>Editar Transação</h3>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.type === 'Inflow' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {formData.type === 'Inflow' ? <ArrowDownLeft /> : <ArrowUpRight />}
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Tipo</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setFormData({...formData, type: 'Inflow'})}
                className={`flex-1 p-3 rounded-2xl font-bold text-xs active:scale-[0.95] transition-all duration-100 ${formData.type === 'Inflow' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : (isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200')}`}
              >
                Entrada
              </button>
              <button 
                onClick={() => setFormData({...formData, type: 'Outflow'})}
                className={`flex-1 p-3 rounded-2xl font-bold text-xs active:scale-[0.95] transition-all duration-100 ${formData.type === 'Outflow' ? 'bg-rose-600 text-white hover:bg-rose-700' : (isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200')}`}
              >
                Saída
              </button>
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Valor ({settings.currency})</label>
            <input type="number" placeholder="0.00" className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 text-lg font-bold ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'} active:scale-[0.98] transition-transform`} value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Método</label>
            <div className="grid grid-cols-2 gap-2">
              {settings.enabledAccounts.map(m => {
                const isSelected = formData.method === m;
                const accColor = settings.accountColors[m] || settings.uiConfig.primaryColor;
                return (
                  <button 
                    key={m} 
                    onClick={() => setFormData({ ...formData, method: m })} 
                    className={`p-2 rounded-xl text-[10px] font-bold transition-all border active:scale-[0.95] duration-100 ${isSelected ? 'text-white shadow-md hover:brightness-110' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100')}`} 
                    style={{ 
                      backgroundColor: isSelected ? accColor : undefined, 
                      borderColor: isSelected ? accColor : undefined 
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Data</label>
            <input type="date" className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 text-sm ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'} active:scale-[0.98] transition-transform`} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Descrição</label>
            <input type="text" placeholder="Ex: Pagamento" className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 text-sm ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'} active:scale-[0.98] transition-transform`} value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-3">
            <button 
              onClick={() => onSendConfirmation(transaction)}
              className="flex-1 p-3 bg-blue-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.95] transition-all duration-100 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
              Enviar Confirmação
            </button>
          </div>
          
          <div className="flex gap-3">
            <button onClick={onClose} className={`flex-1 p-4 rounded-2xl font-bold active:scale-[0.95] transition-all duration-100 ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Cancelar</button>
            <button onClick={handleSave} className="flex-1 p-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 active:scale-[0.95] transition-all duration-100 hover:bg-emerald-700">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FloatManagementModal: React.FC<{
  isDark: boolean,
  t: any,
  settings: AppSettings,
  onClose: () => void,
  onUpdate: (method: PaymentMethod, amount: number) => void,
  onCreateAutomaticBackup: () => void
}> = ({ isDark, t, settings, onClose, onUpdate, onCreateAutomaticBackup }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(settings.enabledAccounts[0] || 'Cash');
  const [type, setType] = useState<'Add' | 'Sub'>('Add');

  const handleConfirm = () => {
    const val = parseFloat(amount);
    if (!isNaN(val)) {
      onUpdate(method, type === 'Add' ? val : -val);
      // ⭐⭐ CRIAR BACKUP AUTOMÁTICO ⭐⭐
      onCreateAutomaticBackup();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'} w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
        <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-blue-900'}`}>Gestão de Float</h3>
        <div className="space-y-4 mb-8">
          <div className="flex gap-2">
            <button onClick={() => setType('Add')} className={`flex-1 p-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.95] transition-all duration-100 ${type === 'Add' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : (isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200')}`}><Plus className="w-4 h-4" /> Adicionar</button>
            <button onClick={() => setType('Sub')} className={`flex-1 p-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.95] transition-all duration-100 ${type === 'Sub' ? 'bg-rose-600 text-white hover:bg-rose-700' : (isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200')}`}><Minus className="w-4 h-4" /> Retirar</button>
          </div>
          <input type="number" placeholder="Valor" className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'} active:scale-[0.98] transition-transform`} value={amount} onChange={e => setAmount(e.target.value)} />
          <select className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'} active:scale-[0.98] transition-transform`} value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}>
            {settings.enabledAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
          </select>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className={`flex-1 p-4 rounded-2xl font-bold active:scale-[0.95] transition-all duration-100 ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{t.tx_cancel}</button>
          <button onClick={handleConfirm} className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.95] transition-all duration-100 hover:bg-blue-700">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const TransactionModal: React.FC<{ 
  isDark: boolean, 
  t: any, 
  settings: AppSettings, 
  showTransactionModal: { show: boolean, type: 'Inflow' | 'Outflow' | null }, 
  selectedClient: Client | undefined, 
  clients: Client[], 
  setClients: (c: Client[]) => void, 
  setShowTransactionModal: (s: any) => void, 
  setShowSMSConfirmModal: (s: any) => void,
  agentBalances: Record<PaymentMethod, number>,
  onCreateAutomaticBackup: () => void
}> = ({ isDark, t, settings, showTransactionModal, selectedClient, clients, setClients, setShowTransactionModal, setShowSMSConfirmModal, agentBalances, onCreateAutomaticBackup }) => {
  const [formData, setFormData] = useState<{ amount: string, method: PaymentMethod, date: string, desc: string }>({ 
    amount: '', 
    method: settings.enabledAccounts[0] || 'Cash', 
    date: new Date().toISOString().split('T')[0], 
    desc: '' 
  });
  const [error, setError] = useState<string | null>(null);
  
  const currentAccountBalance = agentBalances[formData.method] || 0;

  const handleSubmit = () => {
    if (!selectedClient || !showTransactionModal.type) return;
    const amt = parseFloat(formData.amount);
    
    if (isNaN(amt) || amt <= 0) {
      setError("Valor inválido");
      return;
    }

    if (showTransactionModal.type === 'Outflow' && amt > currentAccountBalance) {
      setError("Saldo insuficiente na conta selecionada!");
      return;
    }

    // Adicionar hora atual à data
    const now = new Date();
    const dateWithTime = `${formData.date}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newTx: Transaction = { 
      id: Math.random().toString(36).substring(2, 9), 
      type: showTransactionModal.type, 
      amount: amt, 
      method: formData.method, 
      date: dateWithTime, // Usar data com hora
      dueDate: formData.date, 
      description: formData.desc, 
      settled: showTransactionModal.type === 'Inflow' 
    };

    // Atualizar clients
    const updatedClients = clients.map((c: Client) => 
      c.id === selectedClient.id ? { ...c, activeAccount: [newTx, ...c.activeAccount] } : c
    );
    
    setClients(updatedClients);
    setShowTransactionModal({ show: false, type: null });
    
    // ⭐⭐ SALVAR APENAS AQUI - quando clica em "Confirmar" ⭐⭐
    localforage.setItem('agent_clients', updatedClients).catch(console.error);
    
    // ⭐⭐ CRIAR BACKUP AUTOMÁTICO ⭐⭐
    onCreateAutomaticBackup();
    
    if (newTx.type === 'Outflow') setShowSMSConfirmModal({ show: true, tx: newTx });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'} w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>{showTransactionModal.type === 'Inflow' ? t.tx_inflow : t.tx_outflow}</h3>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${showTransactionModal.type === 'Inflow' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {showTransactionModal.type === 'Inflow' ? <ArrowDownLeft /> : <ArrowUpRight />}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-xs font-bold animate-in fade-in zoom-in-95">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">{t.tx_amount} ({settings.currency})</label>
            <input type="number" placeholder="0.00" className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 text-lg font-bold ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'} active:scale-[0.98] transition-transform`} value={formData.amount} onChange={e => { setFormData({ ...formData, amount: e.target.value }); setError(null); }} />
          </div>
          <div>
            <div className="flex justify-between items-center ml-2 mb-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">{t.tx_method}</label>
              <span className={`text-[9px] font-black uppercase ${currentAccountBalance > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Saldo: {currentAccountBalance.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {settings.enabledAccounts.map(m => {
                const isSelected = formData.method === m;
                const accColor = settings.accountColors[m] || settings.uiConfig.primaryColor;
                return (
                  <button 
                    key={m} 
                    onClick={() => { setFormData({ ...formData, method: m }); setError(null); }} 
                    className={`p-2 rounded-xl text-[10px] font-bold transition-all border active:scale-[0.95] duration-100 ${isSelected ? 'text-white shadow-md hover:brightness-110' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100')}`} 
                    style={{ 
                      backgroundColor: isSelected ? accColor : undefined, 
                      borderColor: isSelected ? accColor : undefined 
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">{t.tx_date}</label>
            <input type="date" className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 text-sm ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'} active:scale-[0.98] transition-transform`} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">{t.tx_desc}</label>
            <input type="text" placeholder="Ex: Pagamento" className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 text-sm ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'} active:scale-[0.98] transition-transform`} value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowTransactionModal({ show: false, type: null })} className={`flex-1 p-4 rounded-2xl font-bold active:scale-[0.95] transition-all duration-100 ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{t.tx_cancel}</button>
          <button onClick={handleSubmit} className={`flex-1 p-4 rounded-2xl font-bold text-white shadow-lg active:scale-[0.95] transition-all duration-100 hover:brightness-110 ${showTransactionModal.type === 'Inflow' ? 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700' : 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700'}`}>{t.tx_confirm}</button>
        </div>
      </div>
    </div>
  );
};

const DashboardView: React.FC<{ 
  isDark: boolean, 
  t: any, 
  user: UserProfile, 
  settings: AppSettings, 
  clients: Client[], 
  getClientBalance: (c: Client) => number, 
  setView: (v: ViewState) => void, 
  setSelectedClientId: (id: string) => void,
  agentBalances: Record<PaymentMethod, number>,
  onOpenFloat: () => void
}> = ({ isDark, t, user, settings, clients, getClientBalance, setView, setSelectedClientId, agentBalances, onOpenFloat }) => {
  const chartData = useMemo(() => {
    const data = [];
    
    // 1. Criamos os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0); // Zera as horas para comparação exacta
      d.setDate(d.getDate() - i);
      
      // Formato visual solicitado: 17/1, 18/1, etc.
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      let totalDoDia = 0;

      // 2. Soma as transações (Corrigido para usar activeAccount)
      clients.forEach(client => {
        // Verificamos se existem transações na conta ativa
        if (client.activeAccount && Array.isArray(client.activeAccount)) {
          client.activeAccount.forEach(tx => {
            const txDate = new Date(tx.date);
            txDate.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas o dia

            if (txDate.getTime() === d.getTime()) {
              const valor = Number(tx.amount) || 0;
              // No seu App, Inflow (Entrada) aumenta o saldo do agente
              if (tx.type === 'Inflow') {
                totalDoDia += valor;
              } else {
                totalDoDia -= valor;
              }
            }
          });
        }
      });

      data.push({
        day: label,
        total: totalDoDia
      });
    }
    
    return data;
  }, [clients]);
  
  // Função para obter as últimas 4 atividades em ordem cronológica
  const getRecentActivities = useMemo(() => {
    const allActivities: Array<{
      client: Client;
      transaction: Transaction;
      clientId: string;
    }> = [];
    
    // Coletar todas as transações de todos os clientes
    clients.forEach(client => {
      if (client.activeAccount && Array.isArray(client.activeAccount)) {
        client.activeAccount.forEach(transaction => {
          allActivities.push({
            client,
            transaction,
            clientId: client.id
          });
        });
      }
    });
    
    // Ordenar por data (mais recente primeiro)
    const sortedActivities = allActivities.sort((a, b) => {
      return new Date(b.transaction.date).getTime() - new Date(a.transaction.date).getTime();
    });
    
    // Pegar apenas as 4 mais recentes
    return sortedActivities.slice(0, 4);
  }, [clients]);
  
  // Função para formatar data e hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  };
  
  const bgOpacity = settings.uiConfig.transparency;

  // Criar gradiente baseado na cor primária
  const primaryColor = settings.uiConfig.primaryColor;
  const gradientId = `gradient-${primaryColor.replace('#', '')}`;

  return (
    <div className="p-6 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start">
        <div className="max-w-[70%]">
          <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.dash_greeting}, {user.name.split(' ')[0] || 'Agente'}
          </h2>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">
            {new Date().toLocaleDateString(settings.language === 'pt' ? 'pt-MZ' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={onOpenFloat} className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all active:scale-[0.90] duration-100 border border-transparent shadow-sm hover:brightness-110`} style={{ backgroundColor: hexToRgba(settings.uiConfig.primaryColor, 0.1), color: settings.uiConfig.primaryColor }}>
            <Wallet className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {settings.enabledAccounts.map((acc, idx) => {
          const balance = agentBalances[acc] || 0;
          const color = settings.accountColors[acc] || PRESET_COLORS[idx % PRESET_COLORS.length];
          return (
            <div key={acc} className={`p-4 md:p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden active:scale-[0.95] transition-all duration-100 min-h-[100px] flex flex-col justify-center hover:brightness-110`} style={{ backgroundColor: hexToRgba(color, bgOpacity) }}>
              <div className="absolute top-0 right-0 p-3 opacity-10"><LayoutDashboard className="w-8 h-8 md:w-10 md:h-10" /></div>
              <p className="text-[8px] md:text-[9px] font-bold opacity-70 uppercase tracking-widest mb-1 truncate">{acc}</p>
              <p className="text-base md:text-lg font-black truncate">{balance.toLocaleString()} <span className="text-[10px] font-medium opacity-50">{settings.currency}</span></p>
            </div>
          );
        })}
      </div>

      <GlassCard isDark={isDark} className="p-4 md:p-6">
        <h3 className={`font-extrabold text-[10px] md:text-sm uppercase tracking-widest mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.dash_chart_title}</h3>
        <div className="h-44 w-full relative" style={{ minHeight: '176px' }}>
          <ResponsiveContainer width="100%" height="100%" key={`chart-${isDark}-${settings.language}-${settings.uiConfig.primaryColor}`}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 600}} dy={10} />
              <Tooltip 
                contentStyle={{backgroundColor: isDark ? '#0f172a' : '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                itemStyle={{color: settings.uiConfig.primaryColor, fontWeight: '800', fontSize: '12px'}}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke={primaryColor} 
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                dot={{r: 3, fill: primaryColor, strokeWidth: 2, stroke: isDark ? '#0f172a' : '#fff'}}
                activeDot={{r: 6, strokeWidth: 0}}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <section className="space-y-4">
        <h3 className={`font-extrabold text-[10px] md:text-sm uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Atividades Recentes</h3>
        <div className="space-y-3">
          {getRecentActivities.length === 0 ? (
            <div className="py-10 text-center opacity-30 italic font-medium text-sm">Nenhuma atividade recente</div>
          ) : (
            getRecentActivities.map((activity, index) => (
              <div 
                key={`${activity.clientId}-${activity.transaction.id}-${index}`} 
                className={`p-4 rounded-3xl flex justify-between items-start cursor-pointer active:scale-[0.97] transition-all duration-100 ${isDark ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-white hover:bg-slate-50'} shadow-sm border ${isDark ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-slate-100 hover:border-slate-200'}`} 
                onClick={() => { setSelectedClientId(activity.clientId); setView('client-detail'); }}
              >
                <div className="flex-1 min-w-0">
                  {/* 1. Nome do cliente em destaque no topo */}
                  <p className={`font-extrabold text-sm md:text-base truncate mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activity.client.name}
                  </p>
                  
                  {/* 2. Descrição da transação com data e hora */}
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
                      {activity.transaction.description || activity.transaction.type}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <div className={`px-2 py-0.5 rounded-full ${activity.transaction.type === 'Inflow' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                        {activity.transaction.method}
                      </div>
                      <span>•</span>
                      <span>{formatDateTime(activity.transaction.date)}</span>
                    </div>
                  </div>
                </div>
                
                {/* 3. Valor (mantido como estava) */}
                <div className="flex flex-col items-end ml-4 flex-shrink-0">
                  <p className={`font-black text-base md:text-lg ${activity.transaction.type === 'Inflow' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {activity.transaction.type === 'Inflow' ? '+' : '-'}{activity.transaction.amount.toLocaleString()}
                  </p>
                  <p className="text-[8px] md:text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {settings.currency}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  // Estados iniciais
  const [view, setView] = useState<ViewState>('dashboard');
  const [user, setUser] = useState<UserProfile>({ name: 'Agente', isFirstTime: false });
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    ...INITIAL_SETTINGS,
    enabledAccounts: ['Super M-pesa', 'Super E-mola', 'M-pesa', 'E-mola', 'Mkesh', 'Cash'],
    accountColors: {
      ...INITIAL_SETTINGS.accountColors,
      'Mkesh': '#06b6d4'
    },
    // Novo: contas inativas
    inactiveAccounts: [] as string[]
  });
  
  const [manualFloatAdjustments, setManualFloatAdjustments] = useState<Record<PaymentMethod, number>>({ 
    'Super M-pesa': 0, 'Super E-mola': 0, 'M-pesa': 0, 'E-mola': 0, 'Mkesh': 0, 'Cash': 0 
  });
  
  const [invoiceCounter, setInvoiceCounter] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState<{ 
    show: boolean, 
    type: 'Inflow' | 'Outflow' | null 
  }>({ show: false, type: null });
  const [showSMSConfirmModal, setShowSMSConfirmModal] = useState<{ 
    show: boolean, 
    tx: Transaction | null 
  }>({ show: false, tx: null });
  const [showFloatModal, setShowFloatModal] = useState(false);
  const [isUserBoxOpen, setIsUserBoxOpen] = useState(false);
  const [isAccountsBoxOpen, setIsAccountsBoxOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [editingAccountColor, setEditingAccountColor] = useState<string | null>(null);
  const [editingAccountName, setEditingAccountName] = useState<string | null>(null);
  
  // Estados para edição de transações
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);
  const [selectedTransactionForOptions, setSelectedTransactionForOptions] = useState<string | null>(null);
  
  // Estados Firebase
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [firebaseSyncEnabled, setFirebaseSyncEnabled] = useState<boolean>(false);
  const [showFirebaseLogin, setShowFirebaseLogin] = useState<boolean>(false);
  const [firebaseEmail, setFirebaseEmail] = useState<string>('');
  const [firebasePassword, setFirebasePassword] = useState<string>('');
  const [firebaseError, setFirebaseError] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showAutoSyncPrompt, setShowAutoSyncPrompt] = useState<boolean>(false);

  // Removida a referência para navegação por swipe
  const mainRef = useRef<HTMLDivElement>(null);

  // Monitorar autenticação Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        
        // Carregar dados do Firebase para este usuário
        loadFirebaseData(user);
      } else {
        setFirebaseUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Verificar se há email salvo para sincronização automática
  useEffect(() => {
    const checkAutoSync = async () => {
      const savedEmail = localStorage.getItem('auto_sync_email');
      if (savedEmail && !firebaseUser) {
        setShowAutoSyncPrompt(true);
        setFirebaseEmail(savedEmail);
      }
    };
    
    checkAutoSync();
  }, [firebaseUser]);

  // Carregar dados do Firebase
  const loadFirebaseData = async (user: FirebaseAuthUser) => {
    try {
      setIsSyncing(true);
      const firebaseData = await loadDataFromFirebase(user);
      
      if (firebaseData) {
        // Mesclar dados do Firebase com dados locais
        setUser(firebaseData.user || { name: 'Agente', isFirstTime: false });
        setClients(firebaseData.clients || []);
        setSettings(firebaseData.settings || INITIAL_SETTINGS);
        setManualFloatAdjustments(firebaseData.manualFloatAdjustments || {});
        setInvoiceCounter(firebaseData.invoiceCounter || 1);
        
        // Salvar também localmente
        await Promise.all([
          localforage.setItem('agent_user', firebaseData.user),
          localforage.setItem('agent_clients', firebaseData.clients || []),
          localforage.setItem('agent_settings', firebaseData.settings || INITIAL_SETTINGS),
          localforage.setItem('agent_float', firebaseData.manualFloatAdjustments || {}),
          localforage.setItem('agent_invoice_counter', firebaseData.invoiceCounter || 1)
        ]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do Firebase:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sincronizar dados com Firebase
  const syncWithFirebase = async () => {
    if (!firebaseUser) {
      alert('Por favor, faça login primeiro para sincronizar.');
      return;
    }

    try {
      setIsSyncing(true);
      const success = await syncDataToFirebase(
        firebaseUser,
        user,
        clients,
        settings,
        manualFloatAdjustments,
        invoiceCounter
      );

      if (success) {
        alert('✅ Dados sincronizados com sucesso!');
      } else {
        alert('❌ Erro ao sincronizar dados.');
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar:', error);
      alert('❌ Erro ao sincronizar dados.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Login com Firebase usando Google
  const handleGoogleLogin = async () => {
    try {
      setIsSyncing(true);
      setFirebaseError('');

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Salvar email para sincronização automática
      localStorage.setItem('auto_sync_email', user.email || '');
      
      // Sincronizar dados locais com a conta
      await syncDataToFirebase(
        user,
        user,
        clients,
        settings,
        manualFloatAdjustments,
        invoiceCounter
      );
      
      alert('✅ Login Google realizado com sucesso! Seus dados foram sincronizados.');
      
    } catch (error: any) {
      console.error('❌ Erro no login Google:', error);
      setFirebaseError(`Erro: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Login automático com email salvo
  const handleAutoSync = async () => {
    const savedEmail = localStorage.getItem('auto_sync_email');
    if (!savedEmail) return;

    // Tentar login automático com Google
    try {
      setIsSyncing(true);
      const result = await signInWithPopup(auth, googleProvider);
      setShowAutoSyncPrompt(false);
    } catch (error) {
      setShowFirebaseLogin(true);
    } finally {
      setIsSyncing(false);
    }
  };

  // Login com Firebase
  const handleFirebaseLogin = async () => {
    if (!firebaseEmail || !firebasePassword) {
      setFirebaseError('Por favor, preencha email e senha.');
      return;
    }

    try {
      setIsSyncing(true);
      setFirebaseError('');

      // Tentar login
      const userCredential = await signInWithEmailAndPassword(auth, firebaseEmail, firebasePassword);
      
      // Salvar email para sincronização automática
      localStorage.setItem('auto_sync_email', firebaseEmail);
      
      // Fechar modal de login
      setShowFirebaseLogin(false);
      setFirebaseEmail('');
      setFirebasePassword('');
      
      // Sincronizar dados
      await syncDataToFirebase(
        userCredential.user,
        user,
        clients,
        settings,
        manualFloatAdjustments,
        invoiceCounter
      );
      
      alert('✅ Login realizado com sucesso! Os dados foram sincronizados.');
      
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
      if (error.code === 'auth/user-not-found') {
        // Se usuário não existe, tentar criar conta
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, firebaseEmail, firebasePassword);
          
          // Salvar email para sincronização automática
          localStorage.setItem('auto_sync_email', firebaseEmail);
          
          // Sincronizar dados locais com a nova conta
          await syncDataToFirebase(
            userCredential.user,
            user,
            clients,
            settings,
            manualFloatAdjustments,
            invoiceCounter
          );
          
          setShowFirebaseLogin(false);
          setFirebaseEmail('');
          setFirebasePassword('');
          
          alert('✅ Nova conta criada! Seus dados foram sincronizados.');
        } catch (createError: any) {
          setFirebaseError(`Erro ao criar conta: ${createError.message}`);
        }
      } else {
        setFirebaseError(`Erro: ${error.message}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Logout do Firebase
  const handleFirebaseLogout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      localStorage.removeItem('auto_sync_email');
      alert('✅ Logout realizado com sucesso.');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      alert('❌ Erro ao fazer logout.');
    }
  };

  // Função para exportar dados locais
  const handleExportLocalData = () => {
    exportLocalData(user, clients, settings, manualFloatAdjustments, invoiceCounter);
  };

  // Função para importar dados locais
  const handleImportLocalData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importLocalData(
      file,
      setUser,
      setClients,
      setSettings,
      setManualFloatAdjustments,
      setInvoiceCounter
    );
    
    // Limpar o input para permitir reimportar o mesmo arquivo
    event.target.value = '';
  };

  // 4. SALVAR DADOS AUTOMATICAMENTE quando houver alterações
  useEffect(() => {
    const saveAllData = async () => {
      if (isLoading) return;
      
      try {
        await Promise.all([
          localforage.setItem('agent_user', user),
          localforage.setItem('agent_clients', clients),
          localforage.setItem('agent_settings', settings),
          localforage.setItem('agent_float', manualFloatAdjustments),
          localforage.setItem('agent_invoice_counter', invoiceCounter)
        ]);
        
        createAutomaticBackup(user, clients, settings, manualFloatAdjustments, invoiceCounter);
        
        // Se estiver logado no Firebase, sincronizar
        if (firebaseUser && firebaseSyncEnabled) {
          await syncDataToFirebase(firebaseUser, user, clients, settings, manualFloatAdjustments, invoiceCounter);
        }
      } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
      }
    };
    
    saveAllData();
  }, [user, clients, settings, manualFloatAdjustments, invoiceCounter, isLoading, firebaseUser, firebaseSyncEnabled]);

  // Carregar dados salvos
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        await requestPersistentStorage();
        
        const backupSalvo = localStorage.getItem('super_agente_backup');
        
        if (backupSalvo) {
          try {
            const backup = JSON.parse(backupSalvo);
            
            if (backup.conteudo && backup.conteudo.user) {
              const { 
                user: backupUser, 
                clients: backupClients, 
                settings: backupSettings, 
                manualFloatAdjustments: backupFloat,
                invoiceCounter: backupInvoiceCounter 
              } = backup.conteudo;
              
              if (backupUser && backupUser.name) {
                setUser(backupUser);
              }
              
              if (backupClients && Array.isArray(backupClients)) {
                setClients(backupClients);
              }
              
              if (backupSettings) {
                setSettings(backupSettings);
              }
              
              if (backupFloat) {
                setManualFloatAdjustments(prev => ({
                  ...prev,
                  ...backupFloat
                }));
              }
              
              if (backupInvoiceCounter) {
                setInvoiceCounter(backupInvoiceCounter);
              }
              
              setIsLoading(false);
              return;
            }
          } catch (erroBackup) {
            // Backup corrompido, ignorar
          }
        }
        
        const [savedUser, savedClients, savedSettings, savedFloat, savedInvoiceCounter] = await Promise.all([
          localforage.getItem<UserProfile>('agent_user'),
          localforage.getItem<Client[]>('agent_clients'),
          localforage.getItem<AppSettings>('agent_settings'),
          localforage.getItem<Record<PaymentMethod, number>>('agent_float'),
          localforage.getItem<number>('agent_invoice_counter')
        ]);

        if (savedUser && savedUser.name) {
          setUser(savedUser);
        }
        
        if (savedClients && savedClients.length > 0) {
          setClients(savedClients);
        }
        
        if (savedSettings) {
          setSettings(savedSettings);
        }
        
        if (savedFloat) {
          setManualFloatAdjustments(prev => ({
            ...prev,
            ...savedFloat
          }));
        }
        
        if (savedInvoiceCounter && savedInvoiceCounter > 0) {
          setInvoiceCounter(savedInvoiceCounter);
        }
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSavedData();
  }, []);

  // Função wrapper para criar backup automático
  const handleCreateAutomaticBackup = () => {
    createAutomaticBackup(user, clients, settings, manualFloatAdjustments, invoiceCounter);
  };

  // Função para arquivar conta com número de fatura
  const handleCloseAccount = (client: Client) => {
    const bal = getClientBalance(client);
    
    if (bal !== 0) {
      alert("Saldo deve ser zero para arquivar.");
      return;
    }

    const invoiceNumber = `FAT-${invoiceCounter.toString().padStart(4, '0')}`;
    const nextInvoiceCounter = invoiceCounter + 1;
    
    const updatedClients = clients.map(c => 
      c.id === client.id 
        ? {
            ...c,
            archive: [{
              dateClosed: new Date().toISOString(),
              transactions: c.activeAccount,
              invoiceNumber: invoiceNumber
            }, ...c.archive],
            activeAccount: []
          }
        : c
    );
    
    setClients(updatedClients);
    setInvoiceCounter(nextInvoiceCounter);
    
    Promise.all([
      localforage.setItem('agent_clients', updatedClients),
      localforage.setItem('agent_invoice_counter', nextInvoiceCounter)
    ]).catch(console.error);
    
    handleCreateAutomaticBackup();
    
    alert(`✅ Conta arquivada com sucesso!\nNúmero da fatura: ${invoiceNumber}`);
  };

  // Função para visualizar fatura em PDF
  const handleViewInvoice = (client: Client, archiveData: any) => {
    generateInvoicePDF(client, archiveData, settings);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const getClientBalance = (client: Client) => {
    return client.activeAccount.reduce((acc, curr) => curr.type === 'Inflow' ? acc - curr.amount : acc + curr.amount, 0);
  };

  const agentBalances = useMemo(() => {
    const balances: Record<PaymentMethod, number> = { ...manualFloatAdjustments };
    clients.forEach(c => {
      c.activeAccount.forEach(tx => {
        if (tx.type === 'Inflow') balances[tx.method] = (balances[tx.method] || 0) + tx.amount;
        else balances[tx.method] = (balances[tx.method] || 0) - tx.amount;
      });
      c.archive.forEach(arch => {
        arch.transactions.forEach(tx => {
          if (tx.type === 'Inflow') balances[tx.method] = (balances[tx.method] || 0) + tx.amount;
          else balances[tx.method] = (balances[tx.method] || 0) - tx.amount;
        });
      });
    });
    return balances;
  }, [clients, manualFloatAdjustments]);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery)
    );
  }, [clients, searchQuery]);

  const isAuthView = false;
  const t = translations[settings.language];
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Função para formatar hora nas transações
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });
  };

  // Função para alternar estado da conta (ativa/inativa)
  const toggleAccountStatus = (accountName: string) => {
    const isCurrentlyActive = settings.enabledAccounts.includes(accountName);
    const isCurrentlyInactive = settings.inactiveAccounts?.includes(accountName) || false;
    
    let newEnabledAccounts = [...settings.enabledAccounts];
    let newInactiveAccounts = [...(settings.inactiveAccounts || [])];
    
    if (isCurrentlyActive) {
      // Mover para inativas
      newEnabledAccounts = newEnabledAccounts.filter(acc => acc !== accountName);
      newInactiveAccounts.push(accountName);
    } else if (isCurrentlyInactive) {
      // Mover para ativas
      newInactiveAccounts = newInactiveAccounts.filter(acc => acc !== accountName);
      newEnabledAccounts.push(accountName);
    } else {
      // Conta nova? Adicionar às ativas por padrão
      newEnabledAccounts.push(accountName);
    }
    
    setSettings({
      ...settings,
      enabledAccounts: newEnabledAccounts,
      inactiveAccounts: newInactiveAccounts
    });
  };

  // Função para editar nome da conta
  const handleEditAccountName = (oldName: string, newName: string) => {
    if (!newName.trim()) return;
    
    const trimmedName = newName.trim();
    
    // Verificar se o novo nome já existe
    if (settings.enabledAccounts.includes(trimmedName) || settings.inactiveAccounts?.includes(trimmedName)) {
      alert("Já existe uma conta com este nome.");
      return;
    }
    
    // Atualizar enabledAccounts
    const newEnabledAccounts = settings.enabledAccounts.map(acc => 
      acc === oldName ? trimmedName : acc
    );
    
    // Atualizar inactiveAccounts
    const newInactiveAccounts = (settings.inactiveAccounts || []).map(acc => 
      acc === oldName ? trimmedName : acc
    );
    
    // Atualizar accountColors
    const oldColor = settings.accountColors[oldName];
    const newAccountColors = { ...settings.accountColors };
    
    if (oldColor) {
      delete newAccountColors[oldName];
      newAccountColors[trimmedName] = oldColor;
    }
    
    setSettings({
      ...settings,
      enabledAccounts: newEnabledAccounts,
      inactiveAccounts: newInactiveAccounts,
      accountColors: newAccountColors
    });
    
    setEditingAccountName(null);
  };

  // Função para editar transação
  const handleEditTransaction = (updatedTx: Transaction) => {
    if (!selectedClient) return;
    
    const updatedClients = clients.map(client => {
      if (client.id === selectedClient.id) {
        const updatedActiveAccount = client.activeAccount.map(tx => 
          tx.id === updatedTx.id ? updatedTx : tx
        );
        
        const updatedArchive = client.archive.map(archive => ({
          ...archive,
          transactions: archive.transactions.map(tx => 
            tx.id === updatedTx.id ? updatedTx : tx
          )
        }));
        
        return {
          ...client,
          activeAccount: updatedActiveAccount,
          archive: updatedArchive
        };
      }
      return client;
    });
    
    setClients(updatedClients);
    localforage.setItem('agent_clients', updatedClients).catch(console.error);
    handleCreateAutomaticBackup();
    setShowEditTransactionModal(false);
    setEditingTransaction(null);
  };

  // Função para enviar confirmação de transação
  const handleSendTransactionConfirmation = (tx: Transaction) => {
    if (!selectedClient) return;
    
    const text = settings.smsTemplates.confirmation
      .replace('{amount}', tx.amount.toString())
      .replace('{currency}', settings.currency)
      .replace('{desc}', tx.description || tx.type);
    
    window.location.href = `sms:${selectedClient.phone}?body=${encodeURIComponent(text)}`;
  };

  // Função para mostrar opções da transação
  const handleTransactionClick = (tx: Transaction, clientId: string) => {
    setSelectedTransactionForOptions(prev => prev === tx.id ? null : tx.id);
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-0 md:p-4 lg:p-8 transition-colors duration-500 ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <div 
        className={`w-full h-full max-w-md md:max-w-lg md:h-[90vh] md:max-h-[1000px] md:rounded-[3.5rem] app-shadow flex flex-col transition-all overflow-hidden relative ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} border border-white/5`}
        // Removido os handlers de swipe
      >
        <main 
          className="flex-1 overflow-y-auto relative no-scrollbar"
          ref={mainRef}
        >
          {view === 'dashboard' && <DashboardView 
            isDark={isDark} 
            t={t} 
            user={user} 
            settings={settings} 
            clients={clients} 
            getClientBalance={getClientBalance} 
            setView={setView} 
            setSelectedClientId={setSelectedClientId} 
            agentBalances={agentBalances} 
            onOpenFloat={() => setShowFloatModal(true)} 
          />}
          
          {view === 'clients' && (
            <div className="p-6 pb-24 space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.nav_clients}</h2>
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" placeholder={t.client_search} className={`w-full pl-12 pr-5 py-3 rounded-2xl border-none focus:ring-2 shadow-sm transition-all active:scale-[0.98] ${isDark ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-white text-slate-900'}`} style={{ "--tw-ring-color": settings.uiConfig.primaryColor } as any} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-3">
                {filteredClients.length > 0 ? (
                  filteredClients.map(client => {
                    const balance = getClientBalance(client);
                    return (
                      <div key={client.id} className={`p-4 md:p-5 rounded-[2rem] shadow-sm border flex justify-between items-center active:scale-[0.97] transition-all duration-100 cursor-pointer ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/50' : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`} onClick={() => { setSelectedClientId(client.id); setView('client-detail'); }}>
                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                          <div className={`w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg ${isDark ? 'bg-slate-700' : 'bg-blue-100'} hover:brightness-110 transition-all`} style={{ color: settings.uiConfig.primaryColor }}>{client.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                          <div className="overflow-hidden">
                            <h4 className={`font-extrabold text-sm md:text-base truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{client.name}</h4>
                            <p className="text-[10px] md:text-xs text-slate-500 font-bold tracking-tight mt-0.5 truncate">{client.phone}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`font-black text-base md:text-lg ${balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{balance > 0 ? '-' : ''}{Math.abs(balance).toLocaleString()}</p>
                          <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-tighter">{t.client_balance_label}</p>
                        </div>
                      </div>
                    );
                  })
                ) : searchQuery && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <button 
                      onClick={() => setShowAddClient(true)}
                      className={`w-full p-8 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.95] duration-100 ${isDark ? 'border-slate-800 bg-slate-800/20 text-slate-400 hover:bg-slate-800/40' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      <UserPlus className="w-10 h-10 opacity-40" />
                      <div className="text-center">
                        <p className="font-bold text-base">Cliente não encontrado</p>
                        <p className="text-xs opacity-60">Deseja cadastrar <span className="text-blue-500 font-black">"{searchQuery}"</span>?</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => setShowAddClient(true)} className="fixed bottom-28 right-8 md:right-12 w-14 h-14 md:w-16 md:h-16 text-white rounded-3xl shadow-2xl flex items-center justify-center active:scale-[0.85] transition-all duration-100 z-10 hover:brightness-110 hover:shadow-3xl" style={{ backgroundColor: settings.uiConfig.primaryColor }}><Plus className="w-7 h-7 md:w-8 md:h-8" /></button>
            </div>
          )}

          {view === 'client-detail' && selectedClient && (
             <div className="min-h-full flex flex-col animate-in slide-in-from-right-10 duration-500 no-scrollbar">
                <div className="p-8 pt-12 pb-12 rounded-b-[3.5rem] text-white relative shadow-2xl" style={{ backgroundColor: settings.uiConfig.primaryColor }}>
                  <button onClick={() => setView('clients')} className="absolute left-6 top-12 p-2 md:p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all active:scale-90"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <button onClick={() => setShowEditClient(true)} className="absolute right-6 top-12 p-2 md:p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all active:scale-90"><Edit2 className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <div className="flex flex-col items-center mt-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white/15 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center text-3xl md:text-4xl font-black mb-4 hover:bg-white/20 transition-all">{selectedClient.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-center px-4">{selectedClient.name}</h2>
                    <p className="opacity-70 text-xs md:text-sm font-bold mt-1">{selectedClient.phone}</p>
                    <div className="grid grid-cols-4 gap-2 md:gap-4 w-full px-2 md:px-4 mt-8">
                      {[
                        {icon: <Phone />, label: 'Ligar', action: () => window.location.href=`tel:${selectedClient.phone}`}, 
                        {icon: <MessageSquare />, label: 'Cobrar', action: () => { const bal = getClientBalance(selectedClient); const text = settings.smsTemplates.debtReminder.replace('{amount}', bal.toString()).replace('{currency}', settings.currency); window.location.href = `sms:${selectedClient.phone}?body=${encodeURIComponent(text)}`; }}, 
                        {icon: <History />, label: 'Arquivo', action: () => setView('client-archive')}, 
                        {icon: <FileText />, label: 'Fechar', action: () => handleCloseAccount(selectedClient)}
                      ].map((btn, i) => (
                        <button key={i} onClick={btn.action} className="flex flex-col items-center gap-2 group">
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-white/15 rounded-2xl flex items-center justify-center text-white shadow-xl group-active:scale-90 transition-all duration-100 hover:bg-white/20">
                            {React.cloneElement(btn.icon as React.ReactElement<any>, { className: 'w-5 h-5 md:w-6 md:h-6' })}
                          </div>
                          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-80">{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1 px-4 md:px-6 pt-10 pb-32 space-y-6">
                   <div className="flex justify-between items-end">
                      <h3 className={`font-black uppercase tracking-widest text-[10px] md:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.client_active_ledger}</h3>
                      <div className="text-right">
                        <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">{t.client_debt}</p>
                        <p className={`text-2xl md:text-3xl font-black ${getClientBalance(selectedClient) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {getClientBalance(selectedClient).toLocaleString()} 
                          <span className="text-xs font-bold">{settings.currency}</span>
                        </p>
                      </div>
                   </div>
                   {selectedClient.activeAccount.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center opacity-40">
                      <LayoutDashboard className="w-14 h-14 md:w-16 md:h-16 mb-4" />
                      <p className="font-bold text-sm">Nenhum lançamento</p>
                    </div>
                   ) : (
                     <div className="space-y-3">
                        {selectedClient.activeAccount.map(tx => (
                          <div 
                            key={tx.id} 
                            className={`p-4 rounded-[2rem] border shadow-sm flex items-center justify-between transition-all duration-100 relative active:scale-[0.97] ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/50' : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`}
                            onClick={() => handleTransactionClick(tx, selectedClient.id)}
                          >
                             <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                               <div className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-2xl flex items-center justify-center ${tx.type === 'Inflow' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}>
                                 {tx.type === 'Inflow' ? <ArrowDownLeft className="w-5 h-5 md:w-6 md:h-6" /> : <ArrowUpRight className="w-5 h-5 md:w-6 md/h-6" />}
                               </div>
                               <div className="overflow-hidden">
                                 <p className={`font-black text-xs md:text-sm uppercase truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{tx.description || tx.type}</p>
                                 <div className="flex items-center gap-2">
                                   <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate">{tx.method}</p>
                                   <span className="text-slate-300">•</span>
                                   <p className="text-[9px] md:text-[10px] text-slate-400 font-bold tracking-tighter truncate">
                                     {new Date(tx.date).toLocaleDateString()} • {formatTime(tx.date)}
                                   </p>
                                 </div>
                               </div>
                             </div>
                             <div className="text-right flex-shrink-0 ml-2 flex items-center gap-2">
                               <p className={`font-black text-sm md:text-base ${tx.type === 'Inflow' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                 {tx.type === 'Inflow' ? '+' : '-'}{tx.amount.toLocaleString()}
                               </p>
                               <button 
                                 className="p-1 hover:bg-slate-200/20 rounded-lg transition-colors active:scale-90"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setSelectedTransactionForOptions(prev => prev === tx.id ? null : tx.id);
                                 }}
                               >
                                 <MoreVertical className="w-4 h-4 text-slate-400" />
                               </button>
                             </div>
                             
                             {/* Menu de opções da transação */}
                             {selectedTransactionForOptions === tx.id && (
                               <div className={`absolute right-4 top-16 z-10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}>
                                 <div className="p-2 space-y-1">
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setEditingTransaction(tx);
                                       setShowEditTransactionModal(true);
                                       setSelectedTransactionForOptions(null);
                                     }}
                                     className="w-full p-3 rounded-xl text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
                                   >
                                     <Edit2 className="w-4 h-4" />
                                     <span className="text-sm font-bold">Editar</span>
                                   </button>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleSendTransactionConfirmation(tx);
                                       setSelectedTransactionForOptions(null);
                                     }}
                                     className="w-full p-3 rounded-xl text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
                                   >
                                     <Send className="w-4 h-4" />
                                     <span className="text-sm font-bold">Enviar Confirmação</span>
                                   </button>
                                 </div>
                               </div>
                             )}
                          </div>
                        ))}
                     </div>
                   )}
                </div>
                <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-12 md:bottom-32 md:flex-col md:w-auto md:gap-4 flex gap-3 z-10">
                  <button onClick={() => setShowTransactionModal({ show: true, type: 'Outflow' })} className="bg-rose-600 text-white p-4 md:p-5 rounded-[2rem] font-black text-sm md:text-lg shadow-2xl active:scale-[0.85] transition-all duration-100 flex items-center justify-center gap-2 flex-1 md:flex-none md:min-w-[140px] hover:bg-rose-700 hover:shadow-3xl">
                    <Plus className="w-5 h-5 md:w-6 md:h-6" /> SAÍDA
                  </button>
                  <button onClick={() => setShowTransactionModal({ show: true, type: 'Inflow' })} className="bg-emerald-600 text-white p-4 md:p-5 rounded-[2rem] font-black text-sm md:text-lg shadow-2xl active:scale-[0.85] transition-all duration-100 flex items-center justify-center gap-2 flex-1 md:flex-none md:min-w-[140px] hover:bg-emerald-700 hover:shadow-3xl">
                    <Plus className="w-5 h-5 md:w-6 md/h-6" /> ENTRADA
                  </button>
                </div>
             </div>
          )}

          {view === 'client-archive' && selectedClient && (
            <div className="min-h-full flex flex-col animate-in slide-in-from-right-10 duration-500 no-scrollbar">
              <div className="p-8 pt-12 pb-6 flex items-center gap-4">
                <button onClick={() => setView('client-detail')} className={`p-3 rounded-2xl transition-all active:scale-90 ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white border border-slate-100 text-slate-600 shadow-sm hover:bg-slate-50'}`}>
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.client_archive_title}</h2>
              </div>
              <div className="flex-1 p-6 space-y-8">
                {selectedClient.archive.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center opacity-40">
                    <Archive className="w-16 h-16 mb-4" />
                    <p className="font-bold text-sm">{t.archive_empty}</p>
                  </div>
                ) : (
                  selectedClient.archive.map((archive, idx) => (
                    <div key={idx} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {t.archive_date}: {new Date(archive.dateClosed).toLocaleDateString()}
                            </p>
                            {/* Mostrar número da fatura com botão de impressão */}
                            {archive.invoiceNumber && (
                              <p className={`text-[9px] font-bold mt-1 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                <FileText className="w-3 h-3" />
                                Fatura: <span className="text-blue-500 font-black">{archive.invoiceNumber}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Botão para imprimir/preview da fatura */}
                        {archive.invoiceNumber && (
                          <button 
                            onClick={() => handleViewInvoice(selectedClient, archive)}
                            className="text-[8px] px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center gap-1 transition-colors active:scale-90 hover:shadow-md"
                          >
                            <Printer className="w-3 h-3" /> Visualizar
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {archive.transactions.map(tx => (
                          <div key={tx.id} className={`p-4 rounded-3xl border shadow-sm flex items-center justify-between opacity-80 active:scale-[0.98] ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-50'}`}>
                             <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'Inflow' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                 {tx.type === 'Inflow' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                               </div>
                               <div>
                                 <p className={`font-black text-xs uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{tx.description || tx.type}</p>
                                 <div className="flex items-center gap-2">
                                   <p className="text-[9px] text-slate-400 font-bold uppercase">{tx.method}</p>
                                   <span className="text-slate-300">•</span>
                                   <p className="text-[9px] text-slate-400 font-bold">
                                     {new Date(tx.date).toLocaleDateString()} • {formatTime(tx.date)}
                                   </p>
                                 </div>
                               </div>
                             </div>
                             <p className={`font-black text-sm ${tx.type === 'Inflow' ? 'text-emerald-500' : 'text-rose-500'}`}>
                               {tx.type === 'Inflow' ? '+' : '-'}{tx.amount.toLocaleString()}
                             </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="p-6 pb-24 space-y-10 animate-in fade-in duration-500">
               <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.settings_title}</h2>

               {/* Seção de Sincronização Firebase */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Sincronização na Nuvem</h3>
                  <div className={`p-5 md:p-6 rounded-[2.5rem] shadow-sm border space-y-6 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                    
                    {firebaseUser ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center ${firebaseSyncEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              <Cloud className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                              <p className="font-black text-base md:text-lg">Sincronização Ativa</p>
                              <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-tight">
                                {firebaseUser.email}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setFirebaseSyncEnabled(!firebaseSyncEnabled)}
                            className={`w-12 h-7 md:w-14 md:h-8 rounded-full transition-all relative active:scale-90 ${firebaseSyncEnabled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-200 hover:bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full transition-all shadow-md ${firebaseSyncEnabled ? 'left-6 md:left-7' : 'left-1'}`} />
                          </button>
                        </div>

                        {firebaseSyncEnabled && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={syncWithFirebase}
                                disabled={isSyncing}
                                className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.95]"
                              >
                                {isSyncing ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Sincronizando...
                                  </>
                                ) : (
                                  <>
                                    <Cloud className="w-4 h-4" />
                                    Sincronizar Agora
                                  </>
                                )}
                              </button>
                              <button 
                                onClick={handleFirebaseLogout}
                                className="flex-1 p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.95]"
                              >
                                <LogOut className="w-4 h-4" />
                                Sair
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                              {firebaseSyncEnabled 
                                ? "Seus dados serão automaticamente sincronizados com a nuvem."
                                : "A sincronização está desativada. Seus dados serão salvos apenas localmente."}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                              <CloudOff className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                              <p className="font-black text-base md:text-lg">Sincronização na Nuvem</p>
                              <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-tight">
                                Proteja seus dados com backup automático
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowFirebaseLogin(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors active:scale-90"
                          >
                            Ativar
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          • Backup automático na nuvem<br/>
                          • Acesse seus dados de qualquer dispositivo<br/>
                          • Proteção contra perda de dados
                        </p>
                      </>
                    )}
                  </div>
               </section>

               {/* NOVA SEÇÃO: Backup/Restauração Local */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Backup & Restauração Local</h3>
                  <div className={`p-5 md:p-6 rounded-[2.5rem] shadow-sm border space-y-4 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                    
                    <div className="space-y-3">
                      <button 
                        onClick={handleExportLocalData}
                        className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 active:scale-[0.95] transition-transform"
                      >
                        <Download className="w-5 h-5" />
                        Exportar Backup Completo
                      </button>
                      
                      <label className="block">
                        <div className="w-full p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 active:scale-[0.95] transition-transform cursor-pointer">
                          <Upload className="w-5 h-5" />
                          Importar Backup
                        </div>
                        <input 
                          type="file" 
                          accept=".json" 
                          onChange={handleImportLocalData} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                      Exporte seus dados para um arquivo JSON. Use para:<br/>
                      • Backup manual • Trocar de celular • Compartilhar entre dispositivos
                    </p>
                  </div>
               </section>

               {/* User Profile Section */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">{t.settings_user_profile}</h3>
                  <button onClick={() => setIsUserBoxOpen(!isUserBoxOpen)} className={`w-full flex items-center justify-between p-5 md:p-6 rounded-[2.5rem] shadow-sm border transition-all active:scale-[0.98] ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-4"><div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><UserIcon className="w-5 h-5 md:w-6 md:h-6" /></div><div className="text-left overflow-hidden max-w-[180px] md:max-w-xs"><p className="font-black text-base md:text-lg truncate">{user.name || 'Agente'}</p></div></div>
                    {isUserBoxOpen ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                  </button>
                  {isUserBoxOpen && (
                    <GlassCard isDark={isDark} className="p-5 md:p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t.login_name}</label><input type="text" className={`w-full p-4 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-600 active:scale-[0.98] ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} value={user.name} onChange={(e) => setUser({...user, name: e.target.value})} /></div>
                    </GlassCard>
                  )}
               </section>

               {/* Dynamic Accounts Management Section */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">{t.settings_accounts}</h3>
                  <button onClick={() => setIsAccountsBoxOpen(!isAccountsBoxOpen)} className={`w-full flex items-center justify-between p-5 md:p-6 rounded-[2.5rem] shadow-sm border transition-all active:scale-[0.98] ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600"><CreditCard className="w-5 h-5 md:w-6 md:h-6" /></div>
                      <div className="text-left">
                        <p className="font-black text-base md:text-lg">Contas Disponíveis</p>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-tight">
                          {settings.enabledAccounts.length} activas • {(settings.inactiveAccounts?.length || 0)} inativas
                        </p>
                      </div>
                    </div>
                    {isAccountsBoxOpen ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                  </button>
                  {isAccountsBoxOpen && (
                    <GlassCard isDark={isDark} className="p-5 md:p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                           {/* Contas Ativas */}
                           <div>
                             <h4 className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3">Contas Ativas</h4>
                             {settings.enabledAccounts.map((acc, idx) => {
                               const accColor = settings.accountColors[acc] || settings.uiConfig.primaryColor;
                               const isEditingColor = editingAccountColor === acc;
                               const isEditingName = editingAccountName === acc;
                               
                               return (
                                 <div key={`active-${acc}-${idx}`} className="space-y-3 mb-4">
                                   <div className={`flex items-center justify-between p-3 rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                                      <div className="flex items-center gap-3">
                                         <button 
                                            onClick={() => setEditingAccountColor(isEditingColor ? null : acc)} 
                                            className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm flex items-center justify-center transition-transform active:scale-90 hover:brightness-110" 
                                            style={{ backgroundColor: accColor }}
                                         >
                                           <Palette className="w-4 h-4 text-white opacity-80" />
                                         </button>
                                         
                                         {isEditingName ? (
                                           <input
                                             type="text"
                                             defaultValue={acc}
                                             className={`font-bold text-xs md:text-sm border-none focus:ring-2 focus:ring-blue-600 active:scale-[0.98] ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'}`}
                                             onBlur={(e) => handleEditAccountName(acc, e.target.value)}
                                             onKeyPress={(e) => {
                                               if (e.key === 'Enter') {
                                                 handleEditAccountName(acc, e.currentTarget.value);
                                               }
                                             }}
                                             autoFocus
                                           />
                                         ) : (
                                           <div className="flex items-center gap-2">
                                             <span className="font-bold text-xs md:text-sm uppercase truncate max-w-[100px] md:max-w-xs">{acc}</span>
                                             <button 
                                               onClick={() => setEditingAccountName(acc)}
                                               className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md active:scale-90"
                                             >
                                               <Edit2 className="w-3 h-3" />
                                             </button>
                                           </div>
                                         )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => toggleAccountStatus(acc)}
                                          className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors active:scale-90"
                                          title="Desativar conta"
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => {
                                          if (settings.enabledAccounts.length <= 1) { 
                                            alert("Mantenha ao menos uma conta activa."); 
                                            return; 
                                          }
                                          const newEnabledAccounts = settings.enabledAccounts.filter(a => a !== acc);
                                          const newInactiveAccounts = [...(settings.inactiveAccounts || []), acc];
                                          setSettings({
                                            ...settings, 
                                            enabledAccounts: newEnabledAccounts,
                                            inactiveAccounts: newInactiveAccounts
                                          });
                                        }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors active:scale-90"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                   </div>
                                   
                                   {isEditingColor && (
                                     <div className="flex gap-2 flex-wrap p-3 bg-black/10 dark:bg-black/30 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                                        {PRESET_COLORS.map(c => (
                                          <button 
                                            key={c} 
                                            onClick={() => {
                                              setSettings({...settings, accountColors: {...settings.accountColors, [acc]: c}});
                                              setEditingAccountColor(null);
                                            }} 
                                            className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-90 ${accColor === c ? 'border-white' : 'border-transparent'}`} 
                                            style={{ backgroundColor: c }}
                                          />
                                        ))}
                                     </div>
                                   )}
                                 </div>
                               );
                             })}
                           </div>
                           
                           {/* Contas Inativas */}
                           {(settings.inactiveAccounts && settings.inactiveAccounts.length > 0) && (
                             <div>
                               <h4 className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3">Contas Inativas</h4>
                               {settings.inactiveAccounts.map((acc, idx) => {
                                 const accColor = settings.accountColors[acc] || settings.uiConfig.primaryColor;
                                 const isEditingName = editingAccountName === acc;
                                 
                                 return (
                                   <div key={`inactive-${acc}-${idx}`} className="space-y-3 mb-4">
                                     <div className={`flex items-center justify-between p-3 rounded-2xl opacity-60 ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                                        <div className="flex items-center gap-3">
                                           <div 
                                              className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm flex items-center justify-center transition-transform active:scale-90" 
                                              style={{ backgroundColor: accColor }}
                                           >
                                             <Palette className="w-4 h-4 text-white opacity-80" />
                                           </div>
                                           
                                           {isEditingName ? (
                                             <input
                                               type="text"
                                               defaultValue={acc}
                                               className={`font-bold text-xs md:text-sm border-none focus:ring-2 focus:ring-blue-600 active:scale-[0.98] ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'}`}
                                               onBlur={(e) => handleEditAccountName(acc, e.target.value)}
                                               onKeyPress={(e) => {
                                                 if (e.key === 'Enter') {
                                                   handleEditAccountName(acc, e.currentTarget.value);
                                                 }
                                               }}
                                               autoFocus
                                             />
                                           ) : (
                                             <div className="flex items-center gap-2">
                                               <span className="font-bold text-xs md:text-sm uppercase truncate max-w-[100px] md:max-w-xs">{acc}</span>
                                               <button 
                                                 onClick={() => setEditingAccountName(acc)}
                                                 className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md active:scale-90"
                                               >
                                                 <Edit2 className="w-3 h-3" />
                                               </button>
                                             </div>
                                           )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button 
                                            onClick={() => toggleAccountStatus(acc)}
                                            className="p-2 text-slate-500 hover:bg-slate-500/10 rounded-xl transition-colors active:scale-90"
                                            title="Ativar conta"
                                          >
                                            <Circle className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => {
                                            const newInactiveAccounts = settings.inactiveAccounts?.filter(a => a !== acc) || [];
                                            setSettings({
                                              ...settings, 
                                              inactiveAccounts: newInactiveAccounts
                                            });
                                          }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors active:scale-90"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                           )}
                        </div>
                        <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                           <input 
                              type="text" 
                              placeholder="Ex: Paypal" 
                              className={`flex-1 p-3 md:p-4 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-600 active:scale-[0.98] ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} 
                              value={newAccName}
                              onChange={(e) => setNewAccName(e.target.value)}
                           />
                           <button 
                             onClick={() => {
                               if(!newAccName.trim()) return;
                               const trimmed = newAccName.trim();
                               if(settings.enabledAccounts.includes(trimmed) || settings.inactiveAccounts?.includes(trimmed)) { 
                                 alert("Conta já existe."); 
                                 return; 
                               }
                               setSettings({
                                 ...settings, 
                                 enabledAccounts: [...settings.enabledAccounts, trimmed],
                                 accountColors: { ...settings.accountColors, [trimmed]: settings.uiConfig.primaryColor }
                               });
                               setNewAccName('');
                             }} 
                             className="p-3 md:p-4 text-white rounded-2xl shadow-lg active:scale-90 transition-all hover:brightness-110 hover:shadow-xl"
                             style={{ backgroundColor: settings.uiConfig.primaryColor }}
                           >
                             <Plus className="w-5 h-5 md:w-6 md:h-6" />
                           </button>
                        </div>
                    </GlassCard>
                  )}
               </section>

               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">{t.ui_customization}</h3>
                  <div className={`p-5 md:p-6 rounded-[2.5rem] shadow-sm border space-y-6 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                    <div>
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">{t.ui_primary_color}</label>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                        {PRESET_COLORS.map(c => (
                          <button key={c} onClick={() => setSettings({...settings, uiConfig: {...settings.uiConfig, primaryColor: c}})} className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all hover:scale-110 active:scale-90 ${settings.uiConfig.primaryColor === c ? 'border-white' : 'border-transparent shadow-md'}`} style={{ backgroundColor: c }}>
                            {settings.uiConfig.primaryColor === c && <Check className="w-5 h-5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.ui_transparency}</label>
                        <span className="text-[10px] font-black text-blue-500">{Math.round(settings.uiConfig.transparency * 100)}%</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05" className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer active:scale-y-110" value={settings.uiConfig.transparency} onChange={(e) => setSettings({...settings, uiConfig: {...settings.uiConfig, transparency: parseFloat(e.target.value)}})} />
                    </div>
                  </div>
               </section>

               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">{t.settings_sms}</h3>
                  <div className={`p-5 md:p-6 rounded-[2.5rem] shadow-sm border space-y-6 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                    <div>
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Confirmação</label>
                      <textarea className={`w-full p-4 rounded-2xl text-[11px] md:text-xs font-bold border-none focus:ring-2 focus:ring-blue-600 transition-all active:scale-[0.98] ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100'}`} rows={3} value={settings.smsTemplates.confirmation} onChange={(e) => setSettings({...settings, smsTemplates: {...settings.smsTemplates, confirmation: e.target.value}})} />
                    </div>
                    <div>
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Cobrança</label>
                      <textarea className={`w-full p-4 rounded-2xl text-[11px] md:text-xs font-bold border-none focus:ring-2 focus:ring-blue-600 transition-all active:scale-[0.98] ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100'}`} rows={3} value={settings.smsTemplates.debtReminder} onChange={(e) => setSettings({...settings, smsTemplates: {...settings.smsTemplates, debtReminder: e.target.value}})} />
                    </div>
                  </div>
               </section>

               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">{t.settings_appearance}</h3>
                  <div className={`p-5 md:p-6 rounded-[2.5rem] shadow-sm border space-y-6 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">{isDark ? <Moon className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /> : <Sun className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />}<span className="font-extrabold text-xs md:text-sm">{t.settings_darkmode}</span></div>
                      <button onClick={() => setSettings({...settings, theme: isDark ? 'light' : 'dark'})} className={`w-12 h-7 md:w-14 md:h-8 rounded-full transition-all relative active:scale-90 ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-200 hover:bg-slate-300'}`} style={{ backgroundColor: isDark ? settings.uiConfig.primaryColor : undefined }}><div className={`absolute top-1 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full transition-all shadow-md ${isDark ? 'left-6 md:left-7' : 'left-1'}`} /></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4"><Globe className="w-5 h-5 md:w-6 md:h-6 text-blue-500" /><span className="font-extrabold text-xs md:text-sm">{t.settings_language}</span></div>
                      <button onClick={() => setSettings({...settings, language: settings.language === 'pt' ? 'en' : 'pt'})} className={`px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 ${isDark ? 'bg-slate-800 text-blue-400 hover:bg-slate-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>{settings.language === 'pt' ? 'Português' : 'English'}</button>
                    </div>
                  </div>
               </section>
            </div>
          )}
        </main>

        {!isAuthView && !['client-detail', 'client-archive'].includes(view) && (
          <nav className={`h-24 safe-bottom flex items-center justify-around px-4 md:px-12 z-40 border-t ${isDark ? 'bg-slate-900/80 border-white/5' : 'bg-white/80 border-slate-100'} backdrop-blur-2xl`}>
            {[{v: 'dashboard', icon: <LayoutDashboard />, label: t.nav_home}, {v: 'clients', icon: <Users />, label: t.nav_clients}, {v: 'settings', icon: <SettingsIcon />, label: t.nav_settings}].map((item, i) => (
              <button key={i} onClick={() => setView(item.v as ViewState)} className={`flex flex-col items-center gap-2 transition-all group ${view === item.v ? 'text-blue-600' : 'text-slate-400'}`} style={{ color: view === item.v ? settings.uiConfig.primaryColor : undefined }}><div className={`p-2 rounded-2xl transition-all group-active:scale-90 ${view === item.v ? 'scale-110' : ''}`} style={{ backgroundColor: view === item.v ? hexToRgba(settings.uiConfig.primaryColor, 0.1) : undefined }}>
                {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-5 h-5 md:w-6 md:h-6', strokeWidth: view === item.v ? 3 : 2 })}
              </div><span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] opacity-80">{item.label}</span></button>
            ))}
          </nav>
        )}

        {showFloatModal && <FloatManagementModal 
          isDark={isDark} 
          t={t} 
          settings={settings} 
          onClose={() => setShowFloatModal(false)} 
          onUpdate={(m, a) => setManualFloatAdjustments(prev => ({ ...prev, [m]: (prev[m] || 0) + a }))}
          onCreateAutomaticBackup={handleCreateAutomaticBackup}
        />}
        
        {showAddClient && <AddClientModal 
          isDark={isDark} 
          t={t} 
          clients={clients} 
          setShowAddClient={setShowAddClient} 
          handleSaveNewClient={(n, p) => { 
            setClients([...clients, { 
              id: Math.random().toString(36).substring(2, 9), 
              name: n, 
              phone: p, 
              activeAccount: [], 
              archive: [] 
            }]); 
            setShowAddClient(false); 
            setSearchQuery(''); 
          }} 
          initialSearch={searchQuery}
          onCreateAutomaticBackup={handleCreateAutomaticBackup}
        />}
        
        {showEditClient && selectedClient && <EditClientModal 
          isDark={isDark} 
          t={t} 
          client={selectedClient} 
          clients={clients} 
          onClose={() => setShowEditClient(false)} 
          onSave={(n, p) => { 
            setClients(clients.map(c => c.id === selectedClient.id ? {...c, name: n, phone: p} : c)); 
            setShowEditClient(false); 
          }} 
          onDelete={() => { 
            setClients(clients.filter(c => c.id !== selectedClient.id)); 
            setShowEditClient(false); 
            setView('clients'); 
          }}
          onCreateAutomaticBackup={handleCreateAutomaticBackup}
        />}
        
        {showTransactionModal.show && <TransactionModal 
          isDark={isDark} 
          t={t} 
          settings={settings} 
          showTransactionModal={showTransactionModal} 
          selectedClient={selectedClient} 
          clients={clients} 
          setClients={setClients} 
          setShowTransactionModal={setShowTransactionModal} 
          setShowSMSConfirmModal={setShowSMSConfirmModal} 
          agentBalances={agentBalances}
          onCreateAutomaticBackup={handleCreateAutomaticBackup}
        />}
        
        {showEditTransactionModal && editingTransaction && (
          <EditTransactionModal
            isDark={isDark}
            t={t}
            transaction={editingTransaction}
            onClose={() => {
              setShowEditTransactionModal(false);
              setEditingTransaction(null);
            }}
            onSave={handleEditTransaction}
            onSendConfirmation={handleSendTransactionConfirmation}
            settings={settings}
            selectedClient={selectedClient!}
          />
        )}
        
        {showSMSConfirmModal.show && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-lg">
             <div className={`${isDark ? 'bg-slate-900 border border-white/5' : 'bg-white'} w-full max-w-[340px] rounded-[3.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
                <div className="w-16 h-16 bg-blue-100/50 dark:bg-blue-500/20 rounded-3xl flex items-center justify-center text-blue-600 mb-6 mx-auto"><Send className="w-8 h-8" /></div>
                <h3 className="text-xl font-black text-center mb-2">{t.sms_confirm_prompt}</h3>
                <p className="text-[11px] text-slate-500 font-bold text-center mb-8 px-2 leading-relaxed opacity-70">{settings.smsTemplates.confirmation.replace('{amount}', showSMSConfirmModal.tx?.amount.toLocaleString() || '0').replace('{currency}', settings.currency).replace('{desc}', showSMSConfirmModal.tx?.description || '')}</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowSMSConfirmModal({ show: false, tx: null })} className={`flex-1 p-4 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all hover:brightness-95 active:scale-[0.95] ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{t.tx_cancel}</button>
                  <button onClick={() => { if(selectedClient && showSMSConfirmModal.tx) { const text = settings.smsTemplates.confirmation.replace('{amount}', showSMSConfirmModal.tx.amount.toString()).replace('{currency}', settings.currency).replace('{desc}', showSMSConfirmModal.tx.description || showSMSConfirmModal.tx.type); window.location.href = `sms:${selectedClient.phone}?body=${encodeURIComponent(text)}`; } setShowSMSConfirmModal({ show: false, tx: null }); }} className="flex-1 p-4 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl active:scale-[0.95] transition-all hover:brightness-110 hover:shadow-2xl" style={{ backgroundColor: settings.uiConfig.primaryColor }}>{t.sms_confirm_btn}</button>
                </div>
             </div>
           </div>
        )}

        {/* Modal de Sincronização Automática */}
        {showAutoSyncPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-lg">
            <div className={`${isDark ? 'bg-slate-900 border border-white/5' : 'bg-white'} w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black">Sincronização Automática</h3>
                <button onClick={() => setShowAutoSyncPrompt(false)} className="p-2 hover:bg-slate-800/20 rounded-xl transition-colors active:scale-90">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-8 space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-base">Sincronização Disponível</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Deseja sincronizar seus dados com a nuvem?
                    </p>
                  </div>
                </div>
                
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Seus dados estão salvos localmente. Para sincronizar com a nuvem e acessar de qualquer dispositivo:
                </p>
                
                <div className="space-y-3">
                  <button 
                    onClick={handleAutoSync}
                    disabled={isSyncing}
                    className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.95] transition-transform disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Conectando com Google...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continuar com Google
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => {
                      setShowAutoSyncPrompt(false);
                      setShowFirebaseLogin(true);
                    }}
                    className="w-full p-4 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.95] transition-transform"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Usar outro email
                  </button>
                  
                  <button 
                    onClick={() => setShowAutoSyncPrompt(false)}
                    className="w-full p-4 text-slate-500 dark:text-slate-400 rounded-2xl font-bold active:scale-[0.98]"
                  >
                    Agora não
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Login Firebase */}
        {showFirebaseLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-lg">
            <div className={`${isDark ? 'bg-slate-900 border border-white/5' : 'bg-white'} w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black">Sincronização na Nuvem</h3>
                <button onClick={() => setShowFirebaseLogin(false)} className="p-2 hover:bg-slate-800/20 rounded-xl transition-colors active:scale-90">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-8 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Email</label>
                  <input 
                    type="email" 
                    placeholder="seu@email.com" 
                    className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 active:scale-[0.98] ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'}`}
                    value={firebaseEmail}
                    onChange={(e) => setFirebaseEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Senha</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 active:scale-[0.98] ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'}`}
                    value={firebasePassword}
                    onChange={(e) => setFirebasePassword(e.target.value)}
                  />
                </div>
                
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isSyncing}
                  className="w-full p-4 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.95] transition-transform disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar com Google
                </button>
                
                {firebaseError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-[10px] font-bold animate-in fade-in">
                    {firebaseError}
                  </div>
                )}
                
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Se não tiver uma conta, será criada automaticamente.
                  Sua senha será usada apenas para sincronização.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowFirebaseLogin(false)}
                  className={`flex-1 p-4 rounded-2xl font-bold active:scale-[0.95] ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleFirebaseLogin}
                  disabled={isSyncing}
                  className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.95] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSyncing ? 'Processando...' : 'Conectar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;