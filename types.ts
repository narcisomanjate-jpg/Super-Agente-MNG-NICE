
export type PaymentMethod = string; // Now dynamic based on account names

export interface Transaction {
  id: string;
  type: 'Inflow' | 'Outflow';
  amount: number;
  method: PaymentMethod; // Linked to account name
  accountId: string;     // Explicit link to the source account
  date: string;
  dueDate: string;
  description: string;
  settled: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  activeAccount: Transaction[];
  archive: { dateClosed: string; transactions: Transaction[] }[];
}

export interface UserProfile {
  name: string;
  phone: string;
  password?: string;
  isFirstTime: boolean;
}

export type Language = 'pt' | 'en';
export type Theme = 'light' | 'dark';

export interface SourceAccount {
  id: string;
  name: string;
  balance: number;
}

export interface AppSettings {
  appName: string;
  currency: string;
  language: Language;
  theme: Theme;
  accounts: SourceAccount[];
  smsTemplates: {
    confirmation: string;
    debtReminder: string;
  };
}

export type ViewState = 'login' | 'forgot-password' | 'dashboard' | 'clients' | 'client-detail' | 'client-archive' | 'settings' | 'initial-balance';
