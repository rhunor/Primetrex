import Notification from "@/models/Notification";
import mongoose from "mongoose";

type NotificationType =
  | "referral_signup"
  | "commission_earned"
  | "withdrawal_update"
  | "payment_received"
  | "welcome"
  | "system";

interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata,
}: CreateNotificationParams) {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      metadata: metadata || null,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function notifyReferralSignup(
  referrerId: string | mongoose.Types.ObjectId,
  referredName: string
) {
  await createNotification({
    userId: referrerId,
    type: "referral_signup",
    title: "New Referral!",
    message: `${referredName} just signed up using your referral link. You'll earn commission once they complete payment.`,
  });
}

export async function notifyCommissionEarned(
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  tier: number,
  sourceName: string
) {
  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

  await createNotification({
    userId,
    type: "commission_earned",
    title: `Tier ${tier} Commission Earned!`,
    message: `You earned ${formattedAmount} from ${sourceName}'s subscription (Tier ${tier}).`,
    metadata: { amount, tier },
  });
}

export async function notifyWithdrawalUpdate(
  userId: string | mongoose.Types.ObjectId,
  status: string,
  amount: number,
  reason?: string
) {
  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

  const messages: Record<string, string> = {
    processing: `Your withdrawal of ${formattedAmount} is being processed.`,
    completed: `Your withdrawal of ${formattedAmount} has been sent to your bank account.`,
    failed: `Your withdrawal of ${formattedAmount} failed. ${reason || "Please try again."}`,
    rejected: `Your withdrawal of ${formattedAmount} was rejected. ${reason || "Please contact support."}`,
  };

  await createNotification({
    userId,
    type: "withdrawal_update",
    title:
      status === "completed"
        ? "Withdrawal Successful!"
        : status === "processing"
          ? "Withdrawal Processing"
          : "Withdrawal Update",
    message: messages[status] || `Your withdrawal status has been updated to ${status}.`,
    metadata: { amount, status },
  });
}

export async function notifyWelcome(
  userId: string | mongoose.Types.ObjectId,
  firstName: string
) {
  await createNotification({
    userId,
    type: "welcome",
    title: "Welcome to Primetrex!",
    message: `Hey ${firstName}, your account is now active! Head to your dashboard to grab your referral link and start earning commissions.`,
  });
}
