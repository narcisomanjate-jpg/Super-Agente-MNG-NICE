// ============================================
// UTILITÁRIOS GERAIS - helpers.ts
// ============================================

export const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const PRESET_COLORS = [
  '#3b82f6', '#f43f5e', '#10b981', '#f59e0b', 
  '#6366f1', '#a855f7', '#06b6d4', '#ec4899'
];

// Formatação de datas e horas
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-MZ', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Formatação de valores
export const formatCurrency = (amount: number, currency: string = 'MZN'): string => {
  return `${amount.toLocaleString('pt-MZ')} ${currency}`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString('pt-MZ');
};

// Validações
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Aceita formatos: 841234567, +258841234567, 258841234567
  const cleaned = phone.replace(/\s/g, '').replace('+', '');
  const regex = /^(258)?[0-9]{9}$/;
  return regex.test(cleaned);
};

// Geração de IDs e textos
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Funções de debounce (evitar múltiplas chamadas)
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Delay para simular carregamento (útil para testes)
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Calculadora de saldo
export const calculateBalance = (
  transactions: Array<{ type: 'Inflow' | 'Outflow'; amount: number }>
): number => {
  return transactions.reduce((total, tx) => {
    return tx.type === 'Inflow' ? total - tx.amount : total + tx.amount;
  }, 0);
};

// Sanitizar strings (remover caracteres especiais)
export const sanitizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim();
};

// Converter string para slug (URL amigável)
export const toSlug = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
};

// Verificar conexão com internet
export const checkOnlineStatus = (): boolean => {
  return navigator.onLine;
};

// Obter sistema operacional do usuário
export const getUserOS = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone')) return 'iOS';
  return 'Unknown';
};

// Verificar se é dispositivo móvel
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Formatar bytes para unidades legíveis
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Clonar objeto profundamente
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Mesclar objetos
export const mergeObjects = <T extends object>(...objects: T[]): T => {
  return objects.reduce((merged, obj) => ({ ...merged, ...obj }), {} as T);
};

// Verificar se objeto está vazio
export const isEmptyObject = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

// Capitalizar primeira letra
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Limitar texto com ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Gerar cor aleatória
export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Obter contraste de texto (preto/branco) para uma cor de fundo
export const getTextColorForBackground = (hexColor: string): string => {
  // Converter hex para RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calcular luminosidade (fórmula WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retornar preto para fundos claros, branco para fundos escuros
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};