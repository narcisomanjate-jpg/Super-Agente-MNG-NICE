// ============================================
// COMPONENTE CARTAO DE VIDRO - GlassCard.tsx
// ============================================

import React from 'react';
import { hexToRgba } from '../../utils/helpers';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  isDark: boolean;
  border?: boolean;
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
  hoverEffect?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  backgroundColor?: string;
  borderColor?: string;
  opacity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  isDark,
  border = true,
  shadow = 'lg',
  hoverEffect = false,
  onClick,
  style = {},
  padding = 'md',
  rounded = '3xl',
  backgroundColor,
  borderColor,
  opacity = 0.6
}) => {
  // Mapeamento de classes Tailwind
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5 md:p-6',
    lg: 'p-6 md:p-8',
    xl: 'p-8 md:p-10'
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-[2rem]',
    '3xl': 'rounded-[3rem]',
    full: 'rounded-full'
  };

  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl'
  };

  // Estilos base para efeito glassmorphism
  const glassStyles: React.CSSProperties = {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    ...style
  };

  // Se for clicável, adicionar cursor pointer
  const cursorClass = onClick ? 'cursor-pointer active:scale-[0.98] transition-transform duration-150' : '';

  // Classe de hover
  const hoverClass = hoverEffect 
    ? (isDark 
        ? 'hover:bg-slate-800/50 hover:border-slate-600/50' 
        : 'hover:bg-white/70 hover:border-gray-200')
    : '';

  // Cor de fundo padrão baseada no tema
  const defaultBackground = isDark 
    ? `bg-slate-800/${opacity * 100}`
    : `bg-white/${opacity * 100}`;

  // Cor da borda padrão
  const defaultBorder = isDark 
    ? 'border-slate-700/50'
    : 'border-gray-100';

  return (
    <div
      className={`
        ${defaultBackground}
        ${border ? `border ${borderColor || defaultBorder}` : 'border-0'}
        ${roundedClasses[rounded]}
        ${shadowClasses[shadow]}
        ${paddingClasses[padding]}
        ${cursorClass}
        ${hoverClass}
        transition-all duration-300
        overflow-hidden
        glass-effect
        ${className}
      `}
      style={glassStyles}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
      
      {/* Efeito de brilho sutil */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-inherit">
        <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10 blur-3xl ${
          isDark ? 'bg-blue-500' : 'bg-blue-400'
        }`} />
        <div className={`absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-10 blur-3xl ${
          isDark ? 'bg-purple-500' : 'bg-purple-400'
        }`} />
      </div>
    </div>
  );
};

// Variante com gradiente
interface GradientGlassCardProps extends Omit<GlassCardProps, 'isDark' | 'backgroundColor'> {
  gradient: string;
  textColor?: 'light' | 'dark';
}

export const GradientGlassCard: React.FC<GradientGlassCardProps> = ({
  gradient,
  textColor = 'light',
  children,
  className = "",
  ...props
}) => {
  const isDark = textColor === 'light';
  
  return (
    <div
      className={`
        relative overflow-hidden
        ${props.rounded ? '' : 'rounded-3xl'}
        ${props.shadow === 'none' ? '' : 'shadow-2xl'}
        ${className}
      `}
      style={{
        background: gradient,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
      onClick={props.onClick}
    >
      {/* Overlay para melhor legibilidade do texto */}
      <div className={`absolute inset-0 ${
        isDark ? 'bg-black/20' : 'bg-white/20'
      }`} />
      
      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Efeitos de brilho */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16 blur-3xl" />
    </div>
  );
};

// Variante com imagem de fundo
interface ImageGlassCardProps extends Omit<GlassCardProps, 'isDark' | 'backgroundColor'> {
  imageUrl: string;
  overlayOpacity?: number;
  overlayColor?: string;
}

export const ImageGlassCard: React.FC<ImageGlassCardProps> = ({
  imageUrl,
  overlayOpacity = 0.3,
  overlayColor = '#000000',
  children,
  className = "",
  ...props
}) => {
  const rgbaOverlay = hexToRgba(overlayColor, overlayOpacity);
  
  return (
    <div
      className={`
        relative overflow-hidden bg-cover bg-center
        ${props.rounded ? '' : 'rounded-3xl'}
        ${props.shadow === 'none' ? '' : 'shadow-2xl'}
        ${className}
      `}
      style={{
        backgroundImage: `url('${imageUrl}')`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
      onClick={props.onClick}
    >
      {/* Overlay escuro para melhor legibilidade */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: rgbaOverlay }}
      />
      
      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Efeito de brilho nas bordas */}
      <div className="absolute inset-0 border-2 border-white/10 rounded-inherit pointer-events-none" />
    </div>
  );
};

// Variante para estatísticas
interface StatsGlassCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  isDark: boolean;
  onClick?: () => void;
}

export const StatsGlassCard: React.FC<StatsGlassCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = '#3b82f6',
  isDark,
  onClick
}) => {
  const rgbaColor = hexToRgba(color, 0.1);
  
  return (
    <GlassCard
      isDark={isDark}
      onClick={onClick}
      hoverEffect={!!onClick}
      className="relative overflow-hidden"
      style={{
        backgroundColor: rgbaColor,
        borderColor: hexToRgba(color, 0.2)
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {title}
          </p>
          
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-black ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {typeof value === 'number' ? value.toLocaleString('pt-MZ') : value}
            </p>
            
            {trend && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                trend.isPositive
                  ? 'bg-emerald-500/20 text-emerald-600'
                  : 'bg-rose-500/20 text-rose-600'
              }`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          
          {subtitle && (
            <p className={`text-sm mt-2 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        
        {icon && (
          <div 
            className="p-3 rounded-2xl flex-shrink-0"
            style={{ 
              backgroundColor: hexToRgba(color, 0.2),
              color: color
            }}
          >
            {icon}
          </div>
        )}
      </div>
      
      {/* Barra de progresso decorativa */}
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full">
        <div 
          className="h-full rounded-full transition-all duration-1000"
          style={{ 
            width: '100%',
            backgroundColor: hexToRgba(color, 0.3)
          }}
        />
      </div>
    </GlassCard>
  );
};

// Variante para ações rápidas
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  isDark: boolean;
  disabled?: boolean;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  color,
  onClick,
  isDark,
  disabled = false
}) => {
  return (
    <GlassCard
      isDark={isDark}
      onClick={disabled ? undefined : onClick}
      hoverEffect={!disabled}
      className={`
        text-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-300
        ${!disabled ? 'hover:scale-[1.02]' : ''}
      `}
      style={{
        backgroundColor: hexToRgba(color, 0.1),
        borderColor: hexToRgba(color, 0.2)
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div 
          className="p-4 rounded-3xl transition-transform duration-300"
          style={{ 
            backgroundColor: hexToRgba(color, 0.2),
            color: color
          }}
        >
          {React.cloneElement(icon as React.ReactElement, {
            className: 'w-8 h-8'
          })}
        </div>
        
        <div>
          <h3 className={`font-bold text-lg mb-1 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {title}
          </h3>
          <p className={`text-sm ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {description}
          </p>
        </div>
        
        {!disabled && (
          <div className="mt-2 w-8 h-1 rounded-full opacity-50" style={{ backgroundColor: color }} />
        )}
      </div>
      
      {/* Efeito de brilho ao passar o mouse */}
      {!disabled && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div 
            className="absolute inset-0 rounded-inherit blur-md"
            style={{ backgroundColor: hexToRgba(color, 0.1) }}
          />
        </div>
      )}
    </GlassCard>
  );
}; 
