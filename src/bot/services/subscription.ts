import dbConnect from "@/lib/db";
import BotPayment from "@/models/BotPayment";
import BotSubscriber from "@/models/BotSubscriber";
import Plan from "@/models/Plan";
import { generateInviteLink, sendInviteDM } from "./invite";

/**
 * Activate a subscription after successful payment verification.
 * Called from Flutterwave webhook or manual "I've Paid" verification.
 */
export async function activateSubscription(txRef: string): Promise<{
  success: boolean;
  message: string;
  inviteLink?: string;
  subscriber?: InstanceType<typeof BotSubscriber>;
}> {
  await dbConnect();

  const payment = await BotPayment.findOne({ paymentRef: txRef });
  if (!payment) {
    return { success: false, message: "Payment record not found." };
  }

  if (payment.status === "successful") {
    return { success: false, message: "Payment already processed." };
  }

  const plan = await Plan.findById(payment.planId);
  if (!plan) {
    return { success: false, message: "Plan not found." };
  }

  const now = new Date();
  const expiryDate = new Date(
    now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
  );

  // Check for existing active subscription
  const existing = await BotSubscriber.findOne({
    userId: payment.userId,
    channelId: plan.channelId,
    status: "active",
  });

  if (existing) {
    // Extend existing subscription
    existing.expiryDate = new Date(
      existing.expiryDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
    );
    await existing.save();

    payment.status = "successful";
    await payment.save();

    return {
      success: true,
      message: "Subscription extended.",
      subscriber: existing,
    };
  }

  // Create new subscription
  const subscriber = await BotSubscriber.create({
    userId: payment.userId,
    planId: plan._id,
    channelId: plan.channelId,
    startDate: now,
    expiryDate,
    status: "active",
    addedBy: "payment",
  });

  payment.status = "successful";
  await payment.save();

  // Generate invite link and DM
  try {
    const inviteLink = await generateInviteLink(plan.channelId);
    await sendInviteDM(payment.userId, plan.channelName, inviteLink);
    return { success: true, message: "Subscription activated.", inviteLink, subscriber };
  } catch (error) {
    console.error("Failed to generate invite link:", error);
    return { success: true, message: "Subscription activated but invite link failed.", subscriber };
  }
}

/**
 * Manually activate a subscriber (admin action).
 */
export async function manualActivateSubscriber(params: {
  userId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  planId: string;
  startDate: Date;
  expiryDate: Date;
}): Promise<{
  success: boolean;
  message: string;
  inviteLink?: string;
  subscriber?: InstanceType<typeof BotSubscriber>;
}> {
  await dbConnect();

  const plan = await Plan.findById(params.planId);
  if (!plan) {
    return { success: false, message: "Plan not found." };
  }

  // Check for duplicate
  const existing = await BotSubscriber.findOne({
    userId: params.userId,
    channelId: plan.channelId,
    status: "active",
  });

  if (existing) {
    return { success: false, message: "duplicate" };
  }

  const subscriber = await BotSubscriber.create({
    userId: params.userId,
    username: params.username || null,
    firstName: params.firstName || null,
    lastName: params.lastName || null,
    planId: plan._id,
    channelId: plan.channelId,
    startDate: params.startDate,
    expiryDate: params.expiryDate,
    status: "active",
    addedBy: "manual",
  });

  // Generate invite and DM
  try {
    const inviteLink = await generateInviteLink(plan.channelId);
    const dmSent = await sendInviteDM(
      params.userId,
      plan.channelName,
      inviteLink
    );
    return {
      success: true,
      message: dmSent ? "invite_sent" : "invite_failed",
      inviteLink,
      subscriber,
    };
  } catch (error) {
    console.error("Failed to generate invite link:", error);
    return {
      success: true,
      message: "invite_failed",
      subscriber,
    };
  }
}
