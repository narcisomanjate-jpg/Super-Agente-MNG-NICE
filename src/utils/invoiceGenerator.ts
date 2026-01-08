// ============================================
// GERADOR DE FATURAS PDF - invoiceGenerator.ts
// ============================================

import { Client, Transaction, AppSettings } from '../types';
import { formatDate, formatTime, formatCurrency } from './helpers';

export interface ArchiveData {
  dateClosed: string;
  transactions: Transaction[];
  invoiceNumber: string;
}

export const generateInvoicePDF = async (
  client: Client,
  archiveData: ArchiveData,
  settings: AppSettings
): Promise<boolean> => {
  try {
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para gerar a fatura.');
      return false;
    }

    // Calcular totais
    let totalInflow = 0;
    let totalOutflow = 0;
    
    archiveData.transactions.forEach((tx: Transaction) => {
      if (tx.type === 'Inflow') {
        totalInflow += tx.amount;
      } else {
        totalOutflow += tx.amount;
      }
    });

    const saldoFinal = totalOutflow - totalInflow;
    const saldoFormatado = formatCurrency(Math.abs(saldoFinal), settings.currency);
    const sinalSaldo = saldoFinal >= 0 ? '+' : '-';

    // HTML completo para a fatura
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fatura ${archiveData.invoiceNumber} - ${client.name}</title>
        <style>
          /* Reset e configurações gerais */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #1f2937;
            background: #f9fafb;
            line-height: 1.5;
          }
          
          /* Container principal */
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            padding: 40px;
            position: relative;
            overflow: hidden;
            border: 1px solid #e5e7eb;
          }
          
          /* Cabeçalho */
          .header {
            border-bottom: 3px solid ${settings.uiConfig.primaryColor}20;
            padding-bottom: 30px;
            margin-bottom: 40px;
            position: relative;
          }
          
          .header::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 120px;
            height: 6px;
            background: ${settings.uiConfig.primaryColor};
            border-radius: 3px;
          }
          
          .invoice-title {
            font-size: 32px;
            font-weight: 900;
            color: #111827;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          
          .invoice-number {
            font-size: 20px;
            color: ${settings.uiConfig.primaryColor};
            font-weight: 800;
            margin-bottom: 15px;
          }
          
          .invoice-meta {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 20px;
          }
          
          .meta-item {
            flex: 1;
            min-width: 200px;
          }
          
          .meta-label {
            font-size: 12px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          
          .meta-value {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
          }
          
          /* Informações do cliente */
          .client-info {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 30px;
            border-radius: 16px;
            margin-bottom: 40px;
            border: 1px solid #e2e8f0;
          }
          
          .client-name {
            font-size: 24px;
            font-weight: 800;
            color: #111827;
            margin-bottom: 8px;
          }
          
          .client-phone {
            color: #4b5563;
            font-size: 16px;
            font-weight: 500;
          }
          
          /* Tabela de transações */
          .transaction-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          
          .transaction-table thead {
            background: ${settings.uiConfig.primaryColor};
          }
          
          .transaction-table th {
            padding: 18px 20px;
            text-align: left;
            font-size: 12px;
            font-weight: 800;
            color: white;
            text-transform: uppercase;
            letter-spacing: 1px;
            border: none;
          }
          
          .transaction-table tbody tr {
            border-bottom: 1px solid #f1f5f9;
            transition: background 0.2s;
          }
          
          .transaction-table tbody tr:hover {
            background: #f8fafc;
          }
          
          .transaction-table tbody tr:last-child {
            border-bottom: none;
          }
          
          .transaction-table td {
            padding: 20px;
            font-size: 14px;
            color: #374151;
            vertical-align: top;
          }
          
          .transaction-type {
            font-weight: 800;
            text-transform: uppercase;
            font-size: 11px;
            padding: 6px 12px;
            border-radius: 20px;
            display: inline-block;
            letter-spacing: 0.5px;
          }
          
          .inflow {
            background: #d1fae5;
            color: #065f46;
          }
          
          .outflow {
            background: #fee2e2;
            color: #7f1d1d;
          }
          
          .transaction-amount {
            font-weight: 800;
            font-size: 15px;
            text-align: right;
          }
          
          .transaction-date-time {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
          }
          
          /* Seção de totais */
          .total-section {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 30px;
            border-radius: 16px;
            margin-top: 30px;
            border: 1px solid #cbd5e1;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            font-size: 16px;
          }
          
          .total-label {
            font-weight: 600;
            color: #4b5563;
          }
          
          .total-value {
            font-weight: 700;
            color: #111827;
          }
          
          .inflow-total {
            color: #065f46;
          }
          
          .outflow-total {
            color: #7f1d1d;
          }
          
          .final-total {
            font-size: 28px;
            font-weight: 900;
            color: ${settings.uiConfig.primaryColor};
            border-top: 2px dashed #94a3b8;
            padding-top: 20px;
            margin-top: 20px;
          }
          
          .final-total-label {
            font-size: 18px;
            font-weight: 800;
          }
          
          /* Rodapé */
          .footer {
            text-align: center;
            margin-top: 50px;
            color: #6b7280;
            font-size: 13px;
            border-top: 1px solid #e5e7eb;
            padding-top: 30px;
          }
          
          .footer-logo {
            font-size: 20px;
            font-weight: 900;
            color: ${settings.uiConfig.primaryColor};
            margin-bottom: 10px;
            letter-spacing: -0.5px;
          }
          
          .footer-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
            font-size: 12px;
            opacity: 0.8;
          }
          
          /* Botões de ação */
          .action-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 30px;
          }
          
          .action-button {
            padding: 14px 28px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
            text-align: center;
          }
          
          .print-button {
            background: ${settings.uiConfig.primaryColor};
            color: white;
          }
          
          .print-button:hover {
            background: ${settings.uiConfig.primaryColor}dd;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px ${settings.uiConfig.primaryColor}40;
          }
          
          .download-button {
            background: #10b981;
            color: white;
          }
          
          .download-button:hover {
            background: #0da271;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px #10b98140;
          }
          
          /* Responsividade para impressão */
          @media print {
            body {
              background: white;
              padding: 0;
            }
            
            .invoice-container {
              box-shadow: none;
              border: none;
              border-radius: 0;
              padding: 0;
            }
            
            .no-print {
              display: none !important;
            }
            
            .action-buttons {
              display: none;
            }
            
            .footer {
              position: fixed;
              bottom: 0;
              width: 100%;
              background: white;
            }
          }
          
          /* Responsividade para telas pequenas */
          @media (max-width: 768px) {
            .invoice-container {
              padding: 20px;
              border-radius: 12px;
            }
            
            .invoice-title {
              font-size: 24px;
            }
            
            .invoice-number {
              font-size: 16px;
            }
            
            .transaction-table {
              font-size: 12px;
            }
            
            .transaction-table th,
            .transaction-table td {
              padding: 12px;
            }
            
            .total-section {
              padding: 20px;
            }
            
            .final-total {
              font-size: 22px;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Cabeçalho -->
          <div class="header">
            <div class="invoice-title">FATURA DE LIQUIDAÇÃO</div>
            <div class="invoice-number">${archiveData.invoiceNumber}</div>
            
            <div class="invoice-meta">
              <div class="meta-item">
                <div class="meta-label">Data de Emissão</div>
                <div class="meta-value">${formatDate(archiveData.dateClosed)}</div>
              </div>
              
              <div class="meta-item">
                <div class="meta-label">Data de Fechamento</div>
                <div class="meta-value">${formatDate(archiveData.dateClosed)}</div>
              </div>
              
              <div class="meta-item">
                <div class="meta-label">Agente Responsável</div>
                <div class="meta-value">Super Agente System</div>
              </div>
            </div>
          </div>

          <!-- Informações do Cliente -->
          <div class="client-info">
            <div class="client-name">${client.name}</div>
            <div class="client-phone">📞 ${client.phone}</div>
          </div>

          <!-- Tabela de Transações -->
          <table class="transaction-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Descrição</th>
                <th>Método</th>
                <th>Tipo</th>
                <th>Valor (${settings.currency})</th>
              </tr>
            </thead>
            <tbody>
              ${archiveData.transactions.map((tx: Transaction) => `
                <tr>
                  <td>
                    <div>${formatDate(tx.date)}</div>
                    <div class="transaction-date-time">${formatTime(tx.date)}</div>
                  </td>
                  <td>${tx.description || tx.type}</td>
                  <td>${tx.method}</td>
                  <td>
                    <span class="transaction-type ${tx.type.toLowerCase()}">
                      ${tx.type === 'Inflow' ? 'ENTRADA' : 'SAÍDA'}
                    </span>
                  </td>
                  <td class="transaction-amount" style="color: ${tx.type === 'Inflow' ? '#065f46' : '#7f1d1d'};">
                    ${tx.type === 'Inflow' ? '+' : '-'}${formatCurrency(tx.amount, '')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Seção de Totais -->
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Total de Saídas (Crédito):</span>
              <span class="total-value outflow-total">${formatCurrency(totalOutflow, '')}</span>
            </div>
            
            <div class="total-row">
              <span class="total-label">Total de Entradas (Débito):</span>
              <span class="total-value inflow-total">${formatCurrency(totalInflow, '')}</span>
            </div>
            
            <div class="total-row final-total">
              <span class="final-total-label">SALDO FINAL:</span>
              <span class="final-total-value">
                ${sinalSaldo}${saldoFormatado}
              </span>
            </div>
            
            <div class="total-row" style="margin-top: 20px; font-size: 14px; color: #6b7280;">
              <span>Status:</span>
              <span style="font-weight: 700; color: ${saldoFinal === 0 ? '#10b981' : '#ef4444'}">
                ${saldoFinal === 0 ? '✅ CONTA QUITADA' : '⚠️ SALDO PENDENTE'}
              </span>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <div class="footer-logo">SUPER AGENTE</div>
            <p>Sistema de Gestão Financeira para Agentes</p>
            <p>Fatura gerada automaticamente em ${new Date().toLocaleString('pt-MZ')}</p>
            
            <div class="footer-info">
              <div>📧 suporte@superagente.com</div>
              <div>🌐 www.superagente.com</div>
              <div>📞 +258 84 123 4567</div>
            </div>
            
            <div class="action-buttons no-print">
              <button class="action-button print-button" onclick="window.print()">
                🖨️ Imprimir Fatura
              </button>
              <button class="action-button download-button" onclick="downloadAsPDF()">
                📥 Baixar como PDF
              </button>
            </div>
            
            <p style="margin-top: 20px; font-size: 11px; opacity: 0.6;">
              Este documento possui validade fiscal e deve ser mantido pelo cliente.
            </p>
          </div>
        </div>

        <script>
          // Função para baixar como PDF (usando a impressão do navegador)
          function downloadAsPDF() {
            window.print();
          }
          
          // Adicionar efeito de impressão automática após carregamento
          window.addEventListener('load', function() {
            // Auto-print opcional (descomente se quiser)
            // setTimeout(() => window.print(), 1000);
          });
        </script>
      </body>
      </html>
    `;

    // Escrever HTML na nova janela
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    return true;

  } catch (error) {
    console.error('❌ Erro ao gerar fatura:', error);
    alert('Erro ao gerar fatura. Tente novamente.');
    return false;
  }
};

// Função para gerar uma fatura simples (texto) para SMS
export const generateSimpleInvoice = (
  client: Client,
  archiveData: ArchiveData,
  settings: AppSettings
): string => {
  let totalInflow = 0;
  let totalOutflow = 0;
  
  archiveData.transactions.forEach((tx) => {
    if (tx.type === 'Inflow') {
      totalInflow += tx.amount;
    } else {
      totalOutflow += tx.amount;
    }
  });

  const saldoFinal = totalOutflow - totalInflow;

  return `
📋 FATURA ${archiveData.invoiceNumber}

👤 Cliente: ${client.name}
📞 Contato: ${client.phone}
📅 Data: ${formatDate(archiveData.dateClosed)}

📊 RESUMO:
• Saídas: ${formatCurrency(totalOutflow, settings.currency)}
• Entradas: ${formatCurrency(totalInflow, settings.currency)}
• Saldo Final: ${saldoFinal >= 0 ? '+' : ''}${formatCurrency(saldoFinal, settings.currency)}

${saldoFinal === 0 ? '✅ CONTA QUITADA' : '⚠️ SALDO PENDENTE'}

📄 Detalhes disponíveis no app Super Agente.
🔗 Para mais informações, entre em contato.
`.trim();
};

// Função para gerar preview rápido da fatura
export const generateInvoicePreview = (
  client: Client,
  transactions: Transaction[],
  settings: AppSettings
): {
  totalInflow: number;
  totalOutflow: number;
  balance: number;
  status: 'paid' | 'pending' | 'overdue';
  summary: string;
} => {
  let totalInflow = 0;
  let totalOutflow = 0;
  
  transactions.forEach((tx) => {
    if (tx.type === 'Inflow') {
      totalInflow += tx.amount;
    } else {
      totalOutflow += tx.amount;
    }
  });

  const balance = totalOutflow - totalInflow;
  
  let status: 'paid' | 'pending' | 'overdue' = 'pending';
  if (balance === 0) status = 'paid';
  else if (balance < 0) status = 'overdue';

  const summary = `
Resumo para ${client.name}:
• Total Saídas: ${formatCurrency(totalOutflow, settings.currency)}
• Total Entradas: ${formatCurrency(totalInflow, settings.currency)}
• Saldo: ${balance >= 0 ? '+' : ''}${formatCurrency(balance, settings.currency)}
• Status: ${status === 'paid' ? 'Quitado' : status === 'pending' ? 'Pendente' : 'Em débito'}
`.trim();

  return {
    totalInflow,
    totalOutflow,
    balance,
    status,
    summary
  };
}; 
