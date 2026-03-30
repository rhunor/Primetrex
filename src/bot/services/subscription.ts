import dbConnect from "@/lib/db";
import BotPayment from "@/models/BotPayment";
import BotSubscriber from "@/models/BotSubscriber";
import Plan from "@/models/Plan";
import { generateMultiChannelInvites, sendMultiChannelInviteDM, sleep, RATE_LIMIT_DELAY_MS } from "./invite";

/**
 * Activate a subscription after successful payment verification.
 * Called from webhook or manual "I've Paid" verification.
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

  const channels = plan.channels?.length ? plan.channels : [{ channelId: plan.channelId, channelName: plan.channelName }];
  const now = new Date();
  const durationMs = plan.durationDays * 24 * 60 * 60 * 1000;
  let firstSubscriber: InstanceType<typeof BotSubscriber> | undefined;

  for (const channel of channels) {
    const existing = await BotSubscriber.findOne({
      userId: payment.userId,
      channelId: channel.channelId,
      status: "active",
    });

    if (existing) {
      existing.expiryDate = new Date(existing.expiryDate.getTime() + durationMs);
      await existing.save();
      if (!firstSubscriber) firstSubscriber = existing;
    } else {
      const sub = await BotSubscriber.create({
        userId: payment.userId,
        planId: plan._id,
        channelId: channel.channelId,
        startDate: now,
        expiryDate: new Date(now.getTime() + durationMs),
        status: "active",
        addedBy: "payment",
      });
      if (!firstSubscriber) firstSubscriber = sub;
    }
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  payment.status = "successful";
  await payment.save();

  // Generate invite links for all channels and send combined DM
  try {
    const invites = await generateMultiChannelInvites(channels);
    await sendMultiChannelInviteDM(payment.userId, invites);
    return { success: true, message: "Subscription activated.", inviteLink: invites[0]?.link, subscriber: firstSubscriber };
  } catch (error) {
    console.error("Failed to generate invite links:", error);
    return { success: true, message: "Subscription activated but invite links failed.", subscriber: firstSubscriber };
  }
}

/**
 * Manually activate a subscriber (admin action).
 * Adds user to all channels on the plan. If already active, resends invite links.
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

  const channels = plan.channels?.length ? plan.channels : [{ channelId: plan.channelId, channelName: plan.channelName }];
  let firstSubscriber: InstanceType<typeof BotSubscriber> | undefined;

  for (const channel of channels) {
    const existing = await BotSubscriber.findOne({
      userId: params.userId,
      channelId: channel.channelId,
      status: "active",
    });

    if (!existing) {
      const sub = await BotSubscriber.create({
        userId: params.userId,
        username: params.username || null,
        firstName: params.firstName || null,
        lastName: params.lastName || null,
        planId: plan._id,
        channelId: channel.channelId,
        startDate: params.startDate,
        expiryDate: params.expiryDate,
        status: "active",
        addedBy: "manual",
      });
      if (!firstSubscriber) firstSubscriber = sub;
    } else {
      if (!firstSubscriber) firstSubscriber = existing;
    }
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  // Generate invite links for all channels and send combined DM
  try {
    const invites = await generateMultiChannelInvites(channels);
    const dmSent = await sendMultiChannelInviteDM(params.userId, invites);
    return {
      success: true,
      message: dmSent ? "invite_sent" : "invite_failed",
      inviteLink: invites[0]?.link,
      subscriber: firstSubscriber,
    };
  } catch (error) {
    console.error("Failed to generate invite links:", error);
    return { success: true, message: "invite_failed", subscriber: firstSubscriber };
  }
}
