// ============================================
// MODAL EDITAR TRANSAÇÃO - EditTransactionModal.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  Edit2, 
  X, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  Send,
  Clock,
  Check,
  Copy
} from 'lucide-react';
import { TouchButton } from '../shared/TouchButton';
import { GlassCard } from '../shared/GlassCard';
import { formatDateTime, formatCurrency, formatTime } from '../../utils/helpers';
import { Transaction, PaymentMethod, AppSettings, Client } from '../../types';

interface EditTransactionModalProps {
  isDark: boolean;
  transaction: Transaction;
  client: Client;
  settings: AppSettings;
  onClose: () => void;
  onSave: (updatedTx: Transaction) => Promise<void>;
  onSendConfirmation: (tx: Transaction) => void;
  onDuplicate?: (tx: Transaction) => void;
  onCreateAutomaticBackup: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isDark,
  transaction,
  client,
  settings,
  onClose,
  onSave,
  onSendConfirmation,
  onDuplicate,
  onCreateAutomaticBackup
}) => {
  const [formData, setFormData] = useState({
    amount: transaction.amount.toString(),
    method: transaction.method,
    date: transaction.date.split('T')[0],
    time: new Date(transaction.date).toLocaleTimeString('pt-MZ', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
    description: transaction.description || '',
    type: transaction.type
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Validação do formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validar valor
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    } else if (amount > 1000000) { // Limite de 1 milhão
      newErrors.amount = 'Valor muito alto (máx: 1.000.000)';
    }
    
    // Validar data
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      newErrors.date = 'Data não pode ser futura';
    }
    
    // Validar hora
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.time)) {
      newErrors.time = 'Hora inválida. Use formato: HH:MM';
    }
    
    // Validar descrição
    if (formData.description.length > 100) {
      newErrors.description = 'Descrição muito longa (máx: 100 caracteres)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Criar data completa com hora
      const [hours, minutes] = formData.time.split(':').map(Number);
      const dateObj = new Date(formData.date);
      dateObj.setHours(hours, minutes, 0, 0);
      
      const updatedTx: Transaction = {
        ...transaction,
        amount: parseFloat(formData.amount),
        method: formData.method as PaymentMethod,
        date: dateObj.toISOString(),
        description: formData.description.trim() || formData.type,
        type: formData.type as 'Inflow' | 'Outflow'
      };
      
      await onSave(updatedTx);
      onCreateAutomaticBackup();
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao salvar transação:', error);
      setErrors({
        form: 'Erro ao salvar alterações. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      const duplicatedTx: Transaction = {
        ...transaction,
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        description: `${transaction.description} (Cópia)`
      };
      
      onDuplicate(duplicatedTx);
      onClose();
    }
  };

  const handleSendConfirmation = () => {
    onSendConfirmation(transaction);
    onClose();
  };

  // Preview da transação
  const renderPreview = () => {
    const amount = parseFloat(formData.amount);
    const formattedDate = formatDateTime(`${formData.date}T${formData.time}:00`);
    
    return (
      <div className="space-y-4 animate-in fade-in">
        <h4 className={`text-lg font-black ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          Preview da Transação
        </h4>
        
        <GlassCard isDark={isDark} className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className={`text-xs font-bold uppercase ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {formData.type === 'Inflow' ? 'ENTRADA' : 'SAÍDA'}
              </p>
              <p className={`text-xl font-black mt-1 ${
                formData.type === 'Inflow' ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {formData.type === 'Inflow' ? '+' : '-'}
                {formatCurrency(amount, settings.currency)}
              </p>
            </div>
            
            <div className={`p-3 rounded-2xl ${
              formData.type === 'Inflow' 
                ? 'bg-emerald-500/20 text-emerald-500' 
                : 'bg-rose-500/20 text-rose-500'
            }`}>
              {formData.type === 'Inflow' 
                ? <ArrowDownLeft className="w-6 h-6" />
                : <ArrowUpRight className="w-6 h-6" />
              }
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Cliente:
              </span>
              <span className="font-bold">{client.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Método:
              </span>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="font-bold">{formData.method}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Data/Hora:
              </span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-bold">{formattedDate}</span>
              </div>
            </div>
            
            {formData.description && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className={`text-sm ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Descrição:
                </p>
                <p className="font-medium mt-1">{formData.description}</p>
              </div>
            )}
          </div>
        </GlassCard>
        
        <div className={`
          p-4 rounded-2xl
          ${isDark 
            ? 'bg-slate-800/50 text-slate-300' 
            : 'bg-slate-100 text-slate-600'
          }
        `}>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" />
            <div>
              <p className="font-bold">Informações Adicionais</p>
              <p className="text-sm mt-1">
                Transação original criada em {formatDateTime(transaction.date)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Formulário de edição
  const renderEditForm = () => {
    return (
      <div className="space-y-5">
        {/* Mensagem de sucesso */}
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-emerald-600">Transação atualizada!</p>
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
          {/* Tipo da transação */}
          <div>
            <label className={`
              flex items-center gap-2 text-sm font-bold mb-2
              ${isDark ? 'text-slate-300' : 'text-slate-700'}
            `}>
              <ArrowUpRight className="w-4 h-4" />
              Tipo de Transação
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'Inflow'})}
                className={`
                  p-4 rounded-2xl border-2 transition-all
                  flex flex-col items-center justify-center gap-2
                  ${formData.type === 'Inflow'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                    : isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }
                `}
              >
                <ArrowDownLeft className="w-6 h-6" />
                <span className="font-bold">Entrada</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'Outflow'})}
                className={`
                  p-4 rounded-2xl border-2 transition-all
                  flex flex-col items-center justify-center gap-2
                  ${formData.type === 'Outflow'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                    : isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }
                `}
              >
                <ArrowUpRight className="w-6 h-6" />
                <span className="font-bold">Saída</span>
              </button>
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className={`
              flex items-center gap-2 text-sm font-bold mb-2
              ${isDark ? 'text-slate-300' : 'text-slate-700'}
            `}>
              <DollarSign className="w-4 h-4" />
              Valor ({settings.currency})
            </label>
            
            <div className="relative">
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({...formData, amount: e.target.value});
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                }}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                max="1000000"
                className={`
                  w-full p-4 pl-12 rounded-2xl border-2 text-lg font-bold
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30
                  ${errors.amount 
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' 
                    : isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }
                  ${!errors.amount ? 'focus:border-blue-500' : ''}
                  ${isSubmitting ? 'opacity-50' : ''}
                `}
                disabled={isSubmitting || success}
              />
              
              <div className={`
                absolute left-4 top-1/2 -translate-y-1/2
                text-xl font-bold
                ${isDark ? 'text-slate-400' : 'text-slate-500'}
              `}>
                {settings.currency}
              </div>
            </div>
            
            {errors.amount && (
              <p className="mt-2 text-sm text-rose-500 flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Método de pagamento */}
          <div>
            <label className={`
              flex items-center gap-2 text-sm font-bold mb-2
              ${isDark ? 'text-slate-300' : 'text-slate-700'}
            `}>
              <CreditCard className="w-4 h-4" />
              Método de Pagamento
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              {settings.enabledAccounts.map((method) => {
                const isSelected = formData.method === method;
                const color = settings.accountColors[method] || '#3b82f6';
                
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({...formData, method})}
                    className={`
                      p-3 rounded-xl text-xs font-bold transition-all
                      ${isSelected 
                        ? 'text-white shadow-md' 
                        : isDark 
                          ? 'bg-slate-800 text-slate-400' 
                          : 'bg-slate-100 text-slate-500'
                      }
                      ${isSubmitting ? 'opacity-50' : ''}
                    `}
                    style={isSelected ? {
                      backgroundColor: color,
                      borderColor: color
                    } : {}}
                    disabled={isSubmitting || success}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`
                flex items-center gap-2 text-sm font-bold mb-2
                ${isDark ? 'text-slate-300' : 'text-slate-700'}
              `}>
                <Calendar className="w-4 h-4" />
                Data
              </label>
              
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData({...formData, date: e.target.value});
                  if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                }}
                max={new Date().toISOString().split('T')[0]}
                className={`
                  w-full p-4 rounded-2xl border-2
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30
                  ${errors.date 
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' 
                    : isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }
                  ${!errors.date ? 'focus:border-blue-500' : ''}
                  ${isSubmitting ? 'opacity-50' : ''}
                `}
                disabled={isSubmitting || success}
              />
              
              {errors.date && (
                <p className="mt-2 text-sm text-rose-500 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3" />
                  {errors.date}
                </p>
              )}
            </div>
            
            <div>
              <label className={`
                flex items-center gap-2 text-sm font-bold mb-2
                ${isDark ? 'text-slate-300' : 'text-slate-700'}
              `}>
                <Clock className="w-4 h-4" />
                Hora
              </label>
              
              <input
                type="time"
                value={formData.time}
                onChange={(e) => {
                  setFormData({...formData, time: e.target.value});
                  if (errors.time) setErrors(prev => ({ ...prev, time: '' }));
                }}
                step="300" // Incrementos de 5 minutos
                className={`
                  w-full p-4 rounded-2xl border-2
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30
                  ${errors.time 
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' 
                    : isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }
                  ${!errors.time ? 'focus:border-blue-500' : ''}
                  ${isSubmitting ? 'opacity-50' : ''}
                `}
                disabled={isSubmitting || success}
              />
              
              {errors.time && (
                <p className="mt-2 text-sm text-rose-500 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3" />
                  {errors.time}
                </p>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className={`
              flex items-center gap-2 text-sm font-bold mb-2
              ${isDark ? 'text-slate-300' : 'text-slate-700'}
            `}>
              <FileText className="w-4 h-4" />
              Descrição (Opcional)
            </label>
            
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData({...formData, description: e.target.value});
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
              }}
              placeholder="Ex: Pagamento de serviço, Transferência, etc."
              rows={3}
              maxLength={100}
              className={`
                w-full p-4 rounded-2xl border-2 resize-none
                focus:outline-none focus:ring-2 focus:ring-blue-500/30
                ${errors.description 
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' 
                  : isDark 
                    ? 'bg-slate-800 border-slate-700 text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }
                ${!errors.description ? 'focus:border-blue-500' : ''}
                ${isSubmitting ? 'opacity-50' : ''}
              `}
              disabled={isSubmitting || success}
            />
            
            <div className="flex justify-between mt-1">
              {errors.description && (
                <p className="text-sm text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.description}
                </p>
              )}
              
              <span className={`text-xs ml-auto ${
                formData.description.length > 90 
                  ? 'text-rose-500' 
                  : isDark 
                    ? 'text-slate-500' 
                    : 'text-slate-400'
              }`}>
                {formData.description.length}/100
              </span>
            </div>
          </div>
        </div>
      </div>
    );
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
              <Edit2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-xl font-black ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Editar Transação
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Cliente: {client.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
              className={`p-2 rounded-xl transition-colors ${
                isDark 
                  ? 'hover:bg-slate-800 text-slate-400' 
                  : 'hover:bg-slate-100 text-slate-500'
              }`}
              title={activeTab === 'edit' ? 'Ver preview' : 'Voltar para edição'}
            >
              {activeTab === 'edit' ? <FileText className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            </button>
            
            {onDuplicate && (
              <button
                onClick={handleDuplicate}
                className={`p-2 rounded-xl transition-colors ${
                  isDark 
                    ? 'hover:bg-slate-800 text-slate-400' 
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="Duplicar transação"
              >
                <Copy className="w-5 h-5" />
              </button>
            )}
            
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
        </div>

        {/* Conteúdo */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'edit' ? renderEditForm() : renderPreview()}
        </div>

        {/* Footer */}
        <div className={`p-6 pt-0 flex gap-3 ${
          isDark ? 'bg-slate-900' : 'bg-white'
        }`}>
          {activeTab === 'edit' ? (
            <>
              <TouchButton
                variant="ghost"
                fullWidth
                onClick={onClose}
                disabled={isSubmitting || success}
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
                icon={success ? <Check className="w-5 h-5" /> : undefined}
              >
                {success ? 'Salvo!' : 'Salvar Alterações'}
              </TouchButton>
            </>
          ) : (
            <div className="w-full space-y-3">
              <TouchButton
                variant="primary"
                fullWidth
                onClick={handleSendConfirmation}
                icon={<Send className="w-5 h-5" />}
              >
                Enviar Confirmação por SMS
              </TouchButton>
              
              <TouchButton
                variant="ghost"
                fullWidth
                onClick={() => setActiveTab('edit')}
              >
                Voltar para Edição
              </TouchButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal rápido para edição de transação (apenas valor)
export const QuickEditTransactionModal: React.FC<{
  isDark: boolean;
  transaction: Transaction;
  onClose: () => void;
  onSave: (amount: number) => Promise<void>;
}> = ({
  isDark,
  transaction,
  onClose,
  onSave
}) => {
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    setIsSubmitting(true);
    try {
      await onSave(numAmount);
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
          Ajustar Valor
        </h3>
        
        <div className="mb-6">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`
              w-full p-4 text-2xl font-bold text-center rounded-2xl
              ${isDark 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-900'
              }
            `}
            autoFocus
          />
        </div>
        
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
          >
            Salvar
          </TouchButton>
        </div>
      </div>
    </div>
  );
}; 
