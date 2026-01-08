// ============================================
// MODAL ADICIONAR CLIENTE - AddClientModal.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  X, 
  AlertCircle, 
  Smartphone,
  User,
  Check
} from 'lucide-react';
import { TouchButton } from '../shared/TouchButton';
import { validatePhone } from '../../utils/helpers';

interface AddClientModalProps {
  isDark: boolean;
  clients: Array<{ name: string; phone: string }>;
  onClose: () => void;
  onSave: (name: string, phone: string) => Promise<void>;
  initialName?: string;
  onCreateAutomaticBackup: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isDark,
  clients,
  onClose,
  onSave,
  initialName = '',
  onCreateAutomaticBackup
}) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phoneSuggestions, setPhoneSuggestions] = useState<string[]>([]);

  // Gerar sugestões de número baseado em clientes existentes
  useEffect(() => {
    if (phone.length >= 2) {
      const suggestions = clients
        .map(c => c.phone)
        .filter(p => p.includes(phone) && p !== phone)
        .slice(0, 3);
      setPhoneSuggestions(suggestions);
    } else {
      setPhoneSuggestions([]);
    }
  }, [phone, clients]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar nome
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Nome é obrigatório';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Nome muito curto (mínimo 2 caracteres)';
    } else if (trimmedName.length > 50) {
      newErrors.name = 'Nome muito longo (máximo 50 caracteres)';
    }

    // Validar telefone
    const trimmedPhone = phone.trim().replace(/\s/g, '');
    if (!trimmedPhone) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(trimmedPhone)) {
      newErrors.phone = 'Telefone inválido. Use formato: 841234567';
    }

    // Verificar duplicados
    const isDuplicateName = clients.some(c => 
      c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    const isDuplicatePhone = clients.some(c => 
      c.phone.replace(/\s/g, '') === trimmedPhone
    );

    if (isDuplicateName) {
      newErrors.name = 'Já existe um cliente com este nome';
    }
    
    if (isDuplicatePhone) {
      newErrors.phone = 'Já existe um cliente com este número';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim().replace(/\s/g, '');
      
      // Formatar telefone
      const formattedPhone = trimmedPhone.startsWith('+') 
        ? trimmedPhone 
        : (trimmedPhone.startsWith('258') 
            ? `+${trimmedPhone}` 
            : `+258${trimmedPhone}`);

      await onSave(trimmedName, formattedPhone);
      
      // Criar backup automático
      onCreateAutomaticBackup();
      
      // Mostrar sucesso
      setSuccess(true);
      
      // Fechar modal após 1.5 segundos
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Erro ao salvar cliente:', error);
      setErrors({
        form: 'Erro ao salvar cliente. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSuggestion = (suggestedPhone: string) => {
    setPhone(suggestedPhone);
    setPhoneSuggestions([]);
  };

  // Formatador automático de telefone
  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.startsWith('258')) {
      return `+258 ${numbers.substring(3, 6)} ${numbers.substring(6, 9)}`;
    } else if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.substring(0, 3)} ${numbers.substring(3)}`;
    } else {
      return `${numbers.substring(0, 3)} ${numbers.substring(3, 6)} ${numbers.substring(6, 9)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value);
    setPhone(formatted);
    
    // Limpar erro ao digitar
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`
          relative w-full max-w-md rounded-[2.5rem] overflow-hidden
          shadow-2xl animate-in zoom-in-95 duration-300
          ${isDark 
            ? 'bg-slate-900 border border-slate-800' 
            : 'bg-white border border-slate-100'
          }
        `}
        onKeyDown={handleKeyPress}
      >
        {/* Header */}
        <div className={`p-6 flex items-center justify-between border-b ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-2xl ${
              isDark 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-xl font-black ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Novo Cliente
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Adicione um novo cliente ao sistema
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark 
                ? 'hover:bg-slate-800 text-slate-400' 
                : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-5">
          {/* Mensagem de sucesso */}
          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <Check className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-emerald-600">Cliente adicionado com sucesso!</p>
                  <p className="text-sm text-emerald-500/80">Redirecionando...</p>
                </div>
              </div>
            </div>
          )}

          {/* Erro geral */}
          {errors.form && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <p className="font-bold text-rose-600">{errors.form}</p>
              </div>
            </div>
          )}

          {/* Campos do formulário */}
          <div className="space-y-4">
            {/* Campo Nome */}
            <div>
              <label className={`
                flex items-center gap-2 text-sm font-bold mb-2
                ${isDark ? 'text-slate-300' : 'text-slate-700'}
              `}>
                <User className="w-4 h-4" />
                Nome Completo
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="Ex: João Silva"
                  className={`
                    w-full p-4 rounded-2xl border-2 transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500/30
                    ${errors.name 
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' 
                      : isDark 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }
                    ${!errors.name ? 'focus:border-blue-500' : ''}
                    ${isSubmitting ? 'opacity-50' : ''}
                  `}
                  disabled={isSubmitting || success}
                  autoFocus
                />
                
                {name.length > 0 && !errors.name && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                  </div>
                )}
              </div>
              
              {errors.name && (
                <p className="mt-2 text-sm text-rose-500 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
              
              {/* Contador de caracteres */}
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${
                  name.length > 50 
                    ? 'text-rose-500' 
                    : isDark 
                      ? 'text-slate-500' 
                      : 'text-slate-400'
                }`}>
                  {name.length}/50
                </span>
              </div>
            </div>

            {/* Campo Telefone */}
            <div>
              <label className={`
                flex items-center gap-2 text-sm font-bold mb-2
                ${isDark ? 'text-slate-300' : 'text-slate-700'}
              `}>
                <Smartphone className="w-4 h-4" />
                Número de Telefone
              </label>
              
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Ex: 84 123 4567"
                  className={`
                    w-full p-4 rounded-2xl border-2 transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500/30
                    ${errors.phone 
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' 
                      : isDark 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }
                    ${!errors.phone ? 'focus:border-blue-500' : ''}
                    ${isSubmitting ? 'opacity-50' : ''}
                  `}
                  disabled={isSubmitting || success}
                />
                
                {/* Indicador de país */}
                <div className={`
                  absolute left-3 top-1/2 -translate-y-1/2 
                  flex items-center gap-1 text-sm font-bold
                  ${isDark ? 'text-slate-400' : 'text-slate-500'}
                `}>
                  <span>🇲🇿</span>
                  <span>+258</span>
                </div>
              </div>
              
              {errors.phone && (
                <p className="mt-2 text-sm text-rose-500 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone}
                </p>
              )}

              {/* Sugestões de telefone */}
              {phoneSuggestions.length > 0 && (
                <div className="mt-2 space-y-1 animate-in slide-in-from-top-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sugestões de número:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {phoneSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePhoneSuggestion(suggestion)}
                        className={`
                          px-3 py-1.5 text-xs rounded-lg transition-colors
                          ${isDark 
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }
                        `}
                        type="button"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dica de formatação */}
            <div className={`
              p-3 rounded-xl text-sm
              ${isDark 
                ? 'bg-slate-800/50 text-slate-400' 
                : 'bg-slate-100 text-slate-600'
              }
            `}>
              <p className="font-medium">💡 Dica:</p>
              <p className="text-xs mt-1">
                Use números moçambicanos (84, 85, 86, 87). Ex: 841234567
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 pt-0 flex gap-3 ${
          isDark ? 'bg-slate-900' : 'bg-white'
        }`}>
          <TouchButton
            variant="ghost"
            fullWidth
            onClick={onClose}
            disabled={isSubmitting || success}
            className="flex-1"
          >
            Cancelar
          </TouchButton>
          
          <TouchButton
            variant="primary"
            fullWidth
            onClick={handleSave}
            loading={isSubmitting}
            success={success}
            disabled={isSubmitting || success}
            className="flex-1"
            icon={success ? <Check className="w-5 h-5" /> : undefined}
          >
            {success ? 'Salvo!' : 'Adicionar Cliente'}
          </TouchButton>
        </div>

        {/* Progresso de submissão */}
        {isSubmitting && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500/20 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-r-full animate-progress" />
          </div>
        )}
      </div>

      {/* Estilos de animação */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// Modal rápido para adicionar cliente (versão simplificada)
export const QuickAddClientModal: React.FC<Omit<AddClientModalProps, 'onSave'> & {
  onQuickSave: (name: string) => Promise<void>;
}> = ({
  isDark,
  onClose,
  onQuickSave,
  initialName = '',
  onCreateAutomaticBackup
}) => {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onQuickSave(name.trim());
      onCreateAutomaticBackup();
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={`
        relative w-full max-w-sm rounded-3xl p-6
        shadow-2xl animate-in zoom-in-95
        ${isDark 
          ? 'bg-slate-900 border border-slate-800' 
          : 'bg-white border border-slate-200'
        }
      `}>
        <h3 className={`text-lg font-black mb-4 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          Adicionar Cliente Rápido
        </h3>
        
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Digite o nome do cliente"
          className={`
            w-full p-4 rounded-2xl mb-4
            ${isDark 
              ? 'bg-slate-800 text-white' 
              : 'bg-slate-100 text-slate-900'
            }
          `}
          onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        
        <div className="flex gap-3">
          <TouchButton
            variant="ghost"
            fullWidth
            onClick={onClose}
          >
            Cancelar
          </TouchButton>
          
          <TouchButton
            variant="primary"
            fullWidth
            onClick={handleSave}
            loading={isSubmitting}
            disabled={!name.trim() || isSubmitting}
          >
            Adicionar
          </TouchButton>
        </div>
      </div>
    </div>
  );
}; 
