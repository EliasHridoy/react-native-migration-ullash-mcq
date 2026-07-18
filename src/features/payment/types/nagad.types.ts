export type NagadTransactionStatus = 'pending' | 'completed' | 'failed';

export type NagadPaymentStatus =
  | 'idle'
  | 'initiating'         // Step 1: Initialize + create order
  | 'awaitingUserAction'  // Step 2: User redirected to Nagad
  | 'executing'           // Step 3: Verifying payment
  | 'completed'           // Success
  | 'failed';             // Failure

export interface NagadTransaction {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: 'BDT';
  paymentId?: string;
  transactionId?: string;
  status: NagadTransactionStatus;
  statusLabel: string;
  amountDisplay: string;
  createdAt: string;
}

export interface NagadCreatePaymentResult {
  paymentId: string;
  callbackUrl: string;
}
