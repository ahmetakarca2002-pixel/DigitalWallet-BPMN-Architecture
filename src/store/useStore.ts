import axios from 'axios';
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export type TransactionStatus = 'pending' | 'completed' | 'rejected';

export type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  loyaltyPoints: number; 
  glyph: string;
  color: string;
  status: TransactionStatus;
  feeAmount?: number;
  isReward?: boolean; 
  paymentType?: string;
  paymentDescription?: string;
  transactionDate?: string;
  // Transactions tablosuna eklediğin yeni sütunlar:
  transferPurpose?: string;
  expenseType?: string;
};

export type Account = {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
  // Accounts tablosuna eklediğin yeni sütunlar:
  currency?: string;
  swiftCode?: string;
};

interface WalletStore {
  balance: number;
  loyaltyPoints: number; 
  transactions: Transaction[];
  accounts: Account[];
  customerType: 'VIP' | 'STANDART';
  socket: Socket | null;
  fetchWalletData: () => Promise<void>;
  sendMoney: (recipient: string, amount: number, feeAmount?: number) => string;
  resolveTransaction: (id: string, newStatus: TransactionStatus) => void;
  approvePendingTransfer: (amount: number) => void;
  cancelPendingTransfer: (amount: number) => void;
  setCustomerType: (type: 'VIP' | 'STANDART') => void;
  initSocket: () => void;
}

export const useStore = create<WalletStore>((set, get) => ({
  balance: 0,
  loyaltyPoints: 0, 
  transactions: [],
  accounts: [], 
  customerType: 'STANDART',
  socket: null, 

  fetchWalletData: async () => {
    try {
      const response = await axios.get('http://192.168.1.106:3000/api/wallet/Ahmet_123');
      const data = response.data;

      if (data.customerType) {
        set({ customerType: data.customerType.toUpperCase() });
      }

      const mappedTransactions = (data.transactions || []).map((t: any): Transaction => {
        const dbStatus = t.status.toUpperCase();
        const isCashback = t.receiver_iban === 'SİSTEM - ÖDÜL';
        let displayGlyph = isCashback ? '🎁' : '⏳';
        let displayColor = isCashback ? '#ED21D9' : '#F57C00';
        
        if (!isCashback) {
            if (dbStatus === 'COMPLETED') {
              displayGlyph = '⇄';
              displayColor = '#FF8A00';
            } else if (dbStatus === 'REJECTED') {
              displayGlyph = '✕';
              displayColor = '#D32F2F'; 
            }
        }
        const fee = Number(t.fee_amount) || 0; 
        const dbAmount = Number(t.amount) || 0;
        const pts = Number(t.loyalty_points) || 0;

        return {
          id: t.id?.toString() || Math.random().toString(),
          title: isCashback ? 'Kazanılan Sadakat Puanı' : (t.payment_type || 'Para Transferi'), 
          subtitle: isCashback ? 'Dgpays Bank' : t.receiver_iban,
          amount: isCashback ? dbAmount : -(dbAmount + fee), 
          loyaltyPoints: pts,
          feeAmount: fee, 
          isReward: isCashback,
          glyph: displayGlyph,
          color: displayColor,
          status: dbStatus.toLowerCase() as TransactionStatus,
          paymentType: t.payment_type,
          paymentDescription: t.payment_description,
          transactionDate: t.transaction_date,
          transferPurpose: t.transfer_purpose,
          expenseType: t.expense_type
        };
      });

      const mappedAccounts = (data.accounts || []).map((acc: any): Account => {
        return {
          id: acc.id?.toString() || Math.random().toString(),
          account_type: acc.account_type || 'Tip Bulunamadı', 
          account_number: acc.account_number || 'No Bulunamadı',
          balance: Number(acc.balance) || 0,
          // Accounts tablosundan gelen DB alanları
          currency: acc.currency || 'TRY',
          swiftCode: acc.swift_code
        };
      });

      set({ 
        balance: data.balance, 
        loyaltyPoints: data.loyaltyPoints || 0, 
        transactions: mappedTransactions,
        accounts: mappedAccounts
      });
    } catch (error) {
      console.error("Cüzdan verisi çekilemedi:", error);
    }
  },

  initSocket: () => {
    const currentSocket = get().socket;
    if (!currentSocket) {
      const newSocket = io('http://192.168.1.106:3000'); 
      newSocket.on('connect', () => console.log('🔌 WebSocket Bağlantısı Başarılı! ID:', newSocket.id));
      newSocket.on('transfer-approved', (data) => { get().fetchWalletData(); });
      newSocket.on('transfer-timeout', (data) => { get().fetchWalletData(); });
      set({ socket: newSocket });
    }
  },

  sendMoney: (recipient, amount, feeAmount = 0) => {
    const newId = Math.random().toString();
    const totalDeduction = Number(amount) + Number(feeAmount); 
    set((state) => ({
      balance: state.balance - totalDeduction, 
      transactions: [
        {
          id: newId, title: 'Para Transferi', subtitle: recipient, amount: -totalDeduction, 
          loyaltyPoints: 0, feeAmount: Number(feeAmount), isReward: false,
          glyph: '⏳', color: '#F57C00', status: 'pending'
        },
        ...state.transactions
      ]
    }));
    return newId;
  },

  resolveTransaction: (id, newStatus) => set((state) => {
    const updatedTransactions = state.transactions.map(t => {
      if (t.id === id) return { ...t, status: newStatus, glyph: newStatus === 'completed' ? '⇄' : '✕', color: newStatus === 'completed' ? '#FF8A00' : '#D32F2F' };
      return t;
    });
    const transaction = state.transactions.find(t => t.id === id);
    const newBalance = (newStatus === 'completed' && transaction && !transaction.isReward) ? state.balance + Math.abs(Number(transaction.amount)) : state.balance;
    return { transactions: updatedTransactions, balance: newBalance };
  }),

  approvePendingTransfer: (amount) => set((state) => {
    let found = false;
    const targetAmount = Number(amount); 
    const updatedTransactions = state.transactions.map((t): Transaction => {
      const baseAmount = Math.abs(Number(t.amount)) - (Number(t.feeAmount) || 0);
      if (!found && t.status === 'pending' && baseAmount === targetAmount && !t.isReward) {
        found = true;
        return { ...t, status: 'completed' as TransactionStatus, glyph: '⇄', color: '#FF8A00' };
      }
      return t;
    });
    return { balance: state.balance, transactions: updatedTransactions };
  }),

  cancelPendingTransfer: (amount) => set((state) => {
    let found = false;
    const targetAmount = Number(amount); 
    let refundAmount = 0;
    const updatedTransactions = state.transactions.map((t): Transaction => {
      const baseAmount = Math.abs(Number(t.amount)) - (Number(t.feeAmount) || 0);
      if (!found && t.status === 'pending' && baseAmount === targetAmount && !t.isReward) {
        found = true;
        refundAmount = Math.abs(Number(t.amount)); 
        return { ...t, status: 'rejected' as TransactionStatus, glyph: '✕', color: '#D32F2F' };
      }
      return t;
    });
    return { balance: found ? state.balance + refundAmount : state.balance, transactions: updatedTransactions };
  }),

  setCustomerType: (type) => set({ customerType: type }) 
}));