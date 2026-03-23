import type { Context, SessionFlavor } from "grammy";
import type {
  ConversationFlavor,
  Conversation,
} from "@grammyjs/conversations";

export interface SessionData {
  step?:
    | "awaiting_user_id"
    | "awaiting_plan_selection"
    | "awaiting_start_date"
    | "awaiting_expiry_date"
    | "awaiting_payment_ref"
    | "awaiting_referral_code"
    | "awaiting_search_query"
    | "awaiting_broadcast_message"
    | "awaiting_broadcast_confirm"
    | "awaiting_broadcast_dm_user_id"
    | "awaiting_broadcast_dm_message"
    | "awaiting_coupon_code"
    | "awaiting_coupon_type"
    | "awaiting_coupon_value"
    | "awaiting_coupon_max_uses"
    | "awaiting_coupon_expiry"
    | "awaiting_special_user_id"
    | "awaiting_special_expiry"
    | "awaiting_discount_value"
    | "awaiting_channel_id"
    | "awaiting_channel_name"
    | "awaiting_plan_price"
    | "awaiting_renewal_price"
    | "awaiting_payment_coupon";

  // Temporary data during multi-step flows
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

  // Pagination
  subscriberPage?: number;
}

export type BotContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor<Context>;

export type BotConversation = Conversation<BotContext>;
