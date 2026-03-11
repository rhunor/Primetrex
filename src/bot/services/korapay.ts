import { botConfig } from "@/bot/config";

const KORA_BASE_URL = "https://api.korapay.com/merchant/api/v1";

export async function generatePaymentLink(params: {
  txRef: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  planName: string;
}): Promise<string> {
  const response = await fetch(`${KORA_BASE_URL}/charges/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botConfig.koraSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference: params.txRef,
      amount: params.amount,
      currency: "NGN",
      redirect_url: botConfig.koraRedirectUrl,
      customer: {
        email: params.customerEmail,
        name: params.customerName,
      },
      narration: `Primetrex Subscription: ${params.planName}`,
      channels: ["card", "bank_transfer"],
    }),
  });

  const data = await response.json();

  if (!data.status || !data.data?.checkout_url) {
    throw new Error(`Korapay error: ${data.message}`);
  }

  return data.data.checkout_url;
}

export async function verifyPayment(txRef: string): Promise<{
  status: boolean;
  data: { reference: string; status: string; amount: number; payment_reference?: string } | null;
}> {
  const response = await fetch(
    `${KORA_BASE_URL}/charges/${encodeURIComponent(txRef)}`,
    {
      headers: {
        Authorization: `Bearer ${botConfig.koraSecretKey}`,
      },
    }
  );

  return response.json();
}

export function generateTxRef(userId: number | string): string {
  return `PTRX-${userId}-${Date.now()}`;
}
