export type RocketTransactionStatus = 'pending' | 'completed' | 'failed';

export type RocketPaymentStatus =
  | 'idle'
  | 'initiating'         // Step 1: Creating payment
  | 'awaitingUserAction'  // Step 2: User redirected to Rocket
  | 'executing'           // Step 3: Executing / querying payment
  | 'completed'           // Success
  | 'failed';             // Failure

export interface RocketTransaction {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: 'BDT';
  paymentId?: string;
  transactionId?: string;
  status: RocketTransactionStatus;
  statusLabel: string;
  amountDisplay: string;
  createdAt: string;
}

export interface RocketCreatePaymentResult {
  paymentId: string;
  redirectUrl: string;
}
