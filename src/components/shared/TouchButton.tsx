// ============================================
// BOTÃO COM FEEDBACK TÁTIL - TouchButton.tsx
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { hexToRgba } from '../../utils/helpers';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  tactileFeedback?: boolean;
  rippleEffect?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  success?: boolean;
  error?: boolean;
  pulse?: boolean;
  gradient?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onLongPress?: () => void;
  longPressDelay?: number;
  vibration?: boolean;
  soundEffect?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  tactileFeedback = true,
  rippleEffect = true,
  icon,
  iconPosition = 'left',
  success = false,
  error = false,
  pulse = false,
  gradient = false,
  rounded = 'xl',
  shadow = 'lg',
  className = '',
  disabled,
  onClick,
  onLongPress,
  longPressDelay = 800,
  vibration = true,
  soundEffect = false,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRipple, setShowRipple] = useState<{x: number, y: number} | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext | null>(null);

  // Configurações de variantes
  const variantConfig = {
    primary: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      active: 'active:bg-blue-800',
      text: 'text-white',
      border: 'border-transparent',
      gradient: 'from-blue-600 to-purple-600'
    },
    secondary: {
      bg: 'bg-gray-200 dark:bg-gray-700',
      hover: 'hover:bg-gray-300 dark:hover:bg-gray-600',
      active: 'active:bg-gray-400 dark:active:bg-gray-500',
      text: 'text-gray-800 dark:text-gray-200',
      border: 'border-transparent',
      gradient: 'from-gray-600 to-gray-700'
    },
    danger: {
      bg: 'bg-rose-600',
      hover: 'hover:bg-rose-700',
      active: 'active:bg-rose-800',
      text: 'text-white',
      border: 'border-transparent',
      gradient: 'from-rose-600 to-pink-600'
    },
    success: {
      bg: 'bg-emerald-600',
      hover: 'hover:bg-emerald-700',
      active: 'active:bg-emerald-800',
      text: 'text-white',
      border: 'border-transparent',
      gradient: 'from-emerald-600 to-green-600'
    },
    warning: {
      bg: 'bg-amber-500',
      hover: 'hover:bg-amber-600',
      active: 'active:bg-amber-700',
      text: 'text-white',
      border: 'border-transparent',
      gradient: 'from-amber-500 to-orange-500'
    },
    ghost: {
      bg: 'bg-transparent',
      hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
      active: 'active:bg-gray-200 dark:active:bg-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
      gradient: 'from-gray-400 to-gray-500'
    },
    outline: {
      bg: 'bg-transparent',
      hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      active: 'active:bg-blue-100 dark:active:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-600 dark:border-blue-400',
      gradient: 'from-blue-500 to-blue-600'
    }
  };

  // Configurações de tamanho
  const sizeConfig = {
    xs: {
      padding: 'px-2 py-1',
      text: 'text-xs',
      icon: 'w-3 h-3',
      rounded: {
        sm: 'rounded',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        full: 'rounded-full'
      }
    },
    sm: {
      padding: 'px-3 py-2',
      text: 'text-sm',
      icon: 'w-4 h-4',
      rounded: {
        sm: 'rounded-md',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        xl: 'rounded-2xl',
        '2xl': 'rounded-3xl',
        full: 'rounded-full'
      }
    },
    md: {
      padding: 'px-4 py-3',
      text: 'text-base',
      icon: 'w-5 h-5',
      rounded: {
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-3xl',
        '2xl': 'rounded-[2rem]',
        full: 'rounded-full'
      }
    },
    lg: {
      padding: 'px-5 py-4',
      text: 'text-lg',
      icon: 'w-6 h-6',
      rounded: {
        sm: 'rounded-xl',
        md: 'rounded-2xl',
        lg: 'rounded-3xl',
        xl: 'rounded-[2rem]',
        '2xl': 'rounded-[2.5rem]',
        full: 'rounded-full'
      }
    },
    xl: {
      padding: 'px-6 py-5',
      text: 'text-xl',
      icon: 'w-7 h-7',
      rounded: {
        sm: 'rounded-2xl',
        md: 'rounded-3xl',
        lg: 'rounded-[2rem]',
        xl: 'rounded-[2.5rem]',
        '2xl': 'rounded-[3rem]',
        full: 'rounded-full'
      }
    }
  };

  // Configurações de sombra
  const shadowConfig = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl'
  };

  const config = variantConfig[variant];
  const sizeStyle = sizeConfig[size];
  const roundedClass = sizeStyle.rounded[rounded];

  // Efeito de som
  const playSound = (frequency: number, duration: number = 0.1) => {
    if (!soundEffect || !window.AudioContext) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.warn('Efeito de som não disponível:', error);
    }
  };

  // Efeito de vibração
  const triggerVibration = (pattern: number | number[]) => {
    if (vibration && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Iniciar pressionamento
  const handlePressStart = (event: React.MouseEvent | React.TouchEvent) => {
    if (disabled || loading) return;

    setIsPressed(true);
    document.body.classList.add('no-select');

    // Posição do ripple
    if (rippleEffect && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = 'touches' in event 
        ? event.touches[0].clientX - rect.left
        : event.clientX - rect.left;
      const y = 'touches' in event
        ? event.touches[0].clientY - rect.top
        : event.clientY - rect.top;
      
      setShowRipple({ x, y });
    }

    // Efeitos táteis
    if (tactileFeedback) {
      triggerVibration(50);
      playSound(200);
    }

    // Iniciar timer para long press
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true);
        triggerVibration([100, 50, 100]);
        playSound(300, 0.2);
        onLongPress();
      }, longPressDelay);
    }
  };

  // Finalizar pressionamento
  const handlePressEnd = () => {
    setIsPressed(false);
    setIsLongPressing(false);
    document.body.classList.remove('no-select');

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    // Remover ripple após animação
    if (showRipple) {
      setTimeout(() => setShowRipple(null), 600);
    }
  };

  // Clique
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled || isLongPressing) {
      e.preventDefault();
      return;
    }

    // Efeitos de feedback
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
      triggerVibration([50, 50, 50]);
      playSound(400);
    }

    if (error) {
      triggerVibration([100, 50, 100]);
      playSound(150);
    }

    if (onClick) onClick(e);
  };

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      className={`
        relative overflow-hidden transition-all duration-200
        font-bold flex items-center justify-center gap-2
        ${gradient ? `bg-gradient-to-r ${config.gradient}` : config.bg}
        ${config.hover}
        ${config.active}
        ${config.text}
        border ${config.border}
        ${sizeStyle.padding}
        ${sizeStyle.text}
        ${roundedClass}
        ${shadowConfig[shadow]}
        ${fullWidth ? 'w-full' : ''}
        ${tactileFeedback ? 'active-scale press-effect mobile-tap-highlight' : ''}
        ${isPressed ? 'scale-95 brightness-90' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${error ? 'input-error' : ''}
        ${showSuccess ? 'success-bounce' : ''}
        ${pulse ? 'pulse-attention' : ''}
        ${isLongPressing ? 'ring-2 ring-offset-2 ring-current' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      {...props}
    >
      {/* Efeito de ripple */}
      {rippleEffect && showRipple && !disabled && !loading && (
        <div
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: showRipple.x,
            top: showRipple.y,
            width: '1px',
            height: '1px',
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}

      {/* Efeito de sucesso */}
      {showSuccess && (
        <div className="absolute inset-0 bg-emerald-500/20 animate-ping rounded-inherit" />
      )}

      {/* Overlay de loading */}
      {loading && (
        <div className="absolute inset-0 bg-black/10 rounded-inherit flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Overlay de long press */}
      {isLongPressing && (
        <div className="absolute inset-0 bg-current/10 rounded-inherit flex items-center justify-center">
          <div className="text-xs font-bold">SOLTAR</div>
        </div>
      )}

      {/* Conteúdo */}
      <div className={`relative z-10 flex items-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {icon && iconPosition === 'left' && (
          <span className={sizeStyle.icon}>
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-full h-full'
            })}
          </span>
        )}
        
        {children}
        
        {icon && iconPosition === 'right' && (
          <span className={sizeStyle.icon}>
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-full h-full'
            })}
          </span>
        )}

        {/* Indicadores */}
        {success && !loading && (
          <span className="ml-1 text-xs animate-pulse">✅</span>
        )}
        {error && !loading && (
          <span className="ml-1 text-xs animate-pulse">⚠️</span>
        )}
      </div>

      {/* Indicador de long press progressivo */}
      {onLongPress && isPressed && !isLongPressing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-current/30 rounded-b-inherit overflow-hidden">
          <div
            className="h-full bg-current rounded-b-inherit transition-all duration-200"
            style={{
              width: `${Math.min(100, (Date.now() - (longPressTimer.current as any)?._idleStart || 0) / longPressDelay * 100)}%`
            }}
          />
        </div>
      )}
    </button>
  );
};

// Botão de Ação Flutuante (FAB)
export const FloatingActionButton: React.FC<Omit<TouchButtonProps, 'variant' | 'size'> & {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  extended?: boolean;
  label?: string;
}> = ({
  position = 'bottom-right',
  extended = false,
  label,
  className = '',
  children,
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40 animate-in fade-in slide-in-from-bottom-4`}>
      <TouchButton
        variant="primary"
        size="lg"
        rounded="full"
        shadow="2xl"
        gradient
        className={`
          ${extended ? 'px-6' : 'w-14 h-14 p-0'}
          shadow-2xl hover:shadow-3xl
          hover:scale-110 active:scale-95
          transition-all duration-300
          ${className}
        `}
        rippleEffect
        tactileFeedback
        vibration
        {...props}
      >
        <div className="flex items-center gap-2">
          {children}
          {extended && label && (
            <span className="font-bold text-sm ml-2">{label}</span>
          )}
        </div>
        
        {/* Efeito de brilho */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </TouchButton>
    </div>
  );
};

// Botão com confirmação
export const ConfirmButton: React.FC<TouchButtonProps & {
  confirmText?: string;
  onConfirm: () => void;
  confirmTimeout?: number;
  confirmVariant?: TouchButtonProps['variant'];
}> = ({
  confirmText = 'Clique novamente para confirmar',
  onConfirm,
  confirmTimeout = 3000,
  confirmVariant = 'danger',
  onClick,
  children,
  ...props
}) => {
  const [confirming, setConfirming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(confirmTimeout);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (confirming) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 100) {
            setConfirming(false);
            setTimeLeft(confirmTimeout);
            clearInterval(interval);
            return confirmTimeout;
          }
          return prev - 100;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [confirming, confirmTimeout]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!confirming) {
      setConfirming(true);
      setTimeLeft(confirmTimeout);
      
      if (onClick) onClick(e);
    } else {
      onConfirm();
      setConfirming(false);
      setTimeLeft(confirmTimeout);
    }
  };

  const progressPercentage = (timeLeft / confirmTimeout) * 100;

  return (
    <div className="relative">
      <TouchButton
        {...props}
        onClick={handleClick}
        variant={confirming ? confirmVariant : props.variant}
        className={`relative overflow-hidden ${props.className} ${confirming ? 'pulse-attention' : ''}`}
      >
        {confirming ? (
          <div className="flex flex-col items-center gap-1">
            <span>{confirmText}</span>
            <span className="text-xs opacity-70">
              ({Math.ceil(timeLeft / 1000)}s)
            </span>
          </div>
        ) : (
          children
        )}
      </TouchButton>

      {/* Barra de progresso para confirmação */}
      {confirming && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-current/20 rounded-b-inherit overflow-hidden">
          <div
            className="h-full bg-current rounded-b-inherit transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Grupo de botões
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}> = ({
  children,
  direction = 'horizontal',
  spacing = 'md',
  className = ''
}) => {
  const spacingClasses = {
    none: 'gap-0',
    sm: direction === 'horizontal' ? 'gap-1' : 'gap-1',
    md: direction === 'horizontal' ? 'gap-2' : 'gap-2',
    lg: direction === 'horizontal' ? 'gap-3' : 'gap-3'
  };

  const directionClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  };

  return (
    <div className={`
      flex ${directionClasses[direction]} ${spacingClasses[spacing]}
      ${className}
    `}>
      {children}
    </div>
  );
};

// Botão com badge
export const BadgeButton: React.FC<TouchButtonProps & {
  badge?: string | number;
  badgeColor?: string;
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}> = ({
  badge,
  badgeColor = '#ef4444',
  badgePosition = 'top-right',
  children,
  ...props
}) => {
  const positionClasses = {
    'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
    'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2'
  };

  return (
    <div className="relative inline-block">
      <TouchButton {...props}>
        {children}
      </TouchButton>
      
      {badge && (
        <div
          className={`
            absolute ${positionClasses[badgePosition]}
            min-w-5 h-5 px-1 flex items-center justify-center
            rounded-full text-xs font-bold text-white
            animate-pulse shadow-sm
          `}
          style={{ backgroundColor: badgeColor }}
        >
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </div>
      )}
    </div>
  );
};