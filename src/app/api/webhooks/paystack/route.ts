import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Referral from "@/models/Referral";
import Transaction from "@/models/Transaction";
import Withdrawal from "@/models/Withdrawal";
import { sendMessage } from "@/lib/telegram";
import { sendWelcomeEmail } from "@/lib/email";
import {
  notifyWelcome,
  notifyCommissionEarned,
  notifyReferralSignup,
  notifyWithdrawalUpdate,
} from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY!;
    const hash = crypto
      .createHmac("sha512", secret)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    await dbConnect();

    // --- Handle successful charge (signup or subscription payment) ---
    if (event.event === "charge.success") {
      const { reference, amount, customer, metadata } = event.data;

      if (metadata?.type === "signup") {
        // Affiliate signup payment confirmed
        const user = await User.findOne({ email: customer.email });

        if (user && !user.hasPaidSignup) {
          user.hasPaidSignup = true;
          user.isActive = true;
          user.signupPaymentRef = reference;
          await user.save();

          // Record the transaction
          await Transaction.create({
            userId: user._id,
            type: "subscription",
            amount: amount / 100,
            status: "completed",
            paymentReference: reference,
            description: "Affiliate signup fee",
            metadata: { type: "signup" },
          });

          // Activate referral records if this user was referred
          if (user.referredBy) {
            await Referral.updateMany(
              { referredUserId: user._id },
              { status: "active" }
            );
          }

          // Send welcome email
          sendWelcomeEmail(user.email, user.firstName).catch(() => {});

          // In-app welcome notification
          notifyWelcome(user._id, user.firstName).catch(() => {});

          // Notify referrer that their referral signed up
          if (user.referredBy) {
            notifyReferralSignup(
              user.referredBy,
              `${user.firstName} ${user.lastName}`
            ).catch(() => {});
          }

          // Notify via Telegram if linked
          if (user.telegramId) {
            await sendMessage(
              parseInt(user.telegramId),
              `<b>Account Activated!</b>\n\nYour Primetrex account is now active. Welcome aboard!`
            ).catch(() => {});
          }
        }
      } else if (metadata?.type === "subscription") {
        // Monthly subscription payment — credit commissions
        const subscriber = await User.findById(metadata.userId);

        if (subscriber) {
          const subscriptionAmount = amount / 100;

          // Record the subscription transaction
          await Transaction.create({
            userId: subscriber._id,
            type: "subscription",
            amount: subscriptionAmount,
            status: "completed",
            paymentReference: reference,
            description: "Monthly subscription payment",
            metadata: { type: "subscription" },
          });

          // Credit Tier 1 commission (50%)
          if (subscriber.referredBy) {
            const tier1Amount = subscriptionAmount * 0.5;
            await Transaction.create({
              userId: subscriber.referredBy,
              type: "commission",
              amount: tier1Amount,
              tier: 1,
              status: "completed",
              sourceUserId: subscriber._id,
              paymentReference: reference,
              description: `Tier 1 commission from ${subscriber.firstName} ${subscriber.lastName}`,
            });

            // In-app notification for Tier 1 commission
            notifyCommissionEarned(
              subscriber.referredBy,
              tier1Amount,
              1,
              `${subscriber.firstName} ${subscriber.lastName}`
            ).catch(() => {});

            // Notify Tier 1 referrer via Telegram
            const tier1Referrer = await User.findById(subscriber.referredBy);
            if (tier1Referrer?.telegramId) {
              await sendMessage(
                parseInt(tier1Referrer.telegramId),
                `<b>Commission Earned!</b>\n\n` +
                  `You earned a Tier 1 commission of <b>₦${tier1Amount.toLocaleString()}</b>\n` +
                  `From: ${subscriber.firstName} ${subscriber.lastName}\n\n` +
                  `This has been added to your wallet balance.`
              ).catch(() => {});
            }

            // Credit Tier 2 commission (10%)
            if (tier1Referrer?.referredBy) {
              const tier2Amount = subscriptionAmount * 0.1;
              await Transaction.create({
                userId: tier1Referrer.referredBy,
                type: "commission",
                amount: tier2Amount,
                tier: 2,
                status: "completed",
                sourceUserId: subscriber._id,
                paymentReference: reference,
                description: `Tier 2 commission from ${subscriber.firstName} ${subscriber.lastName}`,
              });

              // In-app notification for Tier 2 commission
              notifyCommissionEarned(
                tier1Referrer.referredBy,
                tier2Amount,
                2,
                `${subscriber.firstName} ${subscriber.lastName}`
              ).catch(() => {});

              // Notify Tier 2 referrer via Telegram
              const tier2Referrer = await User.findById(
                tier1Referrer.referredBy
              );
              if (tier2Referrer?.telegramId) {
                await sendMessage(
                  parseInt(tier2Referrer.telegramId),
                  `<b>Commission Earned!</b>\n\n` +
                    `You earned a Tier 2 commission of <b>₦${tier2Amount.toLocaleString()}</b>\n` +
                    `From: ${subscriber.firstName} ${subscriber.lastName}\n\n` +
                    `This has been added to your wallet balance.`
                ).catch(() => {});
              }
            }
          }

          // Notify subscriber via Telegram
          if (subscriber.telegramId) {
            await sendMessage(
              parseInt(subscriber.telegramId),
              `<b>Payment Confirmed!</b>\n\n` +
                `Your monthly subscription of ₦${subscriptionAmount.toLocaleString()} has been confirmed.\n` +
                `Your copy trading access is now active.`
            ).catch(() => {});
          }
        }
      }
    }

    // --- Handle transfer success (withdrawal completed) ---
    if (event.event === "transfer.success") {
      const { reference } = event.data;

      const withdrawal = await Withdrawal.findOne({
        paystackReference: reference,
      });
      if (withdrawal && withdrawal.status !== "completed") {
        withdrawal.status = "completed";
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        // In-app notification
        notifyWithdrawalUpdate(
          withdrawal.userId,
          "completed",
          withdrawal.amount
        ).catch(() => {});

        // Notify user via Telegram
        const user = await User.findById(withdrawal.userId);
        if (user?.telegramId) {
          await sendMessage(
            parseInt(user.telegramId),
            `<b>Withdrawal Completed!</b>\n\n` +
              `₦${withdrawal.amount.toLocaleString()} has been sent to your bank account.\n` +
              `Bank: ${withdrawal.bankName}\n` +
              `Account: ${withdrawal.accountNumber}`
          ).catch(() => {});
        }
      }
    }

    // --- Handle transfer failure ---
    if (event.event === "transfer.failed") {
      const { reference } = event.data;

      const withdrawal = await Withdrawal.findOne({
        paystackReference: reference,
      });
      if (withdrawal && withdrawal.status !== "completed") {
        withdrawal.status = "failed";
        withdrawal.rejectionReason = "Transfer failed. Please try again.";
        await withdrawal.save();

        // In-app notification
        notifyWithdrawalUpdate(
          withdrawal.userId,
          "failed",
          withdrawal.amount,
          "Transfer failed. Please try again."
        ).catch(() => {});

        // Notify user via Telegram
        const user = await User.findById(withdrawal.userId);
        if (user?.telegramId) {
          await sendMessage(
            parseInt(user.telegramId),
            `<b>Withdrawal Failed</b>\n\n` +
              `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} could not be processed.\n` +
              `Please verify your bank details and try again from the dashboard.`
          ).catch(() => {});
        }
      }
    }

    // --- Handle transfer reversal ---
    if (event.event === "transfer.reversed") {
      const { reference } = event.data;

      const withdrawal = await Withdrawal.findOne({
        paystackReference: reference,
      });
      if (withdrawal) {
        withdrawal.status = "failed";
        withdrawal.rejectionReason = "Transfer was reversed by the bank.";
        await withdrawal.save();

        // In-app notification
        notifyWithdrawalUpdate(
          withdrawal.userId,
          "failed",
          withdrawal.amount,
          "Transfer was reversed by the bank."
        ).catch(() => {});

        const user = await User.findById(withdrawal.userId);
        if (user?.telegramId) {
          await sendMessage(
            parseInt(user.telegramId),
            `<b>Withdrawal Reversed</b>\n\n` +
              `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} was reversed.\n` +
              `The funds have been returned to your wallet balance.\n` +
              `Please verify your bank details and try again.`
          ).catch(() => {});
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
