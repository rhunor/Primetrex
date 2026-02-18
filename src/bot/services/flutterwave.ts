import type {
  FlutterwavePaymentLink,
  FlutterwaveVerifyResponse,
} from "@/types/flutterwave";
import { botConfig } from "@/bot/config";

const FLW_BASE_URL = "https://api.flutterwave.com/v3";

export async function generatePaymentLink(params: {
  txRef: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  planName: string;
}): Promise<string> {
  const response = await fetch(`${FLW_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botConfig.flwSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amount,
      currency: "NGN",
      redirect_url: botConfig.flwRedirectUrl,
      customer: {
        email: params.customerEmail,
        name: params.customerName,
      },
      customizations: {
        title: "Primetrex Subscription",
        description: `Plan: ${params.planName}`,
      },
    }),
  });

  const data: FlutterwavePaymentLink = await response.json();

  if (data.status !== "success") {
    throw new Error(`Flutterwave error: ${data.message}`);
  }

  return data.data.link;
}

export async function verifyPayment(
  txRef: string
): Promise<FlutterwaveVerifyResponse> {
  const response = await fetch(
    `${FLW_BASE_URL}/transactions/verify_by_reference?tx_ref=${txRef}`,
    {
      headers: {
        Authorization: `Bearer ${botConfig.flwSecretKey}`,
      },
    }
  );

  return response.json();
}

export function generateTxRef(userId: number | string): string {
  return `PTRX-${userId}-${Date.now()}`;
}
