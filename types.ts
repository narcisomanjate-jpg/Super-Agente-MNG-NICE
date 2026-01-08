
export type PaymentMethod = string;
export type Language = 'pt' | 'en';
export type Theme = 'light' | 'dark';
export type ViewState = 'login' | 'forgot-password' | 'dashboard' | 'clients' | 'client-detail' | 'client-archive' | 'settings';

export interface Transaction {
  id: string;
  type: 'Inflow' | 'Outflow';
  amount: number;
  method: PaymentMethod;
  date: string;
  dueDate: string;
  description: string;
  settled: boolean;
}

export interface ArchivedAccount {
  dateClosed: string;
  transactions: Transaction[];
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  activeAccount: Transaction[];
  archive: ArchivedAccount[];
}

export interface UserProfile {
  name: string;
  phone: string;
  password?: string;
  isFirstTime: boolean;
}

export interface UIConfig {
  primaryColor: string;
  transparency: number; // 0 a 1
}

export interface AppSettings {
  appName: string;
  currency: string;
  language: Language;
  theme: Theme;
  enabledAccounts: PaymentMethod[];
  accountColors: Record<string, string>;
  uiConfig: UIConfig;
  smsTemplates: {
    confirmation: string;
    debtReminder: string;
  };
}
