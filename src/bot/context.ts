import type { Context, SessionFlavor } from "grammy";
import type {
  ConversationFlavor,
  Conversation,
} from "@grammyjs/conversations";

// Kept for backward-compatibility with unused Primetrex handler files
export interface SessionData {
  step?: string;
  pendingUserId?: number;
  pendingPlanId?: string;
  pendingReferralCode?: string | null;
  pendingIsRenewal?: boolean;
  pendingStartDate?: string;
  pendingChannelId?: string;
  pendingPaymentRef?: string;
  pendingCouponCode?: string;
  pendingCouponType?: string;
  pendingCouponValue?: number;
  pendingCouponMaxUses?: number | null;
  pendingPaymentCouponCode?: string;
  pendingPaymentDiscount?: number;
  pendingBroadcastMessage?: string;
  pendingBroadcastMessageId?: number;
  broadcastTarget?: "all" | "channel" | "dm";
  broadcastDMTargetId?: string;
  subscriberPage?: number;
}

export type BotContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor<Context>;

export type BotConversation = Conversation<BotContext>;
