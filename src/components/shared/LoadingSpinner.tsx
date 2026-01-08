// ============================================
// COMPONENTE DE CARREGAMENTO - LoadingSpinner.tsx
// ============================================

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: string;
  message?: string;
  className?: string;
  fullScreen?: boolean;
  backdrop?: boolean;
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  showLogo?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = '#3b82f6',
  message,
  className = '',
  fullScreen = false,
  backdrop = true,
  type = 'spinner',
  showLogo = false
}) => {
  const sizeMap = {
    xs: { spinner: 'w-4 h-4 border-2', container: 'gap-1' },
    sm: { spinner: 'w-6 h-6 border-2', container: 'gap-2' },
    md: { spinner: 'w-8 h-8 border-3', container: 'gap-3' },
    lg: { spinner: 'w-12 h-12 border-3', container: 'gap-4' },
    xl: { spinner: 'w-16 h-16 border-4', container: 'gap-4' },
    '2xl': { spinner: 'w-20 h-20 border-4', container: 'gap-5' }
  };

  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`rounded-full animate-bounce`}
                style={{
                  width: size === 'xs' ? '6px' : 
                         size === 'sm' ? '8px' : 
                         size === 'md' ? '10px' : 
                         size === 'lg' ? '12px' : '14px',
                  height: size === 'xs' ? '6px' : 
                          size === 'sm' ? '8px' : 
                          size === 'md' ? '10px' : 
                          size === 'lg' ? '12px' : '14px',
                  backgroundColor: color,
                  animationDelay: `${i * 0.15}s`
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className="relative">
            <div
              className="rounded-full animate-ping absolute inset-0 opacity-75"
              style={{ backgroundColor: color }}
            />
            <div
              className="rounded-full"
              style={{
                width: size === 'xs' ? '24px' : 
                       size === 'sm' ? '32px' : 
                       size === 'md' ? '40px' : 
                       size === 'lg' ? '48px' : '56px',
                height: size === 'xs' ? '24px' : 
                        size === 'sm' ? '32px' : 
                        size === 'md' ? '40px' : 
                        size === 'lg' ? '48px' : '56px',
                backgroundColor: color
              }}
            />
          </div>
        );

      case 'skeleton':
        return (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full shimmer" style={{
              width: size === 'xs' ? '40px' : 
                     size === 'sm' ? '60px' : 
                     size === 'md' ? '80px' : 
                     size === 'lg' ? '100px' : '120px',
              height: size === 'xs' ? '40px' : 
                      size === 'sm' ? '60px' : 
                      size === 'md' ? '80px' : 
                      size === 'lg' ? '100px' : '120px',
              backgroundColor: '#e5e7eb'
            }} />
            {message && (
              <div className="h-4 w-24 shimmer rounded" style={{ backgroundColor: '#e5e7eb' }} />
            )}
          </div>
        );

      case 'spinner':
      default:
        return (
          <div 
            className={`${sizeMap[size].spinner} rounded-full animate-spin`}
            style={{ 
              borderColor: `${color} transparent transparent transparent` 
            }}
          />
        );
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${sizeMap[size].container} ${className}`}>
      {showLogo && (
        <div className="mb-4">
          <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Super Agente
          </div>
        </div>
      )}
      
      {renderSpinner()}
      
      {message && (
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 animate-pulse mb-1">
            {message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Por favor, aguarde...
          </p>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${
        backdrop ? 'bg-slate-950/80 backdrop-blur-sm' : ''
      }`}>
        {content}
      </div>
    );
  }

  return content;
};

// Loader de tela cheia com mais opções
interface FullScreenLoaderProps {
  message?: string;
  backgroundColor?: string;
  showProgress?: boolean;
  progress?: number;
  progressMessage?: string;
  logo?: React.ReactNode;
  onCancel?: () => void;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message = 'Carregando...',
  backgroundColor = 'bg-slate-950/80',
  showProgress = false,
  progress = 0,
  progressMessage,
  logo,
  onCancel
}) => {
  return (
    <div className={`fixed inset-0 ${backgroundColor} backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6`}>
      {logo && <div className="mb-8">{logo}</div>}
      
      <LoadingSpinner 
        size="lg" 
        message={message}
        className="mb-8"
      />
      
      {showProgress && (
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{progressMessage || 'Progresso'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-8 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Cancelar
        </button>
      )}
      
      {/* Dicas úteis enquanto carrega */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500 mb-2">Dica:</p>
        <p className="text-xs text-slate-400 animate-pulse">
          {getRandomTip()}
        </p>
      </div>
    </div>
  );
};

// Loader para seções específicas
interface SectionLoaderProps {
  type?: 'table' | 'cards' | 'list';
  count?: number;
  isDark?: boolean;
}

export const SectionLoader: React.FC<SectionLoaderProps> = ({
  type = 'cards',
  count = 3,
  isDark = false
}) => {
  const renderLoader = () => {
    const bgColor = isDark ? 'bg-slate-800' : 'bg-gray-100';
    
    switch (type) {
      case 'table':
        return (
          <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
              <div key={i} className={`${bgColor} rounded-xl animate-pulse`}>
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${bgColor} rounded-xl`} />
                    <div className="flex-1 space-y-2">
                      <div className={`h-4 ${bgColor} rounded w-3/4`} />
                      <div className={`h-3 ${bgColor} rounded w-1/2`} />
                    </div>
                    <div className={`w-20 h-8 ${bgColor} rounded-lg`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'list':
        return (
          <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className={`w-10 h-10 ${bgColor} rounded-full`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 ${bgColor} rounded w-2/3`} />
                  <div className={`h-3 ${bgColor} rounded w-1/3`} />
                </div>
              </div>
            ))}
          </div>
        );

      case 'cards':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(count)].map((_, i) => (
              <div key={i} className={`${bgColor} rounded-2xl animate-pulse`}>
                <div className="p-5 space-y-3">
                  <div className={`h-6 ${bgColor} rounded w-1/3`} />
                  <div className={`h-4 ${bgColor} rounded w-full`} />
                  <div className={`h-4 ${bgColor} rounded w-2/3`} />
                  <div className="flex items-center justify-between pt-4">
                    <div className={`w-20 h-8 ${bgColor} rounded-lg`} />
                    <div className={`w-8 h-8 ${bgColor} rounded-full`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return renderLoader();
};

// Loader para botões
interface ButtonLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'white' | 'current';
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  size = 'md',
  color = 'white'
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-2'
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={`${sizeClasses[size]} rounded-full animate-spin border-t-transparent`}
        style={{ 
          borderColor: color === 'white' 
            ? '#ffffff #ffffff #ffffff transparent' 
            : 'currentColor currentColor currentColor transparent'
        }}
      />
    </div>
  );
};

// Função para gerar dicas aleatórias
const getRandomTip = (): string => {
  const tips = [
    'Você pode arrastar clientes para reordenar a lista',
    'Use o atalho Ctrl+S para salvar rapidamente',
    'Toque longo em um cliente para ver opções rápidas',
    'Arraste para a direita para voltar à tela anterior',
    'Você pode personalizar as cores no menu Configurações',
    'Use a busca por voz pressionando o microfone',
    'O app funciona offline! Seus dados são salvos localmente',
    'Toque duas vezes em qualquer valor para editá-lo rapidamente',
    'Deslize para a esquerda em transações para excluí-las',
    'Você pode exportar seus dados para PDF ou Excel'
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
};

// Loader com animação de progresso
interface ProgressLoaderProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({
  value,
  max,
  label,
  showPercentage = true,
  color = '#3b82f6',
  size = 'md',
  animated = true
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs">
          {label && (
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="font-bold" style={{ color }}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`${heightClasses[size]} w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${animated ? 'shimmer' : ''}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            backgroundImage: animated 
              ? `linear-gradient(90deg, ${color}00, ${color}80, ${color}00)`
              : undefined
          }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{value.toLocaleString('pt-MZ')}</span>
        <span>{max.toLocaleString('pt-MZ')}</span>
      </div>
    </div>
  );
};