import { InlineKeyboard } from "grammy";
import { EMOJI, CALLBACK } from "@/bot/constants";

const AVERIS_APP_URL = process.env.AVERIS_APP_URL || "https://app.averisacademy.com";

// ── Active: Averis Academy keyboards ─────────────────────────────────────────

export function mainMenuKeyboard(hasSubscription: boolean): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text("\u{1F4CA} My Subscription Status", CALLBACK.AVERIS_STATUS)
    .row();

  if (hasSubscription) {
    kb.text("\u{1F504} Renew Subscription", CALLBACK.AVERIS_RENEW)
      .row()
      .text("\u{1F517} Get Community Invite", CALLBACK.AVERIS_REINVITE)
      .row();
  }

  kb.url("\u{1F310} Visit Averis Academy", AVERIS_APP_URL)
    .row()
    .text(`${EMOJI.HELP} Help`, CALLBACK.HELP);

  return kb;
}

export function helpKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("\u{1F4CA} My Subscription Status", CALLBACK.AVERIS_STATUS)
    .row()
    .text(`${EMOJI.BACK} Back`, CALLBACK.MAIN_MENU);
}

// ── Preserved: Primetrex keyboards (not active — kept for re-implementation) ──

export function backButton(callbackData: string = CALLBACK.ADMIN_PANEL): InlineKeyboard {
  return new InlineKeyboard().text(`${EMOJI.BACK} Back`, callbackData);
}

export function adminPanelKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${EMOJI.ADD_SUBSCRIBER} Add Subscriber`, CALLBACK.ADMIN_ADD_SUB).row()
    .text(`${EMOJI.COUPONS} Coupons`, CALLBACK.ADMIN_COUPONS).row()
    .text(`${EMOJI.SUBSCRIBERS} Subscribers`, CALLBACK.ADMIN_SUBSCRIBERS).row()
    .text(`${EMOJI.CHANNELS} Channels`, CALLBACK.ADMIN_CHANNELS).row()
    .text(`${EMOJI.PAYMENT_PROVIDERS} Payment Providers`, CALLBACK.ADMIN_PAYMENT).row()
    .text(`${EMOJI.SPECIAL_SUBSCRIBERS} Special Subscribers`, CALLBACK.ADMIN_SPECIAL).row()
    .text(`${EMOJI.ANALYTICS} Analytics`, CALLBACK.ADMIN_ANALYTICS).row()
    .text(`${EMOJI.BROADCAST} Broadcast`, CALLBACK.ADMIN_BROADCAST).row()
    .text(`${EMOJI.REPORT} Retention Report`, CALLBACK.ADMIN_RETENTION).row()
    .text(`${EMOJI.HOME} Exit to Main Menu`, CALLBACK.ADMIN_EXIT);
}

export function subscriptionSummaryKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Pay with Korapay", CALLBACK.PAY_KORAPAY).row()
    .text(`${EMOJI.CANCEL} Cancel`, CALLBACK.PAY_CANCEL);
}

export function paymentReadyKeyboard(paymentUrl: string, amount: string): InlineKeyboard {
  return new InlineKeyboard()
    .url(`Click here to pay ${amount} ${EMOJI.LINK}`, paymentUrl).row()
    .text(`${EMOJI.PAID} I've Paid`, CALLBACK.PAID).row()
    .text(`${EMOJI.CANCEL} Cancel`, CALLBACK.PAY_CANCEL);
}

export function subscriberListKeyboard(currentPage: number, totalPages: number): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (currentPage > 0) kb.text(`${EMOJI.BACK} Prev`, CALLBACK.SUB_PREV);
  kb.text(`${currentPage + 1}/${totalPages}`);
  if (currentPage < totalPages - 1) kb.text(`Next ${EMOJI.NEXT}`, CALLBACK.SUB_NEXT);
  kb.row().text(`${EMOJI.SEARCH} Search`, CALLBACK.SUB_SEARCH).text(`${EMOJI.BACK} Back`, CALLBACK.SUB_BACK);
  return kb;
}

export function specialUsersKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${EMOJI.FOLDER} List Users`, CALLBACK.SPECIAL_LIST).row()
    .text(`${EMOJI.ADD_SUBSCRIBER} Add User`, CALLBACK.SPECIAL_ADD).row()
    .text(`${EMOJI.CONFIG} Config Discount`, CALLBACK.SPECIAL_CONFIG).row()
    .text(`${EMOJI.BACK} Back to Panel`, CALLBACK.SPECIAL_BACK);
}

export function discountTypeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Fixed Amount", CALLBACK.SPECIAL_DISCOUNT_FIXED).row()
    .text("Percentage (%)", CALLBACK.SPECIAL_DISCOUNT_PERCENT).row()
    .text(`${EMOJI.BACK} Back`, CALLBACK.SPECIAL_BACK);
}

export function couponMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("\u{1F4CB} List Coupons", CALLBACK.COUPON_LIST).row()
    .text(`${EMOJI.ADD_SUBSCRIBER} Create Coupon`, CALLBACK.COUPON_CREATE).row()
    .text(`${EMOJI.BACK} Back to Panel`, CALLBACK.COUPON_BACK);
}

export function broadcastTargetKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${EMOJI.SUBSCRIBERS} All Subscribers`, CALLBACK.BROADCAST_TARGET_ALL).row()
    .text(`${EMOJI.CHANNEL_MSG} Send to Channel/Group`, CALLBACK.BROADCAST_TARGET_CHANNEL).row()
    .text(`${EMOJI.DM} DM Specific User`, CALLBACK.BROADCAST_TARGET_DM).row()
    .text(`${EMOJI.BACK} Back`, CALLBACK.ADMIN_PANEL);
}

export function broadcastConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${EMOJI.PAID} Send Now`, CALLBACK.BROADCAST_SEND)
    .text(`${EMOJI.CANCEL} Cancel`, CALLBACK.BROADCAST_CANCEL);
}
