// ============================================
// GERENCIAMENTO DE ARMAZENAMENTO - storage.ts
// ============================================

import localforage from 'localforage';
import { AppSettings, Client, UserProfile, PaymentMethod } from '../types';

// Configurar localforage
const configureStorage = () => {
  localforage.config({
    name: 'SuperAgente',
    version: 1.0,
    storeName: 'agent_data',
    description: 'Armazenamento local do Super Agente'
  });
};

// Solicitar armazenamento persistente
export const requestPersistentStorage = async (): Promise<boolean> => {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      
      if (!isPersisted) {
        const granted = await navigator.storage.persist();
        console.log(granted ? '✅ Armazenamento persistente garantido' : '⚠️ Permissão negada');
        return granted;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erro ao solicitar armazenamento persistente:', error);
    return false;
  }
};

// Verificar espaço disponível
export const checkStorageQuota = async (): Promise<{
  quota: number | null;
  usage: number | null;
  percentage: number;
  status: 'good' | 'warning' | 'critical';
}> => {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || null;
      const usage = estimate.usage || null;
      const percentage = quota && usage ? (usage / quota) * 100 : 0;
      
      let status: 'good' | 'warning' | 'critical' = 'good';
      if (percentage > 90) status = 'critical';
      else if (percentage > 70) status = 'warning';
      
      return { quota, usage, percentage, status };
    }
    return { quota: null, usage: null, percentage: 0, status: 'good' };
  } catch (error) {
    console.error('❌ Erro ao verificar quota:', error);
    return { quota: null, usage: null, percentage: 0, status: 'good' };
  }
};

// Salvar dados com verificação de espaço
export const safeSave = async <T>(key: string, data: T): Promise<boolean> => {
  try {
    await localforage.setItem(key, data);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar ${key}:`, error);
    
    // Tentar limpar cache e tentar novamente
    try {
      await localforage.removeItem('cache_temp');
      await localforage.setItem(key, data);
      return true;
    } catch (retryError) {
      console.error(`❌ Falha ao salvar após limpeza:`, retryError);
      return false;
    }
  }
};

// Carregar dados com fallback
export const safeLoad = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const data = await localforage.getItem<T>(key);
    return data !== null ? data : defaultValue;
  } catch (error) {
    console.error(`❌ Erro ao carregar ${key}:`, error);
    return defaultValue;
  }
};

// Funções específicas do app
export const saveUser = async (user: UserProfile): Promise<boolean> => {
  return await safeSave('agent_user', user);
};

export const loadUser = async (): Promise<UserProfile> => {
  return await safeLoad('agent_user', { name: 'Agente', isFirstTime: false });
};

export const saveClients = async (clients: Client[]): Promise<boolean> => {
  return await safeSave('agent_clients', clients);
};

export const loadClients = async (): Promise<Client[]> => {
  return await safeLoad('agent_clients', []);
};

export const saveSettings = async (settings: AppSettings): Promise<boolean> => {
  return await safeSave('agent_settings', settings);
};

export const loadSettings = async (): Promise<AppSettings> => {
  const { INITIAL_SETTINGS } = await import('../constants');
  return await safeLoad('agent_settings', INITIAL_SETTINGS);
};

export const saveFloatAdjustments = async (
  adjustments: Record<PaymentMethod, number>
): Promise<boolean> => {
  return await safeSave('agent_float', adjustments);
};

export const loadFloatAdjustments = async (): Promise<Record<PaymentMethod, number>> => {
  return await safeLoad('agent_float', {});
};

export const saveInvoiceCounter = async (counter: number): Promise<boolean> => {
  return await safeSave('agent_invoice_counter', counter);
};

export const loadInvoiceCounter = async (): Promise<number> => {
  return await safeLoad('agent_invoice_counter', 1);
};

// Salvar todos os dados de uma vez
export const saveAllData = async (
  user: UserProfile,
  clients: Client[],
  settings: AppSettings,
  floatAdjustments: Record<PaymentMethod, number>,
  invoiceCounter: number
): Promise<boolean> => {
  try {
    await Promise.all([
      saveUser(user),
      saveClients(clients),
      saveSettings(settings),
      saveFloatAdjustments(floatAdjustments),
      saveInvoiceCounter(invoiceCounter)
    ]);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar todos os dados:', error);
    return false;
  }
};

// Carregar todos os dados de uma vez
export const loadAllData = async (): Promise<{
  user: UserProfile;
  clients: Client[];
  settings: AppSettings;
  floatAdjustments: Record<PaymentMethod, number>;
  invoiceCounter: number;
}> => {
  const [user, clients, settings, floatAdjustments, invoiceCounter] = await Promise.all([
    loadUser(),
    loadClients(),
    loadSettings(),
    loadFloatAdjustments(),
    loadInvoiceCounter()
  ]);

  return {
    user,
    clients,
    settings,
    floatAdjustments,
    invoiceCounter
  };
};

// Limpar todos os dados (use com cuidado!)
export const clearAllData = async (): Promise<boolean> => {
  try {
    await localforage.clear();
    console.log('✅ Todos os dados foram limpos');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    return false;
  }
};

// Fazer backup dos dados atuais
export const backupCurrentData = async (): Promise<string> => {
  try {
    const data = await loadAllData();
    const backup = {
      app: 'Super Agente',
      version: '1.0',
      timestamp: new Date().toISOString(),
      data
    };
    
    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    return '';
  }
};

// Verificar integridade dos dados
export const checkDataIntegrity = async (): Promise<{
  valid: boolean;
  issues: string[];
  stats: {
    user: boolean;
    clients: number;
    settings: boolean;
    float: boolean;
    invoices: boolean;
  };
}> => {
  const issues: string[] = [];
  
  try {
    const data = await loadAllData();
    
    // Verificar usuário
    const userValid = !!data.user && typeof data.user.name === 'string';
    if (!userValid) issues.push('Dados do usuário inválidos');
    
    // Verificar clientes
    const clientsValid = Array.isArray(data.clients);
    if (!clientsValid) issues.push('Lista de clientes inválida');
    
    // Verificar configurações
    const settingsValid = !!data.settings && typeof data.settings.currency === 'string';
    if (!settingsValid) issues.push('Configurações inválidas');
    
    // Verificar float
    const floatValid = typeof data.floatAdjustments === 'object';
    if (!floatValid) issues.push('Ajustes de float inválidos');
    
    // Verificar contador
    const invoiceValid = typeof data.invoiceCounter === 'number' && data.invoiceCounter > 0;
    if (!invoiceValid) issues.push('Contador de faturas inválido');
    
    return {
      valid: issues.length === 0,
      issues,
      stats: {
        user: userValid,
        clients: clientsValid ? data.clients.length : 0,
        settings: settingsValid,
        float: floatValid,
        invoices: invoiceValid
      }
    };
  } catch (error) {
    console.error('❌ Erro na verificação de integridade:', error);
    return {
      valid: false,
      issues: ['Erro na verificação de integridade'],
      stats: {
        user: false,
        clients: 0,
        settings: false,
        float: false,
        invoices: false
      }
    };
  }
};

// Inicializar storage
configureStorage(); 
