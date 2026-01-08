// ============================================
// STATUS DE CONEXÃO - ConnectionStatus.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudOff, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Shield,
  Database,
  Zap,
  Bell
} from 'lucide-react';
import { checkOnlineStatus, formatBytes } from '../../utils/helpers';

interface ConnectionStatusProps {
  isOnline?: boolean;
  isSyncing?: boolean;
  lastSync?: Date;
  hasError?: boolean;
  errorMessage?: string;
  syncProgress?: number;
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  autoHide?: boolean;
  onRetry?: () => void;
  storageInfo?: {
    used: number;
    total: number;
  };
  latency?: number;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline: externalIsOnline,
  isSyncing = false,
  lastSync,
  hasError = false,
  errorMessage,
  syncProgress = 0,
  showDetails = false,
  position = 'bottom-right',
  autoHide = true,
  onRetry,
  storageInfo,
  latency
}) => {
  const [internalIsOnline, setInternalIsOnline] = useState(navigator.onLine);
  const [isVisible, setIsVisible] = useState(true);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('');

  // Monitorar status da conexão
  useEffect(() => {
    const handleOnline = () => {
      setInternalIsOnline(true);
      setIsVisible(true);
      if (autoHide) {
        setTimeout(() => setIsVisible(false), 3000);
      }
    };

    const handleOffline = () => {
      setInternalIsOnline(false);
      setIsVisible(true);
    };

    // Detectar tipo de conexão
    if (navigator.connection) {
      setConnectionType(navigator.connection.effectiveType);
      navigator.connection.addEventListener('change', () => {
        setConnectionType(navigator.connection.effectiveType);
      });
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoHide]);

  // Auto-esconder se estiver tudo ok
  useEffect(() => {
    if (autoHide && internalIsOnline && !hasError && !isSyncing) {
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [internalIsOnline, hasError, isSyncing, autoHide]);

  const isOnline = externalIsOnline !== undefined ? externalIsOnline : internalIsOnline;

  const getStatusColor = () => {
    if (hasError) return 'bg-rose-500 border-rose-600';
    if (!isOnline) return 'bg-amber-500 border-amber-600';
    if (isSyncing) return 'bg-blue-500 border-blue-600';
    return 'bg-emerald-500 border-emerald-600';
  };

  const getStatusIcon = () => {
    if (hasError) return <AlertCircle className="w-4 h-4" />;
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (hasError) return 'Erro de Conexão';
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Sincronizando...';
    return 'Conectado';
  };

  const getConnectionQuality = () => {
    if (!isOnline) return 'offline';
    if (latency) {
      if (latency < 100) return 'excellent';
      if (latency < 300) return 'good';
      if (latency < 500) return 'fair';
      return 'poor';
    }
    if (connectionType) {
      if (connectionType.includes('4g')) return 'excellent';
      if (connectionType.includes('3g')) return 'good';
      if (connectionType.includes('2g')) return 'fair';
      return 'slow';
    }
    return 'unknown';
  };

  const getSuggestions = () => {
    if (!isOnline) {
      return [
        '🔌 Verifique sua conexão com a internet',
        '📡 Tente reconectar ao Wi-Fi ou dados móveis',
        '💾 O app continuará funcionando offline',
        '🔄 Suas alterações serão sincronizadas quando voltar'
      ];
    }
    if (hasError) {
      return [
        '🔑 Verifique suas credenciais do Firebase',
        '🔄 Tente sincronizar novamente em alguns minutos',
        '📱 Reinicie o app se o problema persistir',
        '📧 Entre em contato com o suporte se necessário'
      ];
    }
    if (isSyncing) {
      return [
        '⏳ Não feche o app durante a sincronização',
        '📶 Mantenha uma boa conexão com a internet',
        '💾 Seus dados estão sendo salvos em backup'
      ];
    }
    return [
      '✅ Tudo funcionando perfeitamente!',
      '⚡ Você está usando a versão mais recente',
      '🔒 Seus dados estão seguros e sincronizados'
    ];
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right': return 'top-4 right-4';
      case 'top-left': return 'top-4 left-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'center': return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      case 'bottom-right':
      default: return 'bottom-4 right-4';
    }
  };

  const renderConnectionQuality = () => {
    const quality = getConnectionQuality();
    const qualityConfig = {
      excellent: { color: '#10b981', label: 'Excelente', icon: '⚡' },
      good: { color: '#3b82f6', label: 'Boa', icon: '👍' },
      fair: { color: '#f59e0b', label: 'Razoável', icon: '⚠️' },
      poor: { color: '#ef4444', label: 'Fraca', icon: '🐌' },
      slow: { color: '#ef4444', label: 'Lenta', icon: '🐌' },
      offline: { color: '#6b7280', label: 'Offline', icon: '🔌' },
      unknown: { color: '#6b7280', label: 'Desconhecida', icon: '❓' }
    };

    const config = qualityConfig[quality] || qualityConfig.unknown;

    return (
      <div className="flex items-center gap-2 text-xs">
        <span>{config.icon}</span>
        <span style={{ color: config.color }} className="font-bold">
          {config.label}
        </span>
        {latency && quality !== 'offline' && (
          <span className="text-slate-400">({latency}ms)</span>
        )}
      </div>
    );
  };

  if (!isVisible && !hasError && isOnline && !isSyncing) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-40 animate-in fade-in slide-in-from-bottom-4`}>
      <div 
        className={`
          p-3 rounded-2xl shadow-2xl border 
          text-white transition-all duration-300
          ${getStatusColor()}
          ${showFullDetails ? 'w-80' : 'w-64'}
          cursor-pointer hover:scale-[1.02] active:scale-95
        `}
        onClick={() => setShowFullDetails(!showFullDetails)}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-xs font-bold">{getStatusText()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {isOnline && renderConnectionQuality()}
            <div className="text-xs opacity-70">
              {showFullDetails ? '▲' : '▼'}
            </div>
          </div>
        </div>

        {/* Última sincronização */}
        {lastSync && !isSyncing && !hasError && (
          <p className="text-[10px] opacity-80 mt-1">
            Última sinc: {lastSync.toLocaleTimeString('pt-MZ', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        )}

        {/* Progresso da sincronização */}
        {isSyncing && syncProgress > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span>Sincronizando dados...</span>
              <span>{Math.round(syncProgress)}%</span>
            </div>
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Mensagem de erro */}
        {hasError && errorMessage && (
          <p className="text-[10px] mt-1 font-medium">
            {errorMessage}
          </p>
        )}

        {/* Detalhes expandidos */}
        {showFullDetails && (
          <div className="mt-3 pt-3 border-t border-white/20 space-y-3">
            {/* Informações de rede */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                Status da Rede
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>{isOnline ? 'Segura' : 'Local'}</span>
                </div>
                {connectionType && (
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>{connectionType.toUpperCase()}</span>
                  </div>
                )}
                {storageInfo && (
                  <div className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    <span>{formatBytes(storageInfo.used)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sugestões */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">
                {hasError ? 'Solução' : 'Dicas'}
              </p>
              <ul className="space-y-1 text-[10px]">
                {getSuggestions().map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="opacity-70 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2">
              {onRetry && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry();
                  }}
                  className="flex-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 
                           rounded-lg text-xs font-bold transition-colors
                           flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Tentar Novamente
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 
                         rounded-lg text-xs font-bold transition-colors"
              >
                Ocultar
              </button>
            </div>
          </div>
        )}

        {/* Botão de ação rápida (quando recolhido) */}
        {!showFullDetails && onRetry && hasError && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="mt-2 w-full px-3 py-1.5 bg-white/20 hover:bg-white/30 
                     rounded-lg text-xs font-bold transition-colors
                     flex items-center justify-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Tentar Reconexão
          </button>
        )}
      </div>

      {/* Notificação de nova sincronização */}
      {!showFullDetails && isSyncing && syncProgress === 100 && (
        <div className="absolute -top-2 -right-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-white animate-bounce" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 
                          rounded-full animate-ping" />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente menor para status (apenas ícone)
export const MiniConnectionStatus: React.FC<{
  isOnline?: boolean;
  isSyncing?: boolean;
  hasError?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({
  isOnline: externalIsOnline,
  isSyncing = false,
  hasError = false,
  size = 'md'
}) => {
  const [internalIsOnline] = useState(navigator.onLine);
  const isOnline = externalIsOnline !== undefined ? externalIsOnline : internalIsOnline;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const getStatusColor = () => {
    if (hasError) return 'bg-rose-500';
    if (!isOnline) return 'bg-amber-500';
    if (isSyncing) return 'bg-blue-500 animate-pulse';
    return 'bg-emerald-500';
  };

  const getIcon = () => {
    if (hasError) return <AlertCircle className="w-1/2 h-1/2" />;
    if (!isOnline) return <WifiOff className="w-1/2 h-1/2" />;
    if (isSyncing) return <RefreshCw className="w-1/2 h-1/2 animate-spin" />;
    return <Cloud className="w-1/2 h-1/2" />;
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${getStatusColor()} 
        rounded-full 
        flex items-center justify-center
        text-white shadow-lg
        transition-all duration-300
        hover:scale-110 active:scale-95
      `}
      title={
        hasError ? 'Erro de conexão' :
        !isOnline ? 'Offline' :
        isSyncing ? 'Sincronizando' : 'Conectado'
      }
    >
      {getIcon()}
    </div>
  );
};

// Status para barra de status do sistema
export const SystemStatusBar: React.FC<{
  isOnline: boolean;
  isSyncing: boolean;
  batteryLevel?: number;
  time?: string;
}> = ({
  isOnline,
  isSyncing,
  batteryLevel,
  time = new Date().toLocaleTimeString('pt-MZ', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm 
                    text-white text-xs px-4 py-2 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3 text-amber-500" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        
        {isSyncing && (
          <div className="flex items-center gap-1 animate-pulse">
            <RefreshCw className="w-3 h-3" />
            <span>Sinc...</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <span>{time}</span>
        
        {batteryLevel !== undefined && (
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  batteryLevel > 50 ? 'bg-emerald-500' :
                  batteryLevel > 20 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${batteryLevel}%` }}
              />
            </div>
            <span className="text-[10px]">{batteryLevel}%</span>
          </div>
        )}
      </div>
    </div>
  );
}; 
