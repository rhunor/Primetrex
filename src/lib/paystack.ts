const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface InitializePaymentParams {
  email: string;
  amount: number; // in kobo (NGN smallest unit)
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface InitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface VerifyData {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
  };
  metadata: Record<string, unknown>;
}

export interface PaystackBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  active: boolean;
  country: string;
  currency: string;
  type: string;
}

interface ResolveAccountData {
  account_number: string;
  account_name: string;
}

interface TransferRecipientData {
  active: boolean;
  currency: string;
  id: number;
  name: string;
  recipient_code: string;
  type: string;
  details: {
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
  };
}

interface TransferData {
  amount: number;
  currency: string;
  source: string;
  reason: string;
  status: string;
  transfer_code: string;
  id: number;
  reference: string;
}

async function paystackFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<PaystackResponse<T>> {
  const res = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Paystack API error: ${res.status} — ${error}`);
  }

  return res.json();
}

// --- Payment Functions ---

export async function initializePayment(params: InitializePaymentParams) {
  return paystackFetch<InitializeData>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
}

export async function verifyPayment(reference: string) {
  return paystackFetch<VerifyData>(`/transaction/verify/${reference}`);
}

export function generatePaymentReference(): string {
  return `PTX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// --- Bank Functions ---

export async function listBanks(currency: string = "NGN") {
  return paystackFetch<PaystackBank[]>(
    `/bank?currency=${currency}&per_page=100`
  );
}

export async function resolveAccount(accountNumber: string, bankCode: string) {
  return paystackFetch<ResolveAccountData>(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  );
}

// --- Transfer Functions ---

export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency?: string;
}) {
  return paystackFetch<TransferRecipientData>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: params.currency || "NGN",
    }),
  });
}

export async function initiateTransfer(params: {
  amount: number; // in Naira — will be converted to kobo
  recipientCode: string;
  reason: string;
  reference: string;
}) {
  return paystackFetch<TransferData>("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: params.amount * 100, // Convert Naira to kobo
      recipient: params.recipientCode,
      reason: params.reason,
      reference: params.reference,
    }),
  });
}

export function generateTransferReference(withdrawalId: string): string {
  return `WTH-${withdrawalId}-${Date.now()}`;
}
