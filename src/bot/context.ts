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
    | "awaiting_payment_proof"
    | "awaiting_payment_ref"
    | "awaiting_search_query"
    | "awaiting_broadcast_message"
    | "awaiting_broadcast_confirm"
    | "awaiting_coupon_code"
    | "awaiting_coupon_type"
    | "awaiting_coupon_value"
    | "awaiting_coupon_max_uses"
    | "awaiting_coupon_expiry"
    | "awaiting_special_user_id"
    | "awaiting_special_expiry"
    | "awaiting_discount_value";

  // Temporary data during multi-step flows
  pendingUserId?: number;
  pendingPlanId?: string;
  pendingStartDate?: string;
  pendingChannelId?: string;
  pendingPaymentRef?: string;
  pendingCouponCode?: string;
  pendingCouponType?: string;
  pendingCouponValue?: number;
  pendingCouponMaxUses?: number | null;
  pendingBroadcastMessage?: string;
  pendingBroadcastMessageId?: number;

  // Pagination
  subscriberPage?: number;
}

export type BotContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor<Context>;

export type BotConversation = Conversation<BotContext>;
