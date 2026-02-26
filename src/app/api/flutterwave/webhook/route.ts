import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BotPayment from "@/models/BotPayment";
import User from "@/models/User";
import Referral from "@/models/Referral";
import Transaction from "@/models/Transaction";
import Withdrawal from "@/models/Withdrawal";
import { activateSubscription } from "@/bot/services/subscription";
import { sendWelcomeEmail } from "@/lib/email";
import { sendMessage } from "@/lib/telegram";
import {
  notifyWelcome,
  notifyCommissionEarned,
  notifyReferralSignup,
  notifyWithdrawalUpdate,
} from "@/lib/notifications";
import { siteConfig } from "@/config/site";

export async function POST(req: NextRequest) {
  // Verify Flutterwave webhook signature
  const signature = req.headers.get("verif-hash");
  if (signature !== process.env.FLW_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = await req.json();
  const { event, data } = payload;

  await dbConnect();

  // ── Successful charge ────────────────────────────────────────────────────────
  if (event === "charge.completed" && data?.status === "successful") {
    const txRef: string = data.tx_ref || "";

    // ── Web signup payment ─────────────────────────────────────────────────────
    if (txRef.startsWith("PTXW-SIGNUP-")) {
      const email = data.customer?.email;
      if (!email) return NextResponse.json({ status: "ok" });

      const user = await User.findOne({ email });
      if (!user || user.hasPaidSignup) {
        return NextResponse.json({ status: "ok" });
      }

      const amount: number = data.amount ?? 0;

      user.hasPaidSignup = true;
      user.isActive = true;
      user.signupPaymentRef = txRef;
      await user.save();

      const existingTx = await Transaction.findOne({
        paymentReference: txRef,
        type: "subscription",
      });
      if (!existingTx) {
        await Transaction.create({
          userId: user._id,
          type: "subscription",
          amount,
          status: "completed",
          paymentReference: txRef,
          description: "Affiliate signup fee",
          metadata: { type: "signup" },
        });
      }

      if (user.referredBy) {
        await Referral.updateMany(
          { referredUserId: user._id },
          { status: "active" }
        );

        const existingCommission = await Transaction.findOne({
          paymentReference: txRef,
          type: "commission",
        });

        if (!existingCommission) {
          const tier1Amount = amount * (siteConfig.commission.tier1Rate / 100);
          await Transaction.create({
            userId: user.referredBy,
            type: "commission",
            amount: tier1Amount,
            tier: 1,
            status: "completed",
            sourceUserId: user._id,
            paymentReference: txRef,
            description: `Tier 1 commission from ${user.firstName} ${user.lastName} (signup)`,
          });

          notifyCommissionEarned(
            user.referredBy,
            tier1Amount,
            1,
            `${user.firstName} ${user.lastName}`
          ).catch(() => {});

          const tier1Referrer = await User.findById(user.referredBy);
          if (tier1Referrer?.referredBy) {
            const tier2Amount = amount * (siteConfig.commission.tier2Rate / 100);
            await Transaction.create({
              userId: tier1Referrer.referredBy,
              type: "commission",
              amount: tier2Amount,
              tier: 2,
              status: "completed",
              sourceUserId: user._id,
              paymentReference: `${txRef}-t2`,
              description: `Tier 2 commission from ${user.firstName} ${user.lastName} (signup)`,
            });

            notifyCommissionEarned(
              tier1Referrer.referredBy,
              tier2Amount,
              2,
              `${user.firstName} ${user.lastName}`
            ).catch(() => {});
          }
        }

        notifyReferralSignup(
          user.referredBy,
          `${user.firstName} ${user.lastName}`
        ).catch(() => {});
      }

      sendWelcomeEmail(user.email, user.firstName).catch(() => {});
      notifyWelcome(user._id, user.firstName).catch(() => {});

      if (user.telegramId) {
        sendMessage(
          parseInt(user.telegramId),
          `<b>Account Activated!</b>\n\nYour Primetrex account is now active. Welcome aboard!`
        ).catch(() => {});
      }

      return NextResponse.json({ status: "ok" });
    }

    // ── Web-initiated bot subscription (PTXW-BOT-NEW- or PTXW-BOT-REN-) ───────
    if (txRef.startsWith("PTXW-BOT-")) {
      const botPayment = await BotPayment.findOne({ paymentRef: txRef });

      // Idempotency: skip if already processed
      if (!botPayment || botPayment.status === "successful") {
        return NextResponse.json({ status: "ok" });
      }

      // Store flwRef without touching status — activateSubscription handles that atomically
      await BotPayment.updateOne({ paymentRef: txRef }, { flwRef: data.flw_ref });

      // Activate subscription: sets payment.status="successful", creates BotSubscriber, sends invite DM
      await activateSubscription(txRef);

      // Generate commissions via the web user's referredBy chain
      if (botPayment.webUserId) {
        const paidAmount: number = botPayment.amount;
        const webUser = await User.findById(botPayment.webUserId);

        if (webUser?.referredBy) {
          const existingComm = await Transaction.findOne({
            paymentReference: txRef,
            type: "commission",
          });

          if (!existingComm) {
            const tier1Amount = paidAmount * (siteConfig.commission.tier1Rate / 100);
            await Transaction.create({
              userId: webUser.referredBy,
              type: "commission",
              amount: tier1Amount,
              tier: 1,
              status: "completed",
              sourceUserId: webUser._id,
              paymentReference: txRef,
              description: `Tier 1 commission from ${webUser.firstName} ${webUser.lastName} (bot sub via web)`,
            });
            notifyCommissionEarned(
              webUser.referredBy,
              tier1Amount,
              1,
              `${webUser.firstName} ${webUser.lastName}`
            ).catch(() => {});

            const tier1Referrer = await User.findById(webUser.referredBy);
            if (tier1Referrer?.referredBy) {
              const tier2Amount = paidAmount * (siteConfig.commission.tier2Rate / 100);
              await Transaction.create({
                userId: tier1Referrer.referredBy,
                type: "commission",
                amount: tier2Amount,
                tier: 2,
                status: "completed",
                sourceUserId: webUser._id,
                paymentReference: `${txRef}-t2`,
                description: `Tier 2 commission from ${webUser.firstName} ${webUser.lastName} (bot sub via web)`,
              });
              notifyCommissionEarned(
                tier1Referrer.referredBy,
                tier2Amount,
                2,
                `${webUser.firstName} ${webUser.lastName}`
              ).catch(() => {});
            }
          }
        }
      }

      return NextResponse.json({ status: "ok" });
    }

    // ── Bot subscription payment (PTRX-…) ─────────────────────────────────────
    if (txRef.startsWith("PTRX-")) {
      const botPaymentCheck = await BotPayment.findOne({ paymentRef: txRef });
      // Idempotent: skip if already processed
      if (botPaymentCheck && botPaymentCheck.status === "successful") {
        return NextResponse.json({ status: "ok" });
      }

      // Store flwRef without setting status — activateSubscription handles that atomically
      await BotPayment.updateMany(
        { paymentRef: txRef },
        { flwRef: data.flw_ref }
      );

      await activateSubscription(txRef);

      // Commission for bot subscription — link Telegram user to web account
      const botPayment = await BotPayment.findOne({ paymentRef: txRef });
      if (botPayment) {
        const paidAmount: number = botPayment.amount;
        const webUser = await User.findOne({ telegramId: botPayment.userId });

        const existingComm = await Transaction.findOne({
          paymentReference: txRef,
          type: "commission",
        });

        if (webUser?.referredBy) {
          if (!existingComm) {
            const tier1Amount =
              paidAmount * (siteConfig.commission.tier1Rate / 100);
            await Transaction.create({
              userId: webUser.referredBy,
              type: "commission",
              amount: tier1Amount,
              tier: 1,
              status: "completed",
              sourceUserId: webUser._id,
              paymentReference: txRef,
              description: `Tier 1 commission from ${webUser.firstName} ${webUser.lastName} (subscription)`,
            });

            notifyCommissionEarned(
              webUser.referredBy,
              tier1Amount,
              1,
              `${webUser.firstName} ${webUser.lastName}`
            ).catch(() => {});

            const tier1Referrer = await User.findById(webUser.referredBy);
            if (tier1Referrer?.telegramId) {
              sendMessage(
                parseInt(tier1Referrer.telegramId),
                `<b>Commission Earned!</b>\n\n` +
                  `You earned \u20a6${tier1Amount.toLocaleString()} (Tier 1)\n` +
                  `From: ${webUser.firstName} ${webUser.lastName}'s subscription`
              ).catch(() => {});
            }

            if (tier1Referrer?.referredBy) {
              const tier2Amount =
                paidAmount * (siteConfig.commission.tier2Rate / 100);
              await Transaction.create({
                userId: tier1Referrer.referredBy,
                type: "commission",
                amount: tier2Amount,
                tier: 2,
                status: "completed",
                sourceUserId: webUser._id,
                paymentReference: `${txRef}-t2`,
                description: `Tier 2 commission from ${webUser.firstName} ${webUser.lastName} (subscription)`,
              });

              notifyCommissionEarned(
                tier1Referrer.referredBy,
                tier2Amount,
                2,
                `${webUser.firstName} ${webUser.lastName}`
              ).catch(() => {});
            }
          }
        } else if (!webUser && botPayment.referralCode && !existingComm) {
          // Referral code fallback: bot user not linked to a web account but typed a referral code
          const referrer = await User.findOne({ referralCode: botPayment.referralCode });
          if (referrer) {
            const tier1Amount = paidAmount * (siteConfig.commission.tier1Rate / 100);
            await Transaction.create({
              userId: referrer._id,
              type: "commission",
              amount: tier1Amount,
              tier: 1,
              status: "completed",
              sourceUserId: null,
              paymentReference: txRef,
              description: `Tier 1 commission from Telegram subscriber (ref: ${botPayment.referralCode})`,
            });
            notifyCommissionEarned(
              referrer._id,
              tier1Amount,
              1,
              "a Telegram subscriber"
            ).catch(() => {});

            if (referrer.referredBy) {
              const tier2Amount = paidAmount * (siteConfig.commission.tier2Rate / 100);
              await Transaction.create({
                userId: referrer.referredBy,
                type: "commission",
                amount: tier2Amount,
                tier: 2,
                status: "completed",
                sourceUserId: null,
                paymentReference: `${txRef}-t2`,
                description: `Tier 2 commission from Telegram subscriber (ref: ${botPayment.referralCode})`,
              });
              notifyCommissionEarned(
                referrer.referredBy,
                tier2Amount,
                2,
                "a Telegram subscriber"
              ).catch(() => {});
            }
          }
        }
      }

      return NextResponse.json({ status: "ok" });
    }
  }

  // ── Transfer completed (withdrawal paid out) ──────────────────────────────────
  if (event === "transfer.completed") {
    const reference: string = data?.reference || "";

    const withdrawal = await Withdrawal.findOne({ transferReference: reference });
    if (withdrawal && withdrawal.status !== "completed") {
      withdrawal.status = "completed";
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      notifyWithdrawalUpdate(
        withdrawal.userId,
        "completed",
        withdrawal.amount
      ).catch(() => {});

      const user = await User.findById(withdrawal.userId);
      if (user?.telegramId) {
        sendMessage(
          parseInt(user.telegramId),
          `<b>Withdrawal Completed!</b>\n\n` +
            `\u20a6${withdrawal.amount.toLocaleString()} has been sent to your bank account.\n` +
            `Bank: ${withdrawal.bankName}\n` +
            `Account: ${withdrawal.accountNumber}`
        ).catch(() => {});
      }
    }

    return NextResponse.json({ status: "ok" });
  }

  // ── Transfer failed ───────────────────────────────────────────────────────────
  if (event === "transfer.failed") {
    const reference: string = data?.reference || "";

    const withdrawal = await Withdrawal.findOne({ transferReference: reference });
    if (withdrawal && withdrawal.status !== "completed") {
      withdrawal.status = "failed";
      withdrawal.rejectionReason =
        data?.complete_message || "Transfer failed. Please try again.";
      await withdrawal.save();

      notifyWithdrawalUpdate(
        withdrawal.userId,
        "failed",
        withdrawal.amount,
        withdrawal.rejectionReason ?? undefined
      ).catch(() => {});

      const user = await User.findById(withdrawal.userId);
      if (user?.telegramId) {
        sendMessage(
          parseInt(user.telegramId),
          `<b>Withdrawal Failed</b>\n\n` +
            `Your withdrawal of \u20a6${withdrawal.amount.toLocaleString()} could not be processed.\n` +
            `Please verify your bank details and try again.`
        ).catch(() => {});
      }
    }

    return NextResponse.json({ status: "ok" });
  }

  return NextResponse.json({ status: "ok" });
}
