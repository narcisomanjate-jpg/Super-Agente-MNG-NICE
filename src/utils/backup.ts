// ============================================
// SISTEMA DE BACKUP E RESTAURAÇÃO - backup.ts
// ============================================

import { UserProfile, Client, AppSettings, PaymentMethod } from '../types';
import { saveAllData } from './storage';
import { formatDate } from './helpers';

// Criar backup automático no localStorage
export const createAutomaticBackup = (
  user: UserProfile,
  clients: Client[],
  settings: AppSettings,
  manualFloatAdjustments: Record<PaymentMethod, number>,
  invoiceCounter: number
): void => {
  try {
    const backupData = {
      app: "Super Agente",
      tipo: "backup_automatico",
      data: new Date().toLocaleString('pt-MZ'),
      timestamp: Date.now(),
      conteudo: {
        user,
        clients,
        settings,
        manualFloatAdjustments,
        invoiceCounter
      }
    };
    
    // Salvar no localStorage (sobrescreve o anterior)
    localStorage.setItem('super_agente_backup', JSON.stringify(backupData));
    
    console.log('✅ Backup automático criado:', formatDate(new Date().toISOString()));
  } catch (erro) {
    console.error('❌ Erro ao criar backup automático:', erro);
  }
};

// Exportar dados para arquivo JSON
export const exportLocalData = (
  user: UserProfile, 
  clients: Client[], 
  settings: AppSettings, 
  manualFloatAdjustments: Record<PaymentMethod, number>, 
  invoiceCounter: number
): boolean => {
  try {
    const exportData = {
      app: "Super Agente - Backup Manual",
      exportDate: new Date().toISOString(),
      version: "1.0",
      dataType: "full_export",
      data: {
        user,
        clients,
        settings,
        manualFloatAdjustments,
        invoiceCounter
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_super_agente_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error);
    return false;
  }
};

// Importar dados de arquivo JSON
export const importLocalData = async (
  file: File,
  setUser: (user: UserProfile) => void,
  setClients: (clients: Client[]) => void,
  setSettings: (settings: AppSettings) => void,
  setManualFloatAdjustments: (adjustments: Record<PaymentMethod, number>) => void,
  setInvoiceCounter: (counter: number) => void
): Promise<{
  success: boolean;
  message: string;
  stats?: {
    clients: number;
    transactions: number;
    date: string;
  };
}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Validação do arquivo
        if (!importedData.data || !Array.isArray(importedData.data.clients)) {
          resolve({
            success: false,
            message: '❌ Arquivo de backup inválido ou corrompido.'
          });
          return;
        }
        
        const { 
          user: importedUser, 
          clients: importedClients, 
          settings: importedSettings, 
          manualFloatAdjustments: importedFloat,
          invoiceCounter: importedInvoiceCounter 
        } = importedData.data;
        
        // Estatísticas para mostrar ao usuário
        const totalTransactions = importedClients.reduce((sum: number, client: Client) => {
          return sum + client.activeAccount.length + 
            client.archive.reduce((archSum: number, arch: any) => 
              archSum + arch.transactions.length, 0);
        }, 0);
        
        const stats = {
          clients: importedClients.length,
          transactions: totalTransactions,
          date: importedData.exportDate || new Date().toISOString()
        };
        
        // Atualizar estados
        setUser(importedUser || { name: 'Agente', isFirstTime: false });
        setClients(importedClients || []);
        setSettings(importedSettings || {
          currency: 'MZN',
          language: 'pt',
          theme: 'light',
          enabledAccounts: ['Cash', 'M-pesa', 'E-mola'],
          smsTemplates: {
            confirmation: 'Confirmação: {amount} {currency} - {desc}',
            debtReminder: 'Lembrete: Saldo de {amount} {currency}'
          },
          uiConfig: {
            primaryColor: '#3b82f6',
            transparency: 0.8
          },
          accountColors: {},
          inactiveAccounts: []
        });
        setManualFloatAdjustments(importedFloat || {});
        setInvoiceCounter(importedInvoiceCounter || 1);
        
        // Salvar no storage local
        await saveAllData(
          importedUser,
          importedClients,
          importedSettings,
          importedFloat,
          importedInvoiceCounter
        );
        
        // Criar backup automático com os novos dados
        createAutomaticBackup(
          importedUser,
          importedClients,
          importedSettings,
          importedFloat,
          importedInvoiceCounter
        );
        
        resolve({
          success: true,
          message: `✅ Backup importado com sucesso!`,
          stats
        });
      } catch (error) {
        console.error('❌ Erro ao importar dados:', error);
        resolve({
          success: false,
          message: '❌ Erro ao importar arquivo. Verifique se o arquivo está correto.'
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        message: '❌ Erro ao ler o arquivo.'
      });
    };
    
    reader.readAsText(file);
  });
};

// Verificar se há backup recente no localStorage
export const checkForRecentBackup = (): {
  exists: boolean;
  ageInHours: number;
  date: string | null;
  size: number;
} => {
  try {
    const backupStr = localStorage.getItem('super_agente_backup');
    if (!backupStr) {
      return { exists: false, ageInHours: 0, date: null, size: 0 };
    }
    
    const backup = JSON.parse(backupStr);
    const backupDate = new Date(backup.timestamp || backup.data);
    const now = new Date();
    const ageInHours = (now.getTime() - backupDate.getTime()) / (1000 * 60 * 60);
    
    return {
      exists: true,
      ageInHours,
      date: backupDate.toLocaleString('pt-MZ'),
      size: backupStr.length
    };
  } catch (error) {
    return { exists: false, ageInHours: 0, date: null, size: 0 };
  }
};

// Restaurar backup do localStorage
export const restoreFromLocalStorageBackup = async (
  setUser: (user: UserProfile) => void,
  setClients: (clients: Client[]) => void,
  setSettings: (settings: AppSettings) => void,
  setManualFloatAdjustments: (adjustments: Record<PaymentMethod, number>) => void,
  setInvoiceCounter: (counter: number) => void
): Promise<boolean> => {
  try {
    const backupStr = localStorage.getItem('super_agente_backup');
    if (!backupStr) {
      console.log('⚠️ Nenhum backup encontrado no localStorage');
      return false;
    }
    
    const backup = JSON.parse(backupStr);
    const { user, clients, settings, manualFloatAdjustments, invoiceCounter } = backup.conteudo;
    
    // Atualizar estados
    setUser(user);
    setClients(clients);
    setSettings(settings);
    setManualFloatAdjustments(manualFloatAdjustments);
    setInvoiceCounter(invoiceCounter);
    
    // Salvar no storage
    await saveAllData(user, clients, settings, manualFloatAdjustments, invoiceCounter);
    
    console.log('✅ Backup restaurado do localStorage');
    return true;
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    return false;
  }
};

// Gerar relatório de dados atuais
export const generateDataReport = (
  user: UserProfile,
  clients: Client[],
  settings: AppSettings,
  manualFloatAdjustments: Record<PaymentMethod, number>,
  invoiceCounter: number
): string => {
  const totalActiveTransactions = clients.reduce((sum, client) => 
    sum + client.activeAccount.length, 0);
  
  const totalArchivedTransactions = clients.reduce((sum, client) => 
    sum + client.archive.reduce((archSum, arch) => 
      archSum + arch.transactions.length, 0), 0);
  
  const clientsWithBalance = clients.filter(client => {
    const balance = client.activeAccount.reduce((acc, curr) => 
      curr.type === 'Inflow' ? acc - curr.amount : acc + curr.amount, 0);
    return balance !== 0;
  }).length;
  
  return `
RELATÓRIO DE DADOS - SUPER AGENTE
=================================
Data: ${new Date().toLocaleString('pt-MZ')}

👤 USUÁRIO: ${user.name}

📊 ESTATÍSTICAS:
• Clientes cadastrados: ${clients.length}
• Clientes com saldo: ${clientsWithBalance}
• Transações ativas: ${totalActiveTransactions}
• Transações arquivadas: ${totalArchivedTransactions}
• Faturas geradas: ${invoiceCounter - 1}

💰 CONTAS ATIVAS: ${settings.enabledAccounts.join(', ')}

⚙️ CONFIGURAÇÕES:
• Moeda: ${settings.currency}
• Idioma: ${settings.language}
• Tema: ${settings.theme}
• Cor principal: ${settings.uiConfig.primaryColor}

💾 BACKUP:
• Último backup: ${checkForRecentBackup().date || 'Nenhum'}
• Idade do backup: ${Math.round(checkForRecentBackup().ageInHours)} horas
  `.trim();
}; 
