export type BkashTransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type BkashPaymentStatus =
  | 'idle'
  | 'initiating'         // Step 1: Creating payment
  | 'awaitingUserAction' // Step 2: User opened bkashURL
  | 'executing'          // Step 3: Executing payment
  | 'completed'          // Success
  | 'failed';            // Failure

export interface BkashTransaction {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: 'BDT';
  paymentId?: string;
  merchantInvoiceNumber?: string;
  trxId?: string;
  status: BkashTransactionStatus;
  statusLabel: string;
  amountDisplay: string;
  createdAt: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  bkashUrl: string;
  merchantInvoiceNumber: string;
}
