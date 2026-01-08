// ============================================
// MODAL EDITAR CLIENTE - EditClientModal.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle, 
  User,
  Smartphone,
  History,
  BarChart3,
  Check,
  Copy
} from 'lucide-react';
import { TouchButton } from '../shared/TouchButton';
import { GlassCard } from '../shared/GlassCard';
import { validatePhone, formatCurrency } from '../../utils/helpers';

interface EditClientModalProps {
  isDark: boolean;
  client: {
    id: string;
    name: string;
    phone: string;
    activeAccount: Array<{ type: 'Inflow' | 'Outflow'; amount: number }>;
    archive: any[];
  };
  clients: Array<{ id: string; name: string; phone: string }>;
  onClose: () => void;
  onSave: (name: string, phone: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onCreateAutomaticBackup: () => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isDark,
  client,
  clients,
  onClose,
  onSave,
  onDelete,
  onCreateAutomaticBackup
}) => {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'stats'>('edit');

  // Calcular estatísticas
  const calculateStats = () => {
    const totalTransactions = client.activeAccount.length + 
      client.archive.reduce((sum, arch) => sum + arch.transactions.length, 0);
    
    const totalInflow = client.activeAccount
      .filter(tx => tx.type === 'Inflow')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalOutflow = client.activeAccount
      .filter(tx => tx.type === 'Outflow')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const balance = totalOutflow - totalInflow;
    
    const lastTransaction = client.activeAccount.length > 0
      ? new Date(Math.max(...client.activeAccount.map(tx => new Date(tx.date).getTime())))
      : null;
    
    return {
      totalTransactions,
      totalInflow,
      totalOutflow,
      balance,
      lastTransaction,
      archivedCount: client.archive.length
    };
  };

  const stats = calculateStats();

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

    // Verificar duplicados (excluindo o próprio cliente)
    const isDuplicateName = clients.some(c => 
      c.id !== client.id && 
      c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    const isDuplicatePhone = clients.some(c => 
      c.id !== client.id && 
      c.phone.replace(/\s/g, '') === trimmedPhone
    );

    if (isDuplicateName) {
      newErrors.name = 'Já existe outro cliente com este nome';
    }
    
    if (isDuplicatePhone) {
      newErrors.phone = 'Já existe outro cliente com este número';
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
      
      await onSave(trimmedName, trimmedPhone);
      
      // Criar backup automático
      onCreateAutomaticBackup();
      
      // Mostrar sucesso
      setSuccess(true);
      
      // Fechar modal após 1 segundo
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao salvar cliente:', error);
      setErrors({
        form: 'Erro ao salvar alterações. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    
    try {
      await onDelete();
      onCreateAutomaticBackup();
      onClose();
    } catch (error) {
      console.error('❌ Erro ao excluir cliente:', error);
      setErrors({
        form: 'Erro ao excluir cliente. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phone);
    // Poderia adicionar um toast de confirmação aqui
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
              <Edit2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-xl font-black ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Editar Cliente
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                ID: <span className="font-mono">{client.id.substring(0, 8)}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'edit' ? 'stats' : 'edit')}
              className={`p-2 rounded-xl transition-colors ${
                isDark 
                  ? 'hover:bg-slate-800 text-slate-400' 
                  : 'hover:bg-slate-100 text-slate-500'
              }`}
              title={activeTab === 'edit' ? 'Ver estatísticas' : 'Voltar para edição'}
            >
              {activeTab === 'edit' ? <BarChart3 className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            </button>
            
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
        <div className="p-6">
          {activeTab === 'edit' ? (
            /* ABA DE EDIÇÃO */
            <div className="space-y-5">
              {/* Mensagem de sucesso */}
              {success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                      <Check className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-600">Alterações salvas!</p>
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
                  
                  {errors.name && (
                    <p className="mt-2 text-sm text-rose-500 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Campo Telefone */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`
                      flex items-center gap-2 text-sm font-bold
                      ${isDark ? 'text-slate-300' : 'text-slate-700'}
                    `}>
                      <Smartphone className="w-4 h-4" />
                      Número de Telefone
                    </label>
                    
                    <button
                      onClick={handleCopyPhone}
                      className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                        isDark 
                          ? 'hover:bg-slate-800 text-slate-400' 
                          : 'hover:bg-slate-100 text-slate-500'
                      }`}
                      type="button"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar
                    </button>
                  </div>
                  
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder="Ex: +258 84 123 4567"
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
                  
                  {errors.phone && (
                    <p className="mt-2 text-sm text-rose-500 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Informações do cliente */}
                <GlassCard isDark={isDark} className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className={`text-xs font-bold uppercase ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Transações Ativas
                      </p>
                      <p className={`text-lg font-black ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {client.activeAccount.length}
                      </p>
                    </div>
                    
                    <div>
                      <p className={`text-xs font-bold uppercase ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Faturas Arquivadas
                      </p>
                      <p className={`text-lg font-black ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {client.archive.length}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          ) : (
            /* ABA DE ESTATÍSTICAS */
            <div className="space-y-5 animate-in fade-in">
              <h4 className={`text-lg font-black ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Estatísticas do Cliente
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <GlassCard isDark={isDark} className="p-4">
                  <div className="text-center">
                    <p className={`text-xs font-bold uppercase ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Total Transações
                    </p>
                    <p className={`text-2xl font-black mt-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {stats.totalTransactions}
                    </p>
                  </div>
                </GlassCard>
                
                <GlassCard isDark={isDark} className="p-4">
                  <div className="text-center">
                    <p className={`text-xs font-bold uppercase ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Saldo Atual
                    </p>
                    <p className={`text-2xl font-black mt-2 ${
                      stats.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {formatCurrency(Math.abs(stats.balance), 'MZN')}
                      <span className="text-sm ml-1">
                        {stats.balance >= 0 ? '▲' : '▼'}
                      </span>
                    </p>
                  </div>
                </GlassCard>
                
                <GlassCard isDark={isDark} className="p-4">
                  <div className="text-center">
                    <p className={`text-xs font-bold uppercase ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Total Entradas
                    </p>
                    <p className={`text-xl font-black mt-2 text-emerald-500`}>
                      {formatCurrency(stats.totalInflow, 'MZN')}
                    </p>
                  </div>
                </GlassCard>
                
                <GlassCard isDark={isDark} className="p-4">
                  <div className="text-center">
                    <p className={`text-xs font-bold uppercase ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Total Saídas
                    </p>
                    <p className={`text-xl font-black mt-2 text-rose-500`}>
                      {formatCurrency(stats.totalOutflow, 'MZN')}
                    </p>
                  </div>
                </GlassCard>
              </div>
              
              <div className={`
                p-4 rounded-2xl
                ${isDark 
                  ? 'bg-slate-800/50 text-slate-300' 
                  : 'bg-slate-100 text-slate-600'
                }
              `}>
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5" />
                  <div>
                    <p className="font-bold">Histórico</p>
                    <p className="text-sm mt-1">
                      Cliente desde {new Date().toLocaleDateString('pt-MZ', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </p>
                    {stats.lastTransaction && (
                      <p className="text-xs mt-1 opacity-70">
                        Última transação: {stats.lastTransaction.toLocaleDateString('pt-MZ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 pt-0 flex gap-3 ${
          isDark ? 'bg-slate-900' : 'bg-white'
        }`}>
          {activeTab === 'edit' ? (
            <>
              <TouchButton
                variant="danger"
                fullWidth
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || success}
                icon={<Trash2 className="w-5 h-5" />}
              >
                Excluir
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
                {success ? 'Salvo!' : 'Salvar Alterações'}
              </TouchButton>
            </>
          ) : (
            <TouchButton
              variant="primary"
              fullWidth
              onClick={() => setActiveTab('edit')}
            >
              Voltar para Edição
            </TouchButton>
          )}
        </div>

        {/* Modal de confirmação de exclusão */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className={`
              w-full max-w-sm rounded-3xl p-6
              ${isDark 
                ? 'bg-slate-800 border border-slate-700' 
                : 'bg-white border border-slate-200'
              }
            `}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                
                <h4 className={`text-xl font-black mb-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Excluir Cliente
                </h4>
                
                <p className={`text-sm ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Tem certeza que deseja excluir <span className="font-bold">{client.name}</span>?
                  Esta ação não pode ser desfeita.
                </p>
                
                <div className={`mt-4 p-3 rounded-xl text-sm ${
                  isDark 
                    ? 'bg-rose-900/30 text-rose-300' 
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  <p className="font-bold">⚠️ Atenção:</p>
                  <p className="text-xs mt-1">
                    Todas as transações e histórico deste cliente serão permanentemente excluídos.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <TouchButton
                  variant="ghost"
                  fullWidth
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </TouchButton>
                
                <TouchButton
                  variant="danger"
                  fullWidth
                  onClick={handleDelete}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Sim, Excluir
                </TouchButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
