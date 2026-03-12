/**
 * Korapay webhook handler.
 *
 * Security:
 * 1. Signature verified: HMAC-SHA256(JSON.stringify(payload.data), KORA_SECRET_KEY)
 *    compared against the x-korapay-signature header (timing-safe).
 * 2. Idempotent: each payment type checks for an existing record before writing.
 * 3. Event types handled:
 *    - charge.success  → signup payments, bot subscription payments
 *    - transfer.success → withdrawal completed
 *    - transfer.failed  → withdrawal failed
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/korapay";
import dbConnect from "@/lib/db";
import BotPayment from "@/models/BotPayment";
import User from "@/models/User";
import Referral from "@/models/Referral";
import Transaction from "@/models/Transaction";
import Withdrawal from "@/models/Withdrawal";
import { activateSubscription } from "@/bot/services/subscription";
import {
  sendWelcomeEmail,
  sendOrderReceiptEmail,
  sendAffiliateCommissionEmail,
  generateOrderId,
} from "@/lib/email";
import { sendMessage } from "@/lib/telegram";
import {
  notifyWelcome,
  notifyCommissionEarned,
  notifyReferralSignup,
  notifyWithdrawalUpdate,
} from "@/lib/notifications";
import { siteConfig } from "@/config/site";

export async function POST(req: NextRequest) {
  // ── Verify signature ──────────────────────────────────────────────────────
  const signature = req.headers.get("x-korapay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const payload = await req.json();
  const { event, data } = payload;

  if (!verifyWebhookSignature(signature, data)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  await dbConnect();

  // ── Successful charge ──────────────────────────────────────────────────────
  if (event === "charge.success" && data?.status === "success") {
    const txRef: string = data.reference || "";

    // ── Web signup payment ─────────────────────────────────────────────────
    if (txRef.startsWith("PTXW-SIGNUP-")) {
      const email = data.customer?.email;
      if (!email) return NextResponse.json({ status: "ok" });

      // Look up by stored signupPaymentRef first (more reliable than email)
      let user = await User.findOne({ signupPaymentRef: txRef });
      if (!user && email) {
        user = await User.findOne({ email: email.toLowerCase() });
      }
      if (!user || user.hasPaidSignup) {
        return NextResponse.json({ status: "ok" });
      }

      const amount: number = data.amount ?? 0;

      user.hasPaidSignup = true;
      user.isActive = true;
      user.signupPaymentRef = txRef;
      await user.save();

      const orderId = generateOrderId();

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
          orderId,
          description: "Affiliate signup fee",
          metadata: { type: "signup" },
        });
      }

      sendOrderReceiptEmail({
        email: user.email,
        firstName: user.firstName,
        orderId,
        amount,
        description: "Primetrex Affiliate Signup Fee",
        paymentReference: txRef,
      }).catch(() => {});

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
          const tier1Referrer = await User.findById(user.referredBy);
          const tier1Rate = tier1Referrer?.isSpecialAffiliate
            ? 60
            : siteConfig.commission.tier1Rate;
          const tier1Amount = amount * (tier1Rate / 100);
          await Transaction.create({
            userId: user.referredBy,
            type: "commission",
            amount: tier1Amount,
            tier: 1,
            status: "completed",
            sourceUserId: user._id,
            paymentReference: txRef,
            orderId,
            description: `Tier 1 commission from ${user.firstName} ${user.lastName} (signup)`,
          });

          notifyCommissionEarned(
            user.referredBy,
            tier1Amount,
            1,
            `${user.firstName} ${user.lastName}`
          ).catch(() => {});
          if (tier1Referrer) {
            sendAffiliateCommissionEmail({
              affiliateEmail: tier1Referrer.email,
              affiliateFirstName: tier1Referrer.firstName,
              buyerName: `${user.firstName} ${user.lastName}`,
              commissionAmount: tier1Amount,
              orderId,
              tier: 1,
              paymentReference: txRef,
            }).catch(() => {});
          }

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
              orderId,
              description: `Tier 2 commission from ${user.firstName} ${user.lastName} (signup)`,
            });

            notifyCommissionEarned(
              tier1Referrer.referredBy,
              tier2Amount,
              2,
              `${user.firstName} ${user.lastName}`
            ).catch(() => {});

            const tier2Referrer = await User.findById(tier1Referrer.referredBy);
            if (tier2Referrer) {
              sendAffiliateCommissionEmail({
                affiliateEmail: tier2Referrer.email,
                affiliateFirstName: tier2Referrer.firstName,
                buyerName: `${user.firstName} ${user.lastName}`,
                commissionAmount: tier2Amount,
                orderId,
                tier: 2,
                paymentReference: `${txRef}-t2`,
              }).catch(() => {});
            }
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

    // ── Web-initiated bot subscription (PTXW-BOT-NEW- or PTXW-BOT-REN-) ───
    if (txRef.startsWith("PTXW-BOT-")) {
      const botPayment = await BotPayment.findOne({ paymentRef: txRef });

      if (!botPayment || botPayment.status === "successful") {
        return NextResponse.json({ status: "ok" });
      }

      // Store Korapay payment reference for records
      await BotPayment.updateOne(
        { paymentRef: txRef },
        { flwRef: data.payment_reference ?? txRef }
      );

      await activateSubscription(txRef);

      if (botPayment.webUserId) {
        const paidAmount: number = botPayment.amount;
        const webUser = await User.findById(botPayment.webUserId);
        const subOrderId = generateOrderId();

        if (webUser?.referredBy) {
          const existingComm = await Transaction.findOne({
            paymentReference: txRef,
            type: "commission",
          });

          if (!existingComm) {
            const tier1Referrer = await User.findById(webUser.referredBy);
            const subRate = tier1Referrer?.isSpecialAffiliate
              ? 60
              : siteConfig.commission.subscriptionRate;
            const tier1Amount = paidAmount * (subRate / 100);
            await Transaction.create({
              userId: webUser.referredBy,
              type: "commission",
              amount: tier1Amount,
              tier: 1,
              status: "completed",
              sourceUserId: webUser._id,
              paymentReference: txRef,
              orderId: subOrderId,
              description: `Tier 1 commission from ${webUser.firstName} ${webUser.lastName} (bot sub via web)`,
            });
            notifyCommissionEarned(
              webUser.referredBy,
              tier1Amount,
              1,
              `${webUser.firstName} ${webUser.lastName}`
            ).catch(() => {});
            if (tier1Referrer) {
              sendAffiliateCommissionEmail({
                affiliateEmail: tier1Referrer.email,
                affiliateFirstName: tier1Referrer.firstName,
                buyerName: `${webUser.firstName} ${webUser.lastName}`,
                commissionAmount: tier1Amount,
                orderId: subOrderId,
                tier: 1,
                paymentReference: txRef,
              }).catch(() => {});
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
                orderId: subOrderId,
                description: `Tier 2 commission from ${webUser.firstName} ${webUser.lastName} (bot sub via web)`,
              });
              notifyCommissionEarned(
                tier1Referrer.referredBy,
                tier2Amount,
                2,
                `${webUser.firstName} ${webUser.lastName}`
              ).catch(() => {});

              const tier2Referrer = await User.findById(tier1Referrer.referredBy);
              if (tier2Referrer) {
                sendAffiliateCommissionEmail({
                  affiliateEmail: tier2Referrer.email,
                  affiliateFirstName: tier2Referrer.firstName,
                  buyerName: `${webUser.firstName} ${webUser.lastName}`,
                  commissionAmount: tier2Amount,
                  orderId: subOrderId,
                  tier: 2,
                  paymentReference: `${txRef}-t2`,
                }).catch(() => {});
              }
            }
          }
        }
      }

      return NextResponse.json({ status: "ok" });
    }

    // ── Direct bot subscription payment (PTRX-…) ─────────────────────────
    if (txRef.startsWith("PTRX-")) {
      const botPaymentCheck = await BotPayment.findOne({ paymentRef: txRef });
      if (botPaymentCheck && botPaymentCheck.status === "successful") {
        return NextResponse.json({ status: "ok" });
      }

      await BotPayment.updateMany(
        { paymentRef: txRef },
        { flwRef: data.payment_reference ?? txRef }
      );

      await activateSubscription(txRef);

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
            const tier1Referrer = await User.findById(webUser.referredBy);
            const subRate = tier1Referrer?.isSpecialAffiliate
              ? 60
              : siteConfig.commission.subscriptionRate;
            const tier1Amount = paidAmount * (subRate / 100);
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
          const referrer = await User.findOne({
            referralCode: botPayment.referralCode,
          });
          if (referrer) {
            const subRate = referrer.isSpecialAffiliate
              ? 60
              : siteConfig.commission.subscriptionRate;
            const tier1Amount = paidAmount * (subRate / 100);
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
              const tier2Amount =
                paidAmount * (siteConfig.commission.tier2Rate / 100);
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

  // ── Transfer completed (withdrawal paid out) ───────────────────────────────
  if (event === "transfer.success") {
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

  // ── Transfer failed ────────────────────────────────────────────────────────
  if (event === "transfer.failed") {
    const reference: string = data?.reference || "";

    const withdrawal = await Withdrawal.findOne({ transferReference: reference });
    if (withdrawal && withdrawal.status !== "completed") {
      withdrawal.status = "failed";
      withdrawal.rejectionReason =
        data?.reason || "Transfer failed. Please try again.";
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
