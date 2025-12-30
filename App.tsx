
import React, { useState, useMemo, useEffect } from 'react';
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
  LogOut,
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
  AppWindow,
  Archive
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Client, Transaction, UserProfile, AppSettings, ViewState, PaymentMethod, ArchivedAccount } from './types';
import { INITIAL_CLIENTS, INITIAL_SETTINGS, translations, ALL_AVAILABLE_ACCOUNTS } from './constants';

// --- Helper Functions ---
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const PRESET_COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#a855f7', '#06b6d4', '#ec4899'];

// --- Helper Components ---

const GlassCard: React.FC<{ children: React.ReactNode, className?: string, isDark: boolean }> = ({ children, className = "", isDark }) => (
  <div className={`rounded-3xl border shadow-sm transition-all overflow-hidden ${isDark ? 'bg-slate-800/40 border-slate-700/50 text-white' : 'bg-white/60 border-gray-100 text-gray-900'} glass ${className}`}>
    {children}
  </div>
);

// --- Modals ---

const EditClientModal: React.FC<{ isDark: boolean, t: any, client: Client, clients: Client[], onClose: () => void, onSave: (name: string, phone: string) => void, onDelete: () => void }> = ({ isDark, t, client, clients, onClose, onSave, onDelete }) => {
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

    onSave(trimmedName, trimmedPhone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'} w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>{t.client_edit}</h3>
          <button onClick={() => { if(window.confirm(t.confirm_delete)) onDelete(); }} className="text-rose-500 p-2 hover:bg-rose-500/10 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-bold">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <input type="text" placeholder={t.login_name} className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`} value={name} onChange={(e) => { setName(e.target.value); setError(null); }} />
          <input type="tel" placeholder={t.login_phone} className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`} value={phone} onChange={(e) => { setPhone(e.target.value); setError(null); }} />
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className={`flex-1 p-4 rounded-2xl font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>{t.tx_cancel}</button>
          <button onClick={handleSave} className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-transform">{t.modal_save}</button>
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
  onUpdate: (method: PaymentMethod, amount: number) => void
}> = ({ isDark, t, settings, onClose, onUpdate }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(settings.enabledAccounts[0] || 'Cash');
  const [type, setType] = useState<'Add' | 'Sub'>('Add');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'} w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
        <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-blue-900'}`}>Gestão de Float</h3>
        <div className="space-y-4 mb-8">
          <div className="flex gap-2">
            <button onClick={() => setType('Add')} className={`flex-1 p-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 ${type === 'Add' ? 'bg-emerald-600 text-white' : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100')}`}><Plus className="w-4 h-4" /> Adicionar</button>
            <button onClick={() => setType('Sub')} className={`flex-1 p-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 ${type === 'Sub' ? 'bg-rose-600 text-white' : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100')}`}><Minus className="w-4 h-4" /> Retirar</button>
          </div>
          <input type="number" placeholder="Valor" className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'}`} value={amount} onChange={e => setAmount(e.target.value)} />
          <select className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'}`} value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}>
            {settings.enabledAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
          </select>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className={`flex-1 p-4 rounded-2xl font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>{t.tx_cancel}</button>
          <button onClick={() => {
            const val = parseFloat(amount);
            if (!isNaN(val)) onUpdate(method, type === 'Add' ? val : -val);
            onClose();
          }} className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-transform">Confirmar</button>
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
  agentBalances: Record<PaymentMethod, number>
}> = ({ isDark, t, settings, showTransactionModal, selectedClient, clients, setClients, setShowTransactionModal, setShowSMSConfirmModal, agentBalances }) => {
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

    const newTx: Transaction = { 
      id: Math.random().toString(36).substring(2, 9), 
      type: showTransactionModal.type, 
      amount: amt, 
      method: formData.method, 
      date: formData.date, 
      dueDate: formData.date, 
      description: formData.desc, 
      settled: showTransactionModal.type === 'Inflow' 
    };

    const updatedClients = clients.map((c: Client) => c.id === selectedClient.id ? { ...c, activeAccount: [newTx, ...c.activeAccount] } : c);
    setClients(updatedClients);
    setShowTransactionModal({ show: false, type: null });
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
            <input type="number" placeholder="0.00" className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 text-lg font-bold ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'}`} value={formData.amount} onChange={e => { setFormData({ ...formData, amount: e.target.value }); setError(null); }} />
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
                    className={`p-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'text-white shadow-md' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-gray-50 text-gray-500 border-gray-100')}`} 
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
            <input type="date" className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 text-sm ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'}`} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">{t.tx_desc}</label>
            <input type="text" placeholder="Ex: Pagamento" className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 text-sm ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'}`} value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowTransactionModal({ show: false, type: null })} className={`flex-1 p-4 rounded-2xl font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>{t.tx_cancel}</button>
          <button onClick={handleSubmit} className={`flex-1 p-4 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-transform ${showTransactionModal.type === 'Inflow' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-rose-600 shadow-rose-600/20'}`}>{t.tx_confirm}</button>
        </div>
      </div>
    </div>
  );
};

// --- View Components ---

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
    const ptDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const enDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabels = settings.language === 'pt' ? ptDays : enDays;
    
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({
        day: dayLabels[d.getDay()],
        total: 0 
      });
    }
    return data;
  }, [settings.language]);

  const bgOpacity = settings.uiConfig.transparency;

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
          <button onClick={onOpenFloat} className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-transparent shadow-sm`} style={{ backgroundColor: hexToRgba(settings.uiConfig.primaryColor, 0.1), color: settings.uiConfig.primaryColor }}>
            <Wallet className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button onClick={() => setView('login')} className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${isDark ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-rose-50 text-rose-600 border border-rose-100 shadow-sm'}`}>
            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {settings.enabledAccounts.map((acc, idx) => {
          const balance = agentBalances[acc] || 0;
          const color = settings.accountColors[acc] || PRESET_COLORS[idx % PRESET_COLORS.length];
          return (
            <div key={acc} className={`p-4 md:p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden active:scale-95 transition-all min-h-[100px] flex flex-col justify-center`} style={{ backgroundColor: hexToRgba(color, bgOpacity) }}>
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
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 600}} dy={10} />
              <Tooltip 
                contentStyle={{backgroundColor: isDark ? '#0f172a' : '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                itemStyle={{color: settings.uiConfig.primaryColor, fontWeight: '800', fontSize: '12px'}}
              />
              <Line type="monotone" dataKey="total" stroke={settings.uiConfig.primaryColor} strokeWidth={3} dot={{r: 3, fill: settings.uiConfig.primaryColor, strokeWidth: 2, stroke: isDark ? '#0f172a' : '#fff'}} activeDot={{r: 6, strokeWidth: 0}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <section className="space-y-4">
        <h3 className={`font-extrabold text-[10px] md:text-sm uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.dash_recent}</h3>
        <div className="space-y-3">
          {clients.length === 0 ? (
            <div className="py-10 text-center opacity-30 italic font-medium text-sm">Nenhum cliente recente</div>
          ) : (
            clients.slice(0, 3).map((client) => (
              <div key={client.id} className={`p-3 md:p-4 rounded-3xl flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all ${isDark ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-white hover:bg-slate-50'} shadow-sm border ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`} onClick={() => { setSelectedClientId(client.id); setView('client-detail'); }}>
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                  <div className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-2xl flex items-center justify-center font-bold text-xs md:text-sm ${isDark ? 'bg-slate-700' : 'bg-blue-100'}`} style={{ color: settings.uiConfig.primaryColor }}>
                    {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className={`font-bold text-sm md:text-base truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{client.name}</p>
                    <p className="text-[10px] md:text-xs text-slate-500 font-medium truncate">{t.settings_acc_balance}: {getClientBalance(client).toLocaleString()} {settings.currency}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-slate-300 flex-shrink-0" />
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
  // Load initial states from LocalStorage or use defaults
  const [view, setView] = useState<ViewState>('login');
  
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('agent_user');
    return saved ? JSON.parse(saved) : { name: '', phone: '', password: '', isFirstTime: true };
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('agent_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('agent_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState<{ show: boolean, type: 'Inflow' | 'Outflow' | null }>({ show: false, type: null });
  const [showSMSConfirmModal, setShowSMSConfirmModal] = useState<{ show: boolean, tx: Transaction | null }>({ show: false, tx: null });
  const [showFloatModal, setShowFloatModal] = useState(false);
  const [isUserBoxOpen, setIsUserBoxOpen] = useState(false);
  const [isAccountsBoxOpen, setIsAccountsBoxOpen] = useState(false);
  const [isAppBoxOpen, setIsAppBoxOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [editingAccountColor, setEditingAccountColor] = useState<string | null>(null);
  
  const [manualFloatAdjustments, setManualFloatAdjustments] = useState<Record<PaymentMethod, number>>(() => {
    const saved = localStorage.getItem('agent_float');
    return saved ? JSON.parse(saved) : { 'Super M-pesa': 0, 'Super E-mola': 0, 'M-pesa': 0, 'E-mola': 0, 'Cash': 0 };
  });

  // Effects to persist state changes
  useEffect(() => { localStorage.setItem('agent_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('agent_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('agent_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('agent_float', JSON.stringify(manualFloatAdjustments)); }, [manualFloatAdjustments]);

  const t = translations[settings.language];
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

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

  const handleLogin = (formData: any) => {
    if (user.isFirstTime) {
      const selfClient: Client = {
        id: Math.random().toString(36).substring(2, 9),
        name: formData.name || 'Agente',
        phone: formData.phone || '',
        activeAccount: [],
        archive: []
      };
      setClients(prev => [...prev, selfClient]);
    }
    setUser(prev => ({ ...prev, ...formData, isFirstTime: false }));
    setView('dashboard');
  };

  const isAuthView = view === 'login' || view === 'forgot-password';

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-0 md:p-4 lg:p-8 transition-colors duration-500 ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <div className={`w-full h-full max-w-md md:max-w-lg md:h-[90vh] md:max-h-[1000px] md:rounded-[3.5rem] app-shadow flex flex-col transition-all overflow-hidden relative ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} border border-white/5`}>
        <main className="flex-1 overflow-y-auto relative no-scrollbar">
          {view === 'login' && (
            <div className="flex flex-col items-center justify-center min-h-full px-6 md:px-12 py-12 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl" style={{ backgroundColor: settings.uiConfig.primaryColor }}><LayoutDashboard className="text-white w-10 h-10 md:w-12 md:h-12" /></div>
              
              {!user.isFirstTime ? (
                <div className="text-center mb-10 animate-in slide-in-from-top-4 duration-500">
                   <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{user.name || 'Agente'}</h1>
                   <p className="text-slate-500 font-bold text-xs opacity-70 tracking-widest uppercase">{user.phone}</p>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-center">{settings.appName}</h1>
                  <p className="text-slate-500 font-medium mb-12 text-center text-xs md:text-sm px-4 max-w-[300px]">{t.login_subtitle}</p>
                </>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); const target = e.target as any; handleLogin({ name: target.name?.value || '', phone: target.phone?.value || '', password: target.password?.value || '' }); }} className="w-full space-y-4 max-w-[340px]">
                {user.isFirstTime && (
                  <>
                    <input name="name" type="text" placeholder={t.login_name} className={`w-full p-4 md:p-5 rounded-3xl border-none focus:ring-4 focus:ring-blue-600/20 text-base md:text-lg font-medium transition-all ${isDark ? 'bg-slate-800 text-white placeholder-slate-600' : 'bg-white text-slate-900 shadow-sm'}`} required />
                    <input name="phone" type="tel" placeholder={t.login_phone} className={`w-full p-4 md:p-5 rounded-3xl border-none focus:ring-4 focus:ring-blue-600/20 text-base md:text-lg font-medium transition-all ${isDark ? 'bg-slate-800 text-white placeholder-slate-600' : 'bg-white text-slate-900 shadow-sm'}`} required />
                  </>
                )}
                <input name="password" type="password" placeholder={t.login_pass} className={`w-full p-4 md:p-5 rounded-3xl border-none focus:ring-4 focus:ring-blue-600/20 text-base md:text-lg font-medium transition-all ${isDark ? 'bg-slate-800 text-white placeholder-slate-600' : 'bg-white text-slate-900 shadow-sm'}`} required />
                <button type="submit" className="w-full p-4 md:p-5 text-white rounded-3xl font-black text-base md:text-lg shadow-xl active:scale-95 transition-all mt-4 hover:brightness-110" style={{ backgroundColor: settings.uiConfig.primaryColor }}>{user.isFirstTime ? t.login_btn_create : t.login_btn_signin}</button>
              </form>
            </div>
          )}

          {view === 'dashboard' && <DashboardView isDark={isDark} t={t} user={user} settings={settings} clients={clients} getClientBalance={getClientBalance} setView={setView} setSelectedClientId={setSelectedClientId} agentBalances={agentBalances} onOpenFloat={() => setShowFloatModal(true)} />}
          
          {view === 'clients' && (
            <div className="p-6 pb-24 space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.nav_clients}</h2>
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" placeholder={t.client_search} className={`w-full pl-12 pr-5 py-3 rounded-2xl border-none focus:ring-2 shadow-sm transition-all ${isDark ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-white text-slate-900'}`} style={{ "--tw-ring-color": settings.uiConfig.primaryColor } as any} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-3">
                {filteredClients.length > 0 ? (
                  filteredClients.map(client => {
                    const balance = getClientBalance(client);
                    return (
                      <div key={client.id} className={`p-4 md:p-5 rounded-[2rem] shadow-sm border flex justify-between items-center active:scale-[0.98] transition-all cursor-pointer ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 hover:bg-slate-50'}`} onClick={() => { setSelectedClientId(client.id); setView('client-detail'); }}>
                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                          <div className={`w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg ${isDark ? 'bg-slate-700' : 'bg-blue-100'}`} style={{ color: settings.uiConfig.primaryColor }}>{client.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
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
                      className={`w-full p-8 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all active:scale-95 ${isDark ? 'border-slate-800 bg-slate-800/20 text-slate-400' : 'border-slate-200 bg-white text-slate-500'}`}
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
              <button onClick={() => setShowAddClient(true)} className="fixed bottom-28 right-8 md:right-12 w-14 h-14 md:w-16 md:h-16 text-white rounded-3xl shadow-2xl flex items-center justify-center active:scale-90 transition-all z-10 hover:brightness-110" style={{ backgroundColor: settings.uiConfig.primaryColor }}><Plus className="w-7 h-7 md:w-8 md:h-8" /></button>
            </div>
          )}

          {view === 'client-detail' && selectedClient && (
             <div className="min-h-full flex flex-col animate-in slide-in-from-right-10 duration-500 no-scrollbar">
                <div className="p-8 pt-12 pb-12 rounded-b-[3.5rem] text-white relative shadow-2xl" style={{ backgroundColor: settings.uiConfig.primaryColor }}>
                  <button onClick={() => setView('clients')} className="absolute left-6 top-12 p-2 md:p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <button onClick={() => setShowEditClient(true)} className="absolute right-6 top-12 p-2 md:p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><Edit2 className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <div className="flex flex-col items-center mt-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white/15 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center text-3xl md:text-4xl font-black mb-4">{selectedClient.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-center px-4">{selectedClient.name}</h2>
                    <p className="opacity-70 text-xs md:text-sm font-bold mt-1">{selectedClient.phone}</p>
                    <div className="grid grid-cols-4 gap-2 md:gap-4 w-full px-2 md:px-4 mt-8">
                      {[{icon: <Phone />, label: 'Ligar', action: () => window.location.href=`tel:${selectedClient.phone}`}, {icon: <MessageSquare />, label: 'Cobrar', action: () => { const bal = getClientBalance(selectedClient); const text = settings.smsTemplates.debtReminder.replace('{amount}', bal.toString()).replace('{currency}', settings.currency); window.location.href = `sms:${selectedClient.phone}?body=${encodeURIComponent(text)}`; }}, {icon: <History />, label: 'Arquivo', action: () => setView('client-archive')}, {icon: <Trash2 />, label: 'Fechar', action: () => { if(getClientBalance(selectedClient) !== 0) { alert("Saldo deve ser zero para arquivar."); return; } setClients(clients.map(c => c.id === selectedClient.id ? {...c, archive: [{dateClosed: new Date().toISOString(), transactions: c.activeAccount}, ...c.archive], activeAccount: []} : c)); }}].map((btn, i) => (
                        <button key={i} onClick={btn.action} className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 md:w-14 md:h-14 bg-white/15 rounded-2xl flex items-center justify-center text-white shadow-xl group-active:scale-90 transition-all">
                          {React.cloneElement(btn.icon as React.ReactElement<any>, { className: 'w-5 h-5 md:w-6 md:h-6' })}
                        </div><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-80">{btn.label}</span></button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1 px-4 md:px-6 pt-10 pb-32 space-y-6">
                   <div className="flex justify-between items-end">
                      <h3 className={`font-black uppercase tracking-widest text-[10px] md:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.client_active_ledger}</h3>
                      <div className="text-right"><p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">{t.client_debt}</p><p className={`text-2xl md:text-3xl font-black ${getClientBalance(selectedClient) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{getClientBalance(selectedClient).toLocaleString()} <span className="text-xs font-bold">{settings.currency}</span></p></div>
                   </div>
                   {selectedClient.activeAccount.length === 0 ? <div className="py-20 flex flex-col items-center justify-center opacity-40"><LayoutDashboard className="w-14 h-14 md:w-16 md:h-16 mb-4" /><p className="font-bold text-sm">Nenhum lançamento</p></div> : (
                     <div className="space-y-3">
                        {selectedClient.activeAccount.map(tx => (
                          <div key={tx.id} className={`p-4 rounded-[2rem] border shadow-sm flex items-center justify-between transition-all ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                             <div className="flex items-center gap-3 md:gap-4 overflow-hidden"><div className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-2xl flex items-center justify-center ${tx.type === 'Inflow' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{tx.type === 'Inflow' ? <ArrowDownLeft className="w-5 h-5 md:w-6 md:h-6" /> : <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />}</div><div className="overflow-hidden"><p className={`font-black text-xs md:text-sm uppercase truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{tx.description || tx.type}</p><p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate">{tx.method} • {new Date(tx.date).toLocaleDateString()}</p></div></div>
                             <div className="text-right flex-shrink-0 ml-2"><p className={`font-black text-sm md:text-base ${tx.type === 'Inflow' ? 'text-emerald-500' : 'text-rose-500'}`}>{tx.type === 'Inflow' ? '+' : '-'}{tx.amount.toLocaleString()}</p></div>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
                <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-12 md:bottom-32 md:flex-col md:w-auto md:gap-4 flex gap-3 z-10">
                  <button onClick={() => setShowTransactionModal({ show: true, type: 'Outflow' })} className="bg-rose-600 text-white p-4 md:p-5 rounded-[2rem] font-black text-sm md:text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 flex-1 md:flex-none md:min-w-[140px]"><Plus className="w-5 h-5 md:w-6 md:h-6" /> SAÍDA</button>
                  <button onClick={() => setShowTransactionModal({ show: true, type: 'Inflow' })} className="bg-emerald-600 text-white p-4 md:p-5 rounded-[2rem] font-black text-sm md:text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 flex-1 md:flex-none md:min-w-[140px]"><Plus className="w-5 h-5 md:w-6 md:h-6" /> ENTRADA</button>
                </div>
             </div>
          )}

          {view === 'client-archive' && selectedClient && (
            <div className="min-h-full flex flex-col animate-in slide-in-from-right-10 duration-500 no-scrollbar">
              <div className="p-8 pt-12 pb-6 flex items-center gap-4">
                <button onClick={() => setView('client-detail')} className={`p-3 rounded-2xl transition-all ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white border border-slate-100 text-slate-600 shadow-sm'}`}><ChevronLeft className="w-6 h-6" /></button>
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
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {t.archive_date}: {new Date(archive.dateClosed).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-3">
                        {archive.transactions.map(tx => (
                          <div key={tx.id} className={`p-4 rounded-3xl border shadow-sm flex items-center justify-between opacity-80 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-50'}`}>
                             <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'Inflow' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                 {tx.type === 'Inflow' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                               </div>
                               <div>
                                 <p className={`font-black text-xs uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{tx.description || tx.type}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase">{tx.method} • {new Date(tx.date).toLocaleDateString()}</p>
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
               
               {/* App Management Section */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Aplicativo</h3>
                  <button onClick={() => setIsAppBoxOpen(!isAppBoxOpen)} className={`w-full flex items-center justify-between p-5 md:p-6 rounded-[2.5rem] shadow-sm border transition-all ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-4"><div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600"><AppWindow className="w-5 h-5 md:w-6 md:h-6" /></div><div className="text-left overflow-hidden"><p className="font-black text-base md:text-lg truncate">{settings.appName}</p><p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-tight">Personalize seu sistema</p></div></div>
                    {isAppBoxOpen ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                  </button>
                  {isAppBoxOpen && (
                    <GlassCard isDark={isDark} className="p-5 md:p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t.app_name_label}</label><input type="text" className={`w-full p-4 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} value={settings.appName} onChange={(e) => setSettings({...settings, appName: e.target.value})} /></div>
                    </GlassCard>
                  )}
               </section>

               {/* User Profile Section */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">{t.settings_user_profile}</h3>
                  <button onClick={() => setIsUserBoxOpen(!isUserBoxOpen)} className={`w-full flex items-center justify-between p-5 md:p-6 rounded-[2.5rem] shadow-sm border transition-all ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-4"><div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><UserIcon className="w-5 h-5 md:w-6 md:h-6" /></div><div className="text-left overflow-hidden max-w-[180px] md:max-w-xs"><p className="font-black text-base md:text-lg truncate">{user.name || 'Agente'}</p><p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-tight truncate">{user.phone}</p></div></div>
                    {isUserBoxOpen ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                  </button>
                  {isUserBoxOpen && (
                    <GlassCard isDark={isDark} className="p-5 md:p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t.login_name}</label><input type="text" className={`w-full p-4 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} value={user.name} onChange={(e) => setUser({...user, name: e.target.value})} /></div>
                        <div><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t.login_phone}</label><input type="tel" className={`w-full p-4 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} value={user.phone} onChange={(e) => setUser({...user, phone: e.target.value})} /></div>
                        <div><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t.login_pass}</label><input type="password" placeholder="••••••••" className={`w-full p-4 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} value={user.password || ''} onChange={(e) => setUser({...user, password: e.target.value})} /></div>
                    </GlassCard>
                  )}
               </section>

               {/* Dynamic Accounts Management Section */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">{t.settings_accounts}</h3>
                  <button onClick={() => setIsAccountsBoxOpen(!isAccountsBoxOpen)} className={`w-full flex items-center justify-between p-5 md:p-6 rounded-[2.5rem] shadow-sm border transition-all ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600"><CreditCard className="w-5 h-5 md:w-6 md:h-6" /></div>
                      <div className="text-left">
                        <p className="font-black text-base md:text-lg">Contas Disponíveis</p>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-tight">{settings.enabledAccounts.length} activas</p>
                      </div>
                    </div>
                    {isAccountsBoxOpen ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                  </button>
                  {isAccountsBoxOpen && (
                    <GlassCard isDark={isDark} className="p-5 md:p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                           {settings.enabledAccounts.map((acc, idx) => {
                             const accColor = settings.accountColors[acc] || settings.uiConfig.primaryColor;
                             const isEditingColor = editingAccountColor === acc;
                             return (
                               <div key={`${acc}-${idx}`} className="space-y-3">
                                 <div className={`flex items-center justify-between p-3 rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                                    <div className="flex items-center gap-3">
                                       <button 
                                          onClick={() => setEditingAccountColor(isEditingColor ? null : acc)} 
                                          className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm flex items-center justify-center transition-transform active:scale-90" 
                                          style={{ backgroundColor: accColor }}
                                       >
                                         <Palette className="w-4 h-4 text-white opacity-80" />
                                       </button>
                                       <span className="font-bold text-xs md:text-sm uppercase truncate max-w-[120px] md:max-w-xs">{acc}</span>
                                    </div>
                                    <button onClick={() => {
                                      if (settings.enabledAccounts.length <= 1) { alert("Mantenha ao menos uma conta activa."); return; }
                                      setSettings({...settings, enabledAccounts: settings.enabledAccounts.filter(a => a !== acc)});
                                    }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                                          className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-all hover:scale-110 ${accColor === c ? 'border-white' : 'border-transparent'}`} 
                                          style={{ backgroundColor: c }}
                                        />
                                      ))}
                                   </div>
                                 )}
                               </div>
                             );
                           })}
                        </div>
                        <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                           <input 
                              type="text" 
                              placeholder="Ex: Paypal" 
                              className={`flex-1 p-3 md:p-4 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} 
                              value={newAccName}
                              onChange={(e) => setNewAccName(e.target.value)}
                           />
                           <button 
                             onClick={() => {
                               if(!newAccName.trim()) return;
                               const trimmed = newAccName.trim();
                               if(settings.enabledAccounts.includes(trimmed)) { alert("Conta já existe."); return; }
                               setSettings({
                                 ...settings, 
                                 enabledAccounts: [...settings.enabledAccounts, trimmed],
                                 accountColors: { ...settings.accountColors, [trimmed]: settings.uiConfig.primaryColor }
                               });
                               setNewAccName('');
                             }} 
                             className="p-3 md:p-4 text-white rounded-2xl shadow-lg active:scale-95 transition-all hover:brightness-110"
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
                          <button key={c} onClick={() => setSettings({...settings, uiConfig: {...settings.uiConfig, primaryColor: c}})} className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all hover:scale-110 ${settings.uiConfig.primaryColor === c ? 'border-white' : 'border-transparent shadow-md'}`} style={{ backgroundColor: c }}>
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
                      <input type="range" min="0" max="1" step="0.05" className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" value={settings.uiConfig.transparency} onChange={(e) => setSettings({...settings, uiConfig: {...settings.uiConfig, transparency: parseFloat(e.target.value)}})} />
                    </div>
                  </div>
               </section>

               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">{t.settings_sms}</h3>
                  <div className={`p-5 md:p-6 rounded-[2.5rem] shadow-sm border space-y-6 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                    <div>
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Confirmação</label>
                      <textarea className={`w-full p-4 rounded-2xl text-[11px] md:text-xs font-bold border-none focus:ring-2 focus:ring-blue-600 transition-all ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100'}`} rows={3} value={settings.smsTemplates.confirmation} onChange={(e) => setSettings({...settings, smsTemplates: {...settings.smsTemplates, confirmation: e.target.value}})} />
                    </div>
                    <div>
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Cobrança</label>
                      <textarea className={`w-full p-4 rounded-2xl text-[11px] md:text-xs font-bold border-none focus:ring-2 focus:ring-blue-600 transition-all ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100'}`} rows={3} value={settings.smsTemplates.debtReminder} onChange={(e) => setSettings({...settings, smsTemplates: {...settings.smsTemplates, debtReminder: e.target.value}})} />
                    </div>
                  </div>
               </section>

               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">{t.settings_appearance}</h3>
                  <div className={`p-5 md:p-6 rounded-[2.5rem] shadow-sm border space-y-6 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">{isDark ? <Moon className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /> : <Sun className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />}<span className="font-extrabold text-xs md:text-sm">{t.settings_darkmode}</span></div>
                      <button onClick={() => setSettings({...settings, theme: isDark ? 'light' : 'dark'})} className={`w-12 h-7 md:w-14 md:h-8 rounded-full transition-all relative ${isDark ? 'bg-blue-600' : 'bg-slate-200'}`} style={{ backgroundColor: isDark ? settings.uiConfig.primaryColor : undefined }}><div className={`absolute top-1 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full transition-all shadow-md ${isDark ? 'left-6 md:left-7' : 'left-1'}`} /></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4"><Globe className="w-5 h-5 md:w-6 md:h-6 text-blue-500" /><span className="font-extrabold text-xs md:text-sm">{t.settings_language}</span></div>
                      <button onClick={() => setSettings({...settings, language: settings.language === 'pt' ? 'en' : 'pt'})} className={`px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>{settings.language === 'pt' ? 'Português' : 'English'}</button>
                    </div>
                  </div>
               </section>

               <button onClick={() => setView('login')} className="w-full p-5 md:p-6 bg-rose-500/10 text-rose-500 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] md:text-xs flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-rose-500/20"><LogOut className="w-5 h-5" /> {t.settings_logout}</button>
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

        {showFloatModal && <FloatManagementModal isDark={isDark} t={t} settings={settings} onClose={() => setShowFloatModal(false)} onUpdate={(m, a) => setManualFloatAdjustments(prev => ({ ...prev, [m]: (prev[m] || 0) + a }))} />}
        {showAddClient && <AddClientModal isDark={isDark} t={t} clients={clients} setShowAddClient={setShowAddClient} initialSearch={searchQuery} handleSaveNewClient={(n, p) => { setClients([...clients, { id: Math.random().toString(36).substring(2, 9), name: n, phone: p, activeAccount: [], archive: [] }]); setShowAddClient(false); setSearchQuery(''); }} />}
        {showEditClient && selectedClient && <EditClientModal isDark={isDark} t={t} client={selectedClient} clients={clients} onClose={() => setShowEditClient(false)} onSave={(n, p) => { setClients(clients.map(c => c.id === selectedClient.id ? {...c, name: n, phone: p} : c)); setShowEditClient(false); }} onDelete={() => { setClients(clients.filter(c => c.id !== selectedClient.id)); setShowEditClient(false); setView('clients'); }} />}
        {showTransactionModal.show && <TransactionModal isDark={isDark} t={t} settings={settings} showTransactionModal={showTransactionModal} selectedClient={selectedClient} clients={clients} setClients={setClients} setShowTransactionModal={setShowTransactionModal} setShowSMSConfirmModal={setShowSMSConfirmModal} agentBalances={agentBalances} />}
        {showSMSConfirmModal.show && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-lg">
             <div className={`${isDark ? 'bg-slate-900 border border-white/5' : 'bg-white'} w-full max-w-[340px] rounded-[3.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
                <div className="w-16 h-16 bg-blue-100/50 dark:bg-blue-500/20 rounded-3xl flex items-center justify-center text-blue-600 mb-6 mx-auto"><Send className="w-8 h-8" /></div>
                <h3 className="text-xl font-black text-center mb-2">{t.sms_confirm_prompt}</h3>
                <p className="text-[11px] text-slate-500 font-bold text-center mb-8 px-2 leading-relaxed opacity-70">{settings.smsTemplates.confirmation.replace('{amount}', showSMSConfirmModal.tx?.amount.toLocaleString() || '0').replace('{currency}', settings.currency).replace('{desc}', showSMSConfirmModal.tx?.description || '')}</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowSMSConfirmModal({ show: false, tx: null })} className={`flex-1 p-4 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all hover:brightness-95 ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{t.tx_cancel}</button>
                  <button onClick={() => { if(selectedClient && showSMSConfirmModal.tx) { const text = settings.smsTemplates.confirmation.replace('{amount}', showSMSConfirmModal.tx.amount.toString()).replace('{currency}', settings.currency).replace('{desc}', showSMSConfirmModal.tx.description || showSMSConfirmModal.tx.type); window.location.href = `sms:${selectedClient.phone}?body=${encodeURIComponent(text)}`; } setShowSMSConfirmModal({ show: false, tx: null }); }} className="flex-1 p-4 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl active:scale-95 transition-all hover:brightness-110" style={{ backgroundColor: settings.uiConfig.primaryColor }}>{t.sms_confirm_btn}</button>
                </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

const AddClientModal: React.FC<{ isDark: boolean, t: any, clients: Client[], setShowAddClient: (s: boolean) => void, handleSaveNewClient: (n: string, p: string) => void, initialSearch: string }> = ({ isDark, t, clients, setShowAddClient, handleSaveNewClient, initialSearch }) => {
  const isPhone = initialSearch && /^[0-9+]+$/.test(initialSearch);
  const [newName, setNewName] = useState(!isPhone ? initialSearch : '');
  const [newPhone, setNewPhone] = useState(isPhone ? initialSearch : '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const trimmedName = newName.trim();
    const trimmedPhone = newPhone.trim();

    if (!trimmedName || !trimmedPhone) {
      setError("Preencha todos os campos.");
      return;
    }

    const isDuplicate = clients.some(c => 
      c.name.toLowerCase() === trimmedName.toLowerCase() || 
      c.phone === trimmedPhone
    );

    if (isDuplicate) {
      setError("Já existe um cliente com este nome ou número.");
      return;
    }

    handleSaveNewClient(trimmedName, trimmedPhone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-slate-900 border border-white/5' : 'bg-white'} w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
        <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-blue-900'}`}>{t.client_new}</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-bold">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <input type="text" placeholder={t.login_name} className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 transition-all ${isDark ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`} value={newName} onChange={(e) => { setNewName(e.target.value); setError(null); }} />
          <input type="tel" placeholder={t.login_phone + " (+258)"} className={`w-full p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 transition-all ${isDark ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`} value={newPhone} onChange={(e) => { setNewPhone(e.target.value); setError(null); }} />
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowAddClient(false)} className={`flex-1 p-4 rounded-2xl font-bold transition-all ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>{t.tx_cancel}</button>
          <button onClick={handleSave} className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all hover:brightness-110">{t.modal_save}</button>
        </div>
      </div>
    </div>
  );
};

export default App;
