export const EMOJI = {
  // Menu & Navigation
  ADMIN_PANEL: "\u{1F527}",
  ADD_SUBSCRIBER: "\u2795",
  COUPONS: "\u{1F3AB}",
  SUBSCRIBERS: "\u{1F465}",
  CHANNELS: "\u{1F5A5}",
  PAYMENT_PROVIDERS: "\u{1F4B3}",
  SPECIAL_SUBSCRIBERS: "\u{1F31F}",
  ANALYTICS: "\u{1F4CA}",
  BROADCAST: "\u{1F4E2}",
  HOME: "\u{1F3E0}",
  BACK: "\u2B05\uFE0F",
  NEXT: "\u25B6\uFE0F",
  SEARCH: "\u{1F50D}",

  // Actions
  SUBSCRIBE: "\u{1F4B3}",
  RENEW: "\u{1F504}",
  PAID: "\u2705",
  HELP: "\u2139\uFE0F",
  CANCEL: "\u274C",
  CONFIG: "\u2699\uFE0F",

  // Status
  SUCCESS: "\u2705",
  BLOCKED: "\u{1F6AB}",
  WARNING: "\u26A0\uFE0F",
  ACTIVE: "\u{1F7E2}",
  EXPIRED: "\u{1F534}",

  // Content
  WAVE: "\u{1F44B}",
  ROCKET: "\u{1F680}",
  POINT_DOWN: "\u{1F447}",
  INVITE: "\u2709\uFE0F",
  PERSON: "\u{1F9D1}",
  FOLDER: "\u{1F4C1}",
  CALENDAR: "\u{1F4C5}",
  HOURGLASS: "\u231B",
  TIP: "\u{1F4A1}",
  GIFT: "\u{1F381}",
  LINK: "\u2197",
  ARROW: "\u2192",
  MONEY: "\u{1F4B0}",
  CHART: "\u{1F4C8}",
  MEGAPHONE: "\u{1F4E3}",
  AFFILIATE: "\u{1F91D}",
} as const;

export const CALLBACK = {
  // Main menu
  MAIN_MENU: "main_menu",
  SUBSCRIBE: "subscribe",
  RENEW: "renew",
  PAID: "ive_paid",
  HELP: "help",
  AFFILIATE: "affiliate",

  // Admin
  ADMIN_PANEL: "admin_panel",
  ADMIN_ADD_SUB: "admin_add_sub",
  ADMIN_COUPONS: "admin_coupons",
  ADMIN_SUBSCRIBERS: "admin_subscribers",
  ADMIN_CHANNELS: "admin_channels",
  ADMIN_PAYMENT: "admin_payment",
  ADMIN_SPECIAL: "admin_special",
  ADMIN_ANALYTICS: "admin_analytics",
  ADMIN_BROADCAST: "admin_broadcast",
  ADMIN_EXIT: "admin_exit",

  // Subscribers
  SUB_NEXT: "sub_next",
  SUB_PREV: "sub_prev",
  SUB_SEARCH: "sub_search",
  SUB_BACK: "sub_back",

  // Special users
  SPECIAL_LIST: "special_list",
  SPECIAL_ADD: "special_add",
  SPECIAL_CONFIG: "special_config",
  SPECIAL_BACK: "special_back",
  SPECIAL_DISCOUNT_FIXED: "special_discount_fixed",
  SPECIAL_DISCOUNT_PERCENT: "special_discount_percent",

  // Coupons
  COUPON_LIST: "coupon_list",
  COUPON_CREATE: "coupon_create",
  COUPON_BACK: "coupon_back",

  // Broadcast
  BROADCAST_SEND: "broadcast_send",
  BROADCAST_CANCEL: "broadcast_cancel",

  // Payment
  PAY_FLUTTERWAVE: "pay_flutterwave",
  PAY_CANCEL: "pay_cancel",

  // Plan selection (dynamic)
  PLAN_PREFIX: "plan_",

  // Pagination
  PAGE_PREFIX: "page_",
} as const;

export const PAGE_SIZE = 5;
