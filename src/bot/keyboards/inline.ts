import { InlineKeyboard } from "grammy";
import { EMOJI, CALLBACK } from "@/bot/constants";

export function mainMenuKeyboard(isAdmin: boolean): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text(`${EMOJI.SUBSCRIBE} Subscribe`, CALLBACK.SUBSCRIBE)
    .row()
    .text(`${EMOJI.RENEW} Renew`, CALLBACK.RENEW)
    .row()
    .text(`${EMOJI.PAID} I've Paid`, CALLBACK.PAID)
    .row()
    .text(`${EMOJI.HELP} Help`, CALLBACK.HELP)
    .row();

  if (isAdmin) {
    kb.text(`${EMOJI.ADMIN_PANEL} Admin Panel`, CALLBACK.ADMIN_PANEL);
  }

  return kb;
}

export function helpKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${EMOJI.SUBSCRIBE} Subscribe`, CALLBACK.SUBSCRIBE)
    .row()
    .text(`${EMOJI.RENEW} Renew`, CALLBACK.RENEW)
    .row()
    .text(`${EMOJI.PAID} I've Paid`, CALLBACK.PAID)
    .row()
    .text(`${EMOJI.HELP} Help`, CALLBACK.HELP);
}

export function adminPanelKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${EMOJI.ADD_SUBSCRIBER} Add Subscriber (Manual)`, CALLBACK.ADMIN_ADD_SUB)
    .row()
    .text(`${EMOJI.COUPONS} Coupons`, CALLBACK.ADMIN_COUPONS)
    .row()
    .text(`${EMOJI.SUBSCRIBERS} Subscribers`, CALLBACK.ADMIN_SUBSCRIBERS)
    .row()
    .text(`${EMOJI.CHANNELS} Channels`, CALLBACK.ADMIN_CHANNELS)
    .row()
    .text(`${EMOJI.PAYMENT_PROVIDERS} Payment Providers`, CALLBACK.ADMIN_PAYMENT)
    .row()
    .text(`${EMOJI.SPECIAL_SUBSCRIBERS} Special Subscribers`, CALLBACK.ADMIN_SPECIAL)
    .row()
    .text(`${EMOJI.ANALYTICS} Analytics`, CALLBACK.ADMIN_ANALYTICS)
    .row()
    .text(`${EMOJI.BROADCAST} Broadcast`, CALLBACK.ADMIN_BROADCAST)
    .row()
    .text(`${EMOJI.HOME} Exit to Main Menu`, CALLBACK.ADMIN_EXIT);
}

export function backButton(callbackData: string = CALLBACK.ADMIN_PANEL): InlineKeyboard {
  return new InlineKeyboard().text(`${EMOJI.BACK} Back`, callbackData);
}

export function subscriptionSummaryKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Pay with FlutterWave", CALLBACK.PAY_FLUTTERWAVE)
    .row()
    .text(`${EMOJI.CANCEL} Cancel`, CALLBACK.PAY_CANCEL);
}

export function paymentReadyKeyboard(
  paymentUrl: string,
  amount: string
): InlineKeyboard {
  return new InlineKeyboard()
    .url(`Click here to pay ${amount} ${EMOJI.LINK}`, paymentUrl)
    .row()
    .text(`${EMOJI.PAID} I've Paid`, CALLBACK.PAID)
    .row()
    .text(`${EMOJI.CANCEL} Cancel`, CALLBACK.PAY_CANCEL);
}

export function subscriberListKeyboard(
  currentPage: number,
  totalPages: number
): InlineKeyboard {
  const kb = new InlineKeyboard();

  // Pagination row
  if (currentPage > 0) {
    kb.text(`${EMOJI.BACK} Prev`, CALLBACK.SUB_PREV);
  }
  kb.text(`${currentPage + 1}/${totalPages}`);
  if (currentPage < totalPages - 1) {
    kb.text(`Next ${EMOJI.NEXT}`, CALLBACK.SUB_NEXT);
  }

  kb.row()
    .text(`${EMOJI.SEARCH} Search`, CALLBACK.SUB_SEARCH)
    .text(`${EMOJI.BACK} Back`, CALLBACK.SUB_BACK);

  return kb;
}

export function specialUsersKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${EMOJI.FOLDER} List Users`, CALLBACK.SPECIAL_LIST)
    .row()
    .text(`${EMOJI.ADD_SUBSCRIBER} Add User`, CALLBACK.SPECIAL_ADD)
    .row()
    .text(`${EMOJI.CONFIG} Config Discount`, CALLBACK.SPECIAL_CONFIG)
    .row()
    .text(`${EMOJI.BACK} Back to Panel`, CALLBACK.SPECIAL_BACK);
}

export function discountTypeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Fixed Amount", CALLBACK.SPECIAL_DISCOUNT_FIXED)
    .row()
    .text("Percentage (%)", CALLBACK.SPECIAL_DISCOUNT_PERCENT)
    .row()
    .text(`${EMOJI.BACK} Back`, CALLBACK.SPECIAL_BACK);
}

export function couponMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("\u{1F4CB} List Coupons", CALLBACK.COUPON_LIST)
    .row()
    .text(`${EMOJI.ADD_SUBSCRIBER} Create Coupon`, CALLBACK.COUPON_CREATE)
    .row()
    .text(`${EMOJI.BACK} Back to Panel`, CALLBACK.COUPON_BACK);
}

export function broadcastConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${EMOJI.PAID} Send Now`, CALLBACK.BROADCAST_SEND)
    .text(`${EMOJI.CANCEL} Cancel`, CALLBACK.BROADCAST_CANCEL);
}
