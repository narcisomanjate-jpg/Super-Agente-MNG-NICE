import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Phone, 
  MessageSquare, 
  History, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownLeft,
  LogOut,
  ChevronLeft,
  Moon,
  Sun,
  Globe,
  Mail,
  User,
  ChevronDown,
  ChevronUp,
  Send,
  Edit2,
  Lock,
  Check,
  AlertCircle,
  Wallet,
  Coins,
  Trash2,
  FileCode,
  ClipboardCheck
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Types
export type PaymentMethod = string;

export interface Transaction {
  id: string;
  type: 'Inflow' | 'Outflow';
  amount: number;
  method: PaymentMethod;
  accountId: string;
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
  color?: string;
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

// Translations
const translations = {
  pt: {
    login_subtitle: "Gestão Financeira para Agentes em Moçambique",
    login_welcome_back: "Bem-vindo de volta",
    login_setup_title: "Configuração de Usuário",
    login_setup_subtitle: "Defina seus dados para começar",
    login_name: "Nome Completo",
    login_phone: "Telefone",
    login_pass: "Senha",
    login_btn_create: "Criar Conta",
    login_btn_signin: "Entrar",
    login_forgot: "Esqueceu a Senha?",
    login_error_pass: "Senha incorreta. Tente novamente.",
    initial_balance_title: "Balanço Inicial",
    initial_balance_desc: "Introduza o saldo actual de cada conta",
    initial_balance_confirm: "Confirmar Saldos",
    nav_home: "Início",
    nav_clients: "Clientes",
    nav_settings: "Ajustes",
    dash_greeting: "Bom dia",
    dash_chart_title: "Agregado Total (Últimos 7 Dias)",
    dash_recent: "Atividade Recente",
    client_balance_label: "Saldo Atual",
    settings_title: "Ajustes",
    settings_accounts: "Formas de Pagamento / Contas",
    settings_edit: "Editar Dados",
    settings_add_account: "Nova Forma de Pagamento",
    settings_appearance: "Aparência",
    modal_save: "Salvar",
    tx_inflow: "Entrada (Crédito)",
    tx_outflow: "Saída (Débito)",
  },
  en: {
    login_subtitle: "Financial Management for Agents in Mozambique",
    login_welcome_back: "Welcome back",
    login_setup_title: "User Setup",
    login_setup_subtitle: "Set your details to get started",
    login_name: "Full Name",
    login_phone: "Phone",
    login_pass: "Password",
    login_btn_create: "Create Account",
    login_btn_signin: "Sign In",
    login_forgot: "Forgot Password?",
    login_error_pass: "Incorrect password. Try again.",
    initial_balance_title: "Initial Balance",
    initial_balance_desc: "Enter the current balance of each account",
    initial_balance_confirm: "Confirm Balances",
    nav_home: "Home",
    nav_clients: "Clients",
    nav_settings: "Settings",
    dash_greeting: "Good morning",
    dash_chart_title: "Total Aggregate (Last 7 Days)",
    dash_recent: "Recent Activity",
    client_balance_label: "Current Balance",
    settings_title: "Settings",
    settings_accounts: "Payment Methods / Accounts",
    settings_edit: "Edit",
    settings_add_account: "New Payment Method",
    settings_appearance: "Appearance",
    modal_save: "Save",
    tx_inflow: "Inflow (Credit)",
    tx_outflow: "Outflow (Debit)",
  }
};

// LoginView
const LoginView = ({ isDark, t, settings, user, onLogin, onSetup }: any) => {
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (user.isFirstTime) {
      if (!name || !phone || !pass) return;
      onSetup(name, phone, pass);
    } else {
      if (pass === user.password) {
        onLogin();
      } else {
        setError(t.login_error_pass);
      }
    }
  };
  
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen px-8 ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-900'}`}>
      <div className="w-20 h-20 bg-blue-900 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
        <LayoutDashboard className="text-white w-10 h-10" />
      </div>
      <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-blue-900'} mb-2`}>
        {user.isFirstTime ? t.login_setup_title : settings.appName}
      </h1>
      <p className="text-gray-400 mb-10 text-center">
        {user.isFirstTime ? t.login_setup_subtitle : `${t.login_welcome_back}, ${user.name}`}
      </p>
      
      <div className="w-full space-y-4">
        {user.isFirstTime && (
          <>
            <input type="text" placeholder={t.login_name} className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-900 glass ${isDark ? 'bg-slate-800/60 text-white placeholder-slate-500' : 'bg-white/80 text-gray-900 placeholder-gray-400'}`} value={name} onChange={(e) => setName(e.target.value)} />
            <input type="tel" placeholder={t.login_phone} className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-900 glass ${isDark ? 'bg-slate-800/60 text-white placeholder-slate-500' : 'bg-white/80 text-gray-900 placeholder-gray-400'}`} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </>
        )}
        <input type="password" placeholder={t.login_pass} className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-900 glass ${isDark ? 'bg-slate-800/60 text-white placeholder-slate-500' : 'bg-white/80 text-gray-900 placeholder-gray-400'}`} value={pass} onChange={(e) => setPass(e.target.value)} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={handleSubmit} className="w-full bg-blue-900 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all">
          {user.isFirstTime ? t.login_btn_create : t.login_btn_signin}
        </button>
      </div>
    </div>
  );
};

// InitialBalanceView
const InitialBalanceView = ({ t, isDark, accounts, onConfirm }: any) => {
    const [balances, setBalances] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        accounts.forEach((acc: SourceAccount) => { initial[acc.id] = acc.balance || 0; });
        return initial;
    });
    const handleChange = (id: string, value: string) => { setBalances(prev => ({ ...prev, [id]: Number(value) || 0 })); };
    const handleSubmit = () => { onConfirm(balances); };

    return (
        <div className={`p-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <h1 className="text-3xl font-bold mb-4">{t.initial_balance_title}</h1>
            <p className="text-gray-400 mb-8">{t.initial_balance_desc}</p>
            <div className="space-y-4">
                {accounts.map((account: SourceAccount) => (
                    <div key={account.id} className={`flex items-center justify-between p-4 rounded-xl shadow-lg glass ${isDark ? 'bg-slate-800/60' : 'bg-white/80'}`}>
                        <div className="flex items-center">
                            <span className={`w-3 h-3 rounded-full ${account.color || 'bg-blue-600'} mr-4`}></span>
                            <span className="font-semibold">{account.name}</span>
                        </div>
                        <input type="number" value={balances[account.id]} onChange={(e) => handleChange(account.id, e.target.value)} className={`w-32 p-2 rounded-lg text-right border-none focus:ring-2 focus:ring-blue-900 ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-900'}`} min="0" />
                    </div>
                ))}
            </div>
            <button onClick={handleSubmit} className="w-full mt-10 bg-blue-900 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all">
                {t.initial_balance_confirm}
            </button>
        </div>
    );
};

// DashboardView
const DashboardView = ({ t, user, settings, onLogout }: any) => {
    const totalBalance = useMemo(() => settings.accounts.reduce((sum: number, acc: SourceAccount) => sum + acc.balance, 0), [settings.accounts]);

    const chartData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            data.push({
                name: `${day}/${month}`,
                Saldo: i === 0 ? totalBalance : Math.floor(Math.random() * 3000 + 2000)
            });
        }
        return data;
    }, [totalBalance]);

    const isDark = settings.theme === 'dark';

    return (
        <div className="p-4">
            <div className='flex justify-between items-center mb-4'>
                <h1 className="text-xl font-semibold">{t.dash_greeting}, {user.name}</h1>
                <button onClick={onLogout} className='p-2 rounded-full hover:bg-slate-700/50 transition-colors'>
                    <LogOut className='w-5 h-5 text-red-400' />
                </button>
            </div>
            
            <div className={`p-5 rounded-2xl shadow-xl mb-6 ${isDark ? 'bg-blue-900 text-white' : 'bg-blue-600 text-white'}`}>
                <p className="text-sm opacity-80">{t.client_balance_label}</p>
                <p className="text-4xl font-bold mt-1">{Math.floor(totalBalance)} {settings.currency}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                {settings.accounts.map((account: SourceAccount) => (
                    <div key={account.id} className={`p-3 rounded-xl shadow-lg glass ${isDark ? 'bg-slate-800/60' : 'bg-white/80'}`}>
                        <div className="flex items-center mb-2">
                            <span className={`w-2 h-2 rounded-full ${account.color || 'bg-blue-600'} mr-2`}></span>
                            <span className="text-xs font-semibold truncate">{account.name}</span>
                        </div>
                        <p className="text-lg font-bold">{Math.floor(account.balance)}</p>
                        <p className="text-xs opacity-60">{settings.currency}</p>
                    </div>
                ))}
            </div>

            <div className={`p-4 rounded-2xl mb-6 shadow-lg glass ${isDark ? 'bg-slate-800/60' : 'bg-white/80'}`}>
                <h2 className="font-semibold mb-3">{t.dash_chart_title}</h2>
                <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#475569' : '#e2e8f0'} />
                            <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} />
                            <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="Saldo" stroke={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <h2 className="font-semibold mb-3">{t.dash_recent}</h2>
            <div className={`p-4 rounded-2xl glass ${isDark ? 'bg-slate-800/60' : 'bg-white/80'}`}>
                <p className="text-gray-400">Nenhuma atividade recente encontrada.</p>
            </div>
        </div>
    );
};

// SettingsView
const SettingsView = ({ t, settings, onUpdateSettings, onBack }: any) => {
    const [isEditingAccounts, setIsEditingAccounts] = useState(false);
    const [accounts, setAccounts] = useState<SourceAccount[]>(settings.accounts);
    const [newAccountName, setNewAccountName] = useState('');
    const [selectedColor, setSelectedColor] = useState('bg-blue-600');

    const isDark = settings.theme === 'dark';

    const colors = [
        'bg-red-600', 'bg-orange-500', 'bg-blue-600', 'bg-green-600', 
        'bg-purple-600', 'bg-pink-600', 'bg-yellow-500', 'bg-indigo-600'
    ];

    const handleSaveAccounts = () => {
        onUpdateSettings({ ...settings, accounts });
        setIsEditingAccounts(false);
    };

    const handleAddAccount = () => {
        if (newAccountName.trim()) {
            const newAccount: SourceAccount = {
                id: Date.now().toString(),
                name: newAccountName,
                balance: 0,
                color: selectedColor
            };
            setAccounts([...accounts, newAccount]);
            setNewAccountName('');
            setSelectedColor('bg-blue-600');
        }
    };

    const handleDeleteAccount = (id: string) => {
        setAccounts(accounts.filter(acc => acc.id !== id));
    };

    const handleUpdateBalance = (id: string, newBalance: number) => {
        setAccounts(accounts.map(acc => 
            acc.id === id ? { ...acc, balance: newBalance } : acc
        ));
    };

    return (
        <div className="p-4">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors mr-3">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">{t.settings_title}</h1>
            </div>

            <div className={`p-4 rounded-2xl mb-6 shadow-lg glass ${isDark ? 'bg-slate-800/60' : 'bg-white/80'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold">{t.settings_accounts}</h2>
                    {!isEditingAccounts ? (
                        <button 
                            onClick={() => setIsEditingAccounts(true)}
                            className="text-blue-500 text-sm font-semibold flex items-center"
                        >
                            <Edit2 className="w-4 h-4 mr-1" />
                            {t.settings_edit}
                        </button>
                    ) : (
                        <button 
                            onClick={handleSaveAccounts}
                            className="text-green-500 text-sm font-semibold flex items-center"
                        >
                            <Check className="w-4 h-4 mr-1" />
                            {t.modal_save}
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {accounts.map((account) => (
                        <div key={account.id} className={`p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center flex-1">
                                    <span className={`w-3 h-3 rounded-full ${account.color || 'bg-blue-600'} mr-3`}></span>
                                    <span className="font-semibold">{account.name}</span>
                                </div>
                                {isEditingAccounts ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number"
                                            value={account.balance}
                                            onChange={(e) => handleUpdateBalance(account.id, Number(e.target.value) || 0)}
                                            className={`w-24 p-1 rounded text-right border-none focus:ring-2 focus:ring-blue-900 ${isDark ? 'bg-slate-600 text-white' : 'bg-white text-gray-900'}`}
                                        />
                                        <button 
                                            onClick={() => handleDeleteAccount(account.id)}
                                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="font-bold">{Math.floor(account.balance)} {settings.currency}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {isEditingAccounts && (
                    <div className={`mt-4 p-3 rounded-xl border-2 border-dashed ${isDark ? 'border-slate-600' : 'border-gray-300'}`}>
                        <h3 className="text-sm font-semibold mb-3">{t.settings_add_account}</h3>
                        <input 
                            type="text"
                            placeholder="Nome da conta"
                            value={newAccountName}
                            onChange={(e) => setNewAccountName(e.target.value)}
                            className={`w-full p-2 rounded-lg mb-3 border-none focus:ring-2 focus:ring-blue-900 ${isDark ? 'bg-slate-700 text-white placeholder-slate-500' : 'bg-white text-gray-900 placeholder-gray-400'}`}
                        />
                        <div className="flex gap-2 mb-3">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full ${color} ${selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`}
                                />
                            ))}
                        </div>
                        <button 
                            onClick={handleAddAccount}
                            className="w-full bg-blue-900 text-white p-2 rounded-lg font-semibold flex items-center justify-center"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar
                        </button>
                    </div>
                )}
            </div>

            <div className={`p-4 rounded-2xl shadow-lg glass ${isDark ? 'bg-slate-800/60' : 'bg-white/80'}`}>
                <h2 className="font-semibold mb-3">{t.settings_appearance}</h2>
                <p className="text-sm text-gray-400">Outras configurações em breve...</p>
            </div>
        </div>
    );
};

// BottomNavigation
const BottomNavigation = ({ view, setView, t, isDark }: any) => {
    const navItem = (targetView: ViewState, Icon: any, label: string) => (
        <button
            onClick={() => setView(targetView)}
            className={`flex flex-col items-center p-2 transition-colors ${
                view === targetView 
                ? 'text-blue-500 font-semibold' 
                : `${isDark ? 'text-gray-400' : 'text-gray-600'}`
            }`}
        >
            <Icon className="w-6 h-6" />
            <span className="text-xs mt-1">{label}</span>
        </button>
    );

    return (
        <div className={`fixed bottom-0 left-0 right-0 p-3 shadow-top safe-bottom ${isDark ? 'bg-slate-900/95 border-t border-slate-800' : 'bg-white/95 border-t border-gray-200'}`}>
            <div className="flex justify-around max-w-md mx-auto">
                {navItem('dashboard', LayoutDashboard, t.nav_home)}
                {navItem('clients', Users, t.nav_clients)}
                {navItem('settings', Settings, t.nav_settings)}
            </div>
        </div>
    );
};

// Main App
export default function App() {
  const [view, setView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('@MNG:view');
    const userSaved = localStorage.getItem('@MNG:user');
    const userProfile = userSaved ? JSON.parse(userSaved) : {isFirstTime: true};

    if (saved) {
        return saved as ViewState;
    } else if (!userProfile.isFirstTime) {
        return 'dashboard';
    }
    return 'login';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('@MNG:user');
    return saved ? JSON.parse(saved) : { name: '', phone: '', password: '', isFirstTime: true };
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('@MNG:settings');
    return saved ? JSON.parse(saved) : {
      appName: 'Super Agente MNG NICE',
      theme: 'dark' as Theme,
      language: 'pt' as Language,
      currency: 'MT',
      accounts: [
        { id: '1', name: 'M-Pesa', balance: 0, color: 'bg-red-600' },
        { id: '2', name: 'e-Mola', balance: 0, color: 'bg-orange-500' }
      ],
      smsTemplates: {
        confirmation: '',
        debtReminder: ''
      }
    };
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('@MNG:clients');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('@MNG:view', view); }, [view]);
  useEffect(() => { localStorage.setItem('@MNG:user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('@MNG:settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('@MNG:clients', JSON.stringify(clients)); }, [clients]);

  const t = (translations as any)[settings.language];
  const isDark = settings.theme === 'dark';

  const handleLogin = () => setView('dashboard');

  const handleSetup = (name: string, phone: string, pass: string) => {
    setUser({ name, phone, password: pass, isFirstTime: false });
    setView('initial-balance');
  };

  const handleConfirmBalances = (balances: Record<string, number>) => {
    setSettings(prev => ({
      ...prev,
      accounts: prev.accounts.map(account => ({ ...account, balance: balances[account.id] ?? account.balance }))
    }));
    setView('dashboard');
  };
  
  const handleLogout = () => {
    localStorage.removeItem('@MNG:user');
    localStorage.removeItem('@MNG:view');
    setView('login');
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const renderView = () => {
    switch (view) {
        case 'login':
            return <LoginView isDark={isDark} t={t} settings={settings} user={user} onLogin={handleLogin} onSetup={handleSetup} />;
        case 'initial-balance':
            return <InitialBalanceView t={t} isDark={isDark} accounts={settings.accounts} onConfirm={handleConfirmBalances} />;
        case 'dashboard':
            return <DashboardView t={t} user={user} settings={settings} onLogout={handleLogout} />;
        case 'settings':
            return <SettingsView t={t} settings={settings} onUpdateSettings={handleUpdateSettings} onBack={() => setView('dashboard')} />;
        case 'clients':
            return (
                <div className="p-4">
                    <h1 className="text-2xl font-bold mb-4">{t.nav_clients}</h1>
                    <p className="text-gray-400">Em breve...</p>
                </div>
            );
        default:
            return <DashboardView t={t} user={user} settings={settings} onLogout={handleLogout} />;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark text-white' : 'text-slate-900'} relative pb-24`}>
      <div className="fixed inset-0 bg-[#0f172a] -z-20" />
      
      {renderView()}

      {view !== 'login' && view !== 'initial-balance' && (
          <BottomNavigation view={view} setView={setView} t={t} isDark={isDark} />
      )}
    </div>
  );
}
