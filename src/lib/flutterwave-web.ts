const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY!;
const FLW_BASE_URL = "https://api.flutterwave.com/v3";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FlwBank {
  id: number;
  code: string;
  name: string;
}

export interface FlwVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: "successful" | "failed" | "pending";
    payment_type: string;
    customer: {
      email: string;
      name: string;
    };
    meta: Record<string, unknown> | null;
  } | null;
}

export interface FlwTransferResponse {
  status: string;
  message: string;
  data: {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    amount: number;
    currency: string;
    reference: string;
    status: string;
  } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function flwFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${FLW_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Flutterwave API error: ${res.status} — ${data.message || JSON.stringify(data)}`
    );
  }

  return data;
}

// ── Payment ───────────────────────────────────────────────────────────────────

export async function initializePayment(params: {
  txRef: string;
  amount: number;
  email: string;
  name: string;
  description: string;
  redirectUrl: string;
  meta?: Record<string, unknown>;
}): Promise<string> {
  const data = await flwFetch<{ status: string; message: string; data: { link: string } }>(
    "/payments",
    {
      method: "POST",
      body: JSON.stringify({
        tx_ref: params.txRef,
        amount: params.amount,
        currency: "NGN",
        redirect_url: params.redirectUrl,
        customer: {
          email: params.email,
          name: params.name,
        },
        customizations: {
          title: "Primetrex",
          description: params.description,
        },
        meta: params.meta,
      }),
    }
  );

  if (data.status !== "success") {
    throw new Error(`Flutterwave payment init failed: ${data.message}`);
  }

  return data.data.link;
}

export async function verifyPaymentByRef(txRef: string): Promise<FlwVerifyResponse> {
  return flwFetch<FlwVerifyResponse>(
    `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`
  );
}

// ── Banks ─────────────────────────────────────────────────────────────────────

export async function listBanks(): Promise<FlwBank[]> {
  const data = await flwFetch<{ status: string; data: FlwBank[] }>("/banks/NG");
  return data.data ?? [];
}

export async function resolveAccount(
  accountNumber: string,
  bankCode: string
): Promise<{ accountName: string; accountNumber: string }> {
  const data = await flwFetch<{
    status: string;
    message: string;
    data: { account_number: string; account_name: string };
  }>("/accounts/resolve", {
    method: "POST",
    body: JSON.stringify({
      account_number: accountNumber,
      account_bank: bankCode,
    }),
  });

  if (data.status !== "success") {
    throw new Error(data.message || "Could not resolve account");
  }

  return {
    accountName: data.data.account_name,
    accountNumber: data.data.account_number,
  };
}

// ── Transfers ─────────────────────────────────────────────────────────────────

export async function initiateTransfer(params: {
  accountBank: string;
  accountNumber: string;
  amount: number;
  narration: string;
  reference: string;
  beneficiaryName: string;
}): Promise<FlwTransferResponse> {
  return flwFetch<FlwTransferResponse>("/transfers", {
    method: "POST",
    body: JSON.stringify({
      account_bank: params.accountBank,
      account_number: params.accountNumber,
      amount: params.amount,
      narration: params.narration,
      currency: "NGN",
      reference: params.reference,
      debit_currency: "NGN",
      beneficiary_name: params.beneficiaryName,
    }),
  });
}

// ── References ────────────────────────────────────────────────────────────────

export function generateWebTxRef(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PTXW-SIGNUP-${Date.now()}-${random}`;
}

export function generateTransferRef(withdrawalId: string): string {
  return `WTH-${withdrawalId}-${Date.now()}`;
}
