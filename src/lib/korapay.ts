/**
 * Korapay API client
 * Docs: https://korahq.com/documentation
 *
 * Base URL: https://api.korapay.com/merchant/api/v1
 * Auth:     Bearer KORA_SECRET_KEY
 * Webhook:  HMAC-SHA256(JSON.stringify(payload.data), KORA_SECRET_KEY) vs x-korapay-signature header
 */

import crypto from "crypto";

const KORA_BASE_URL = "https://api.korapay.com/merchant/api/v1";
const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY!;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KoraBank {
  name: string;
  slug: string;
  code: string;
  country: string;
}

export interface KoraChargeResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    checkout_url: string;
  } | null;
}

export interface KoraVerifyResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: "success" | "failed" | "pending" | "processing";
    amount: number;
    currency: string;
    payment_reference?: string;
    customer: {
      email: string;
      name: string;
    };
  } | null;
}

export interface KoraPayoutResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: "processing" | "failed" | "success";
    amount: number;
    currency: string;
  } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function koraFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${KORA_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${KORA_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const msg =
      (data as { message?: string }).message ||
      JSON.stringify(data);
    throw new Error(`Korapay API error: ${res.status} — ${msg}`);
  }

  return data;
}

// ── Checkout / Pay-in ─────────────────────────────────────────────────────────

/**
 * Initialise a Korapay checkout session.
 * Returns the checkout_url to redirect the customer to.
 */
export async function initializeCharge(params: {
  reference: string;
  amount: number;
  email: string;
  name: string;
  narration: string;
  redirectUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const data = await koraFetch<KoraChargeResponse>("/charges/initialize", {
    method: "POST",
    body: JSON.stringify({
      reference: params.reference,
      amount: params.amount,
      currency: "NGN",
      customer: {
        email: params.email,
        name: params.name,
      },
      redirect_url: params.redirectUrl,
      narration: params.narration,
      channels: ["card", "bank_transfer"],
      metadata: params.metadata,
    }),
  });

  if (!data.status || !data.data?.checkout_url) {
    throw new Error(`Korapay checkout init failed: ${data.message}`);
  }

  return data.data.checkout_url;
}

/**
 * Verify a charge by its reference.
 * Korapay appends ?reference=YOUR_REFERENCE to the redirect URL.
 */
export async function verifyCharge(reference: string): Promise<KoraVerifyResponse> {
  return koraFetch<KoraVerifyResponse>(
    `/charges/${encodeURIComponent(reference)}`
  );
}

// ── Banks ─────────────────────────────────────────────────────────────────────

export async function listBanks(): Promise<KoraBank[]> {
  const data = await koraFetch<{ status: boolean; data: KoraBank[] }>(
    "/misc/banks?countryCode=NG"
  );
  return data.data ?? [];
}

export async function resolveAccount(
  accountNumber: string,
  bankCode: string
): Promise<{ accountName: string; accountNumber: string }> {
  const data = await koraFetch<{
    status: boolean;
    message: string;
    data: {
      account_name: string;
      account_number: string;
      bank_name: string;
      bank_code: string;
    };
  }>("/misc/banks/resolve", {
    method: "POST",
    body: JSON.stringify({
      bank: bankCode,
      account: accountNumber,
      currency: "NGN",
    }),
  });

  if (!data.status) {
    throw new Error(data.message || "Could not resolve account");
  }

  return {
    accountName: data.data.account_name,
    accountNumber: data.data.account_number,
  };
}

// ── Payouts ───────────────────────────────────────────────────────────────────

/**
 * Initiate a bank transfer payout via Korapay Disbursements.
 * reference must be unique — Korapay rejects duplicate references (idempotent).
 */
export async function initiatePayout(params: {
  reference: string;
  accountBank: string;
  accountNumber: string;
  amount: number;
  narration: string;
  beneficiaryName: string;
  beneficiaryEmail?: string;
}): Promise<KoraPayoutResponse> {
  const data = await koraFetch<KoraPayoutResponse>("/transactions/disburse", {
    method: "POST",
    body: JSON.stringify({
      reference: params.reference,
      destination: {
        type: "bank_account",
        amount: params.amount,
        currency: "NGN",
        narration: params.narration,
        bank_account: {
          bank: params.accountBank,
          account: params.accountNumber,
        },
        customer: {
          name: params.beneficiaryName,
          email: params.beneficiaryEmail || `${params.accountNumber}@payout.primetrex.com`,
        },
      },
    }),
  });

  if (!data.status) {
    throw new Error(`Korapay payout failed: ${data.message}`);
  }

  return data;
}

// ── Webhook verification ──────────────────────────────────────────────────────

/**
 * Verify the x-korapay-signature header against the webhook payload's data object.
 * Korapay signs: HMAC-SHA256(JSON.stringify(payload.data), KORA_SECRET_KEY)
 */
export function verifyWebhookSignature(
  signature: string,
  payloadData: unknown
): boolean {
  try {
    const expected = crypto
      .createHmac("sha256", KORA_SECRET_KEY)
      .update(JSON.stringify(payloadData))
      .digest("hex");
    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

// ── References ────────────────────────────────────────────────────────────────

export function generateWebTxRef(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PTXW-SIGNUP-${Date.now()}-${random}`;
}

export function generateBotTxRef(type: "new" | "renewal"): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const prefix = type === "new" ? "PTXW-BOT-NEW" : "PTXW-BOT-REN";
  return `${prefix}-${Date.now()}-${random}`;
}

export function generatePayoutRef(withdrawalId: string): string {
  return `WTH-${withdrawalId}`;
}
