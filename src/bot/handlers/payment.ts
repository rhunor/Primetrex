import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { backButton } from "@/bot/keyboards/inline";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import BotPayment from "@/models/BotPayment";
import Plan from "@/models/Plan";
import { verifyPayment } from "@/bot/services/flutterwave";
import { generateInviteLink, sendInviteDM } from "@/bot/services/invite";

export function registerPaymentHandlers(bot: Bot<BotContext>) {
  // "I've Paid" callback
  bot.callbackQuery(CALLBACK.PAID, async (ctx) => {
    await ctx.answerCallbackQuery();
    await dbConnect();

    const userId = ctx.from!.id.toString();

    // Check if first-time subscriber
    const existing = await BotSubscriber.findOne({ userId });
    if (!existing) {
      // Also check if they have a pending payment
      const pendingPayment = await BotPayment.findOne({
        userId,
        status: "pending",
      });

      if (!pendingPayment) {
        const text =
          `${EMOJI.WARNING} <b>First Time Subscriber?</b>\n\n` +
          `You are a first time subscriber. Please use the <b>Subscribe</b> button to start your first plan.`;

        await ctx.editMessageText(text, { parse_mode: "HTML" });
        return;
      }
    }

    // Prompt for payment reference
    const text =
      `${EMOJI.SUCCESS} Verified via <b>Flutterwave</b>.\n\n` +
      `${EMOJI.SUCCESS} If you just paid, please send your <b>payment reference</b> (or transaction ID) here.`;

    ctx.session.step = "awaiting_payment_ref";

    await ctx.editMessageText(text, { parse_mode: "HTML" });
  });

  // Handle payment reference text input
  bot.on("message:text", async (ctx, next) => {
    if (ctx.session.step !== "awaiting_payment_ref") {
      return next();
    }

    const paymentRef = ctx.message.text.trim();
    const userId = ctx.from!.id.toString();
    ctx.session.step = undefined;

    await dbConnect();

    // Try to verify via Flutterwave
    try {
      const result = await verifyPayment(paymentRef);

      if (result.status === "success" && result.data.status === "successful") {
        // Update payment record
        await BotPayment.updateMany(
          { paymentRef },
          { status: "successful", flwRef: result.data.flw_ref }
        );

        // Find the payment to get plan info
        const payment = await BotPayment.findOne({ paymentRef });
        if (!payment) {
          await ctx.reply("Payment reference not found in our records.");
          return;
        }

        const plan = await Plan.findById(payment.planId);
        if (!plan) {
          await ctx.reply("Associated plan not found.");
          return;
        }

        const now = new Date();
        const expiryDate = new Date(
          now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
        );

        // Check for existing active sub
        const existingSub = await BotSubscriber.findOne({
          userId,
          channelId: plan.channelId,
          status: "active",
        });

        if (existingSub) {
          existingSub.expiryDate = new Date(
            existingSub.expiryDate.getTime() +
              plan.durationDays * 24 * 60 * 60 * 1000
          );
          await existingSub.save();
        } else {
          await BotSubscriber.create({
            userId,
            username: ctx.from?.username || null,
            firstName: ctx.from?.first_name || null,
            lastName: ctx.from?.last_name || null,
            planId: plan._id,
            channelId: plan.channelId,
            startDate: now,
            expiryDate,
            status: "active",
            addedBy: "payment",
          });
        }

        // Generate invite
        try {
          const inviteLink = await generateInviteLink(plan.channelId);
          const sent = await sendInviteDM(userId, plan.channelName, inviteLink);

          const expiryStr = expiryDate.toISOString().split("T")[0];
          const text =
            `${EMOJI.SUCCESS} <b>User Added Successfully!</b>\n` +
            `User ID: ${userId}\n` +
            `Channel: <b>${plan.channelName}</b>\n` +
            `Expires: ${expiryStr}\n\n` +
            (sent
              ? `${EMOJI.INVITE} Invite sent to user via DM.`
              : `${EMOJI.WARNING} Could not DM user.\n${inviteLink}`);

          await ctx.reply(text, {
            parse_mode: "HTML",
            reply_markup: backButton(CALLBACK.MAIN_MENU),
          });
        } catch {
          await ctx.reply(
            `${EMOJI.SUCCESS} Subscription activated but failed to generate invite link.`,
            { parse_mode: "HTML" }
          );
        }
      } else {
        await ctx.reply(
          `${EMOJI.CANCEL} Payment verification failed. Status: ${result.data?.status || "unknown"}.\n\nPlease check your payment reference and try again.`,
          { parse_mode: "HTML" }
        );
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      await ctx.reply(
        `${EMOJI.CANCEL} Could not verify payment. Please check your reference and try again.`
      );
    }
  });
}
