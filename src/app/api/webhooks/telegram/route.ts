import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import {
  sendMessage,
  answerCallbackQuery,
  parseCommand,
  type TelegramUpdate,
} from "@/lib/telegram";
import {
  initializePayment,
  generatePaymentReference,
} from "@/lib/paystack";
import { siteConfig } from "@/config/site";
import { formatCurrency } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
    if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update: TelegramUpdate = await req.json();
    await dbConnect();

    // Handle text messages (commands)
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const telegramUserId = update.message.from.id;
      const parsed = parseCommand(update.message.text);

      if (!parsed) {
        await sendMessage(
          chatId,
          "I don't understand that. Use /help to see available commands."
        );
        return NextResponse.json({ ok: true });
      }

      const { command, payload } = parsed;

      switch (command) {
        case "start": {
          if (payload.startsWith("link_")) {
            // Deep link: link Telegram to Primetrex account
            const referralCode = payload.replace("link_", "");
            const user = await User.findOne({ referralCode });

            if (!user) {
              await sendMessage(
                chatId,
                "Invalid link. Please check your referral code and try again."
              );
              break;
            }

            if (
              user.telegramLinked &&
              user.telegramId !== telegramUserId.toString()
            ) {
              await sendMessage(
                chatId,
                "This account is already linked to a different Telegram user."
              );
              break;
            }

            user.telegramId = telegramUserId.toString();
            user.telegramLinked = true;
            await user.save();

            await sendMessage(
              chatId,
              `<b>Account Linked Successfully!</b>\n\n` +
                `Name: ${user.firstName} ${user.lastName}\n` +
                `Email: ${user.email}\n\n` +
                `Use /subscribe to pay your monthly copy trading subscription.\n` +
                `Use /status to check your account status.`
            );
          } else {
            // Generic /start
            await sendMessage(
              chatId,
              `<b>Welcome to Primetrex Bot!</b>\n\n` +
                `${siteConfig.tagline}\n\n` +
                `<b>Available Commands:</b>\n` +
                `/subscribe - Pay monthly subscription (${formatCurrency(siteConfig.subscription.price)})\n` +
                `/status - Check your account status\n` +
                `/help - Show help information\n\n` +
                `To link your account, go to your dashboard Settings page and click "Link Telegram".`
            );
          }
          break;
        }

        case "subscribe": {
          const user = await User.findOne({
            telegramId: telegramUserId.toString(),
          });

          if (!user) {
            await sendMessage(
              chatId,
              "Your Telegram is not linked to any Primetrex account.\n\n" +
                "Please visit your dashboard Settings page to link your account first."
            );
            break;
          }

          if (!user.isActive) {
            await sendMessage(
              chatId,
              "Your account is not active. Please complete your signup payment on the website first.\n\n" +
                `Visit: ${process.env.NEXT_PUBLIC_APP_URL || "https://primetrex.com"}/register`
            );
            break;
          }

          // Generate Paystack payment link
          const reference = generatePaymentReference();
          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

          const response = await initializePayment({
            email: user.email,
            amount: siteConfig.subscription.price * 100, // kobo
            reference,
            callbackUrl: `${appUrl}/dashboard?payment=success&reference=${reference}`,
            metadata: {
              type: "subscription",
              userId: user._id.toString(),
              telegramId: telegramUserId.toString(),
            },
          });

          await sendMessage(
            chatId,
            `<b>Monthly Copy Trading Subscription</b>\n\n` +
              `Amount: <b>${formatCurrency(siteConfig.subscription.price)}</b>\n` +
              `Account: ${user.email}\n\n` +
              `Click the button below to complete your payment:`,
            {
              inline_keyboard: [
                [
                  {
                    text: `Pay ${formatCurrency(siteConfig.subscription.price)} Now`,
                    url: response.data.authorization_url,
                  },
                ],
                [
                  {
                    text: "How does this work?",
                    callback_data: "help_payment",
                  },
                ],
              ],
            }
          );
          break;
        }

        case "status": {
          const user = await User.findOne({
            telegramId: telegramUserId.toString(),
          });

          if (!user) {
            await sendMessage(
              chatId,
              "Your Telegram is not linked to any Primetrex account.\n\n" +
                "Visit your dashboard to link your account."
            );
            break;
          }

          const statusText = user.isActive ? "Active" : "Inactive";
          await sendMessage(
            chatId,
            `<b>Account Status</b>\n\n` +
              `Name: ${user.firstName} ${user.lastName}\n` +
              `Email: ${user.email}\n` +
              `Status: ${statusText}\n` +
              `Referral Code: <code>${user.referralCode}</code>\n\n` +
              (user.isActive
                ? "Your account is active. Use /subscribe to renew your monthly subscription."
                : "Your account is inactive. Please complete your signup payment to activate.")
          );
          break;
        }

        case "help": {
          await sendMessage(
            chatId,
            `<b>Primetrex Bot Help</b>\n\n` +
              `<b>Commands:</b>\n` +
              `/start - Start the bot\n` +
              `/subscribe - Pay monthly subscription (${formatCurrency(siteConfig.subscription.price)})\n` +
              `/status - Check your account and subscription status\n` +
              `/help - Show this help message\n\n` +
              `<b>How it works:</b>\n` +
              `1. Register at ${process.env.NEXT_PUBLIC_APP_URL || "primetrex.com"}\n` +
              `2. Link your Telegram from dashboard Settings\n` +
              `3. Use /subscribe to pay your monthly copy trading fee\n` +
              `4. Your referrer earns ${siteConfig.commission.tier1Rate}% commission automatically\n\n` +
              `Need help? Contact support at the website.`
          );
          break;
        }

        default: {
          await sendMessage(
            chatId,
            "Unknown command. Use /help to see available commands."
          );
        }
      }
    }

    // Handle callback queries (inline button clicks)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message?.chat.id;

      await answerCallbackQuery(callbackQuery.id);

      if (callbackQuery.data === "help_payment" && chatId) {
        await sendMessage(
          chatId,
          `<b>Payment Information</b>\n\n` +
            `Monthly subscription: ${formatCurrency(siteConfig.subscription.price)}\n` +
            `Payment via: Paystack (cards, bank transfer, USSD)\n\n` +
            `After payment, your referrer earns commissions automatically:\n` +
            `- Tier 1 referrer: ${siteConfig.commission.tier1Rate}% (${formatCurrency(siteConfig.subscription.price * siteConfig.commission.tier1Rate / 100)})\n` +
            `- Tier 2 referrer: ${siteConfig.commission.tier2Rate}% (${formatCurrency(siteConfig.subscription.price * siteConfig.commission.tier2Rate / 100)})\n\n` +
            `Your subscription gives you access to Primetrex copy trading signals.`
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    // Always return 200 to prevent Telegram from retrying
    return NextResponse.json({ ok: true });
  }
}
