# Complete Development Prompt: Telegram Subscription Management Bot (Next.js + TypeScript)

## Project Overview

Build a fully functional Telegram subscription management bot that controls paid access to a private Telegram group/channel. The bot handles subscriber management, payment processing via Flutterwave, automated group invites, whitelist/special user discounts, broadcast messaging, analytics, and a full admin panel — all through an interactive Telegram bot interface with inline keyboards and emoji-rich UI.

**Tech Stack:**
- **Runtime/Framework:** Next.js 14+ (App Router) with TypeScript
- **Telegram Bot Library:** grammY (recommended) or Telegraf — both have excellent TypeScript support
- **Database:** PostgreSQL with Prisma ORM
- **Payment Gateway:** Flutterwave (Nigerian Naira ₦)
- **Deployment:** Vercel (webhook mode) or VPS with Node.js
- **Scheduling:** Vercel Cron Jobs or `node-cron` for expiry checks
- **Timezone:** Africa/Lagos (WAT)

---

## PROJECT STRUCTURE

```
primetrex-bot/
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Auto-generated migrations
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── bot/
│   │   │   │   └── route.ts              # Telegram webhook endpoint
│   │   │   ├── flutterwave/
│   │   │   │   ├── callback/
│   │   │   │   │   └── route.ts          # Flutterwave redirect callback
│   │   │   │   └── webhook/
│   │   │   │       └── route.ts          # Flutterwave webhook (payment notifications)
│   │   │   └── cron/
│   │   │       └── expiry/
│   │   │           └── route.ts          # Cron job: check expired subscriptions
│   │   ├── layout.tsx
│   │   └── page.tsx                      # Optional: admin dashboard web UI
│   ├── bot/
│   │   ├── index.ts                      # Bot instance & webhook setup
│   │   ├── config.ts                     # Environment variables & constants
│   │   ├── context.ts                    # Custom context type with session
│   │   ├── handlers/
│   │   │   ├── start.ts                  # /start, main menu, help
│   │   │   ├── subscribe.ts              # Subscribe & renew flows
│   │   │   ├── payment.ts               # I've Paid, payment verification
│   │   │   ├── admin.ts                  # Admin panel entry point
│   │   │   ├── addSubscriber.ts          # Manual add subscriber flow
│   │   │   ├── subscribers.ts            # List, search, paginate subscribers
│   │   │   ├── specialUsers.ts           # Whitelist/special user management
│   │   │   ├── coupons.ts               # Coupon CRUD
│   │   │   ├── channels.ts              # Channel management
│   │   │   ├── analytics.ts             # Analytics display
│   │   │   ├── broadcast.ts             # Broadcast messaging
│   │   │   └── paymentProviders.ts      # Payment config
│   │   ├── keyboards/
│   │   │   ├── inline.ts                # InlineKeyboard builders
│   │   │   └── reply.ts                 # Persistent reply keyboard
│   │   ├── conversations/
│   │   │   ├── addSubscriberConvo.ts     # Multi-step: add subscriber
│   │   │   ├── addSpecialUserConvo.ts    # Multi-step: add special user
│   │   │   ├── createCouponConvo.ts      # Multi-step: create coupon
│   │   │   ├── broadcastConvo.ts         # Multi-step: compose & send broadcast
│   │   │   ├── searchSubscriberConvo.ts  # Multi-step: search subscribers
│   │   │   └── paymentVerifyConvo.ts     # Multi-step: verify payment ref
│   │   ├── middleware/
│   │   │   ├── auth.ts                   # Admin-only middleware
│   │   │   └── session.ts               # Session middleware config
│   │   └── services/
│   │       ├── flutterwave.ts            # Flutterwave API wrapper
│   │       ├── invite.ts                 # Invite link generation & access control
│   │       ├── subscription.ts           # Subscription activation/deactivation logic
│   │       └── expiry.ts                 # Expiry checker & reminder sender
│   ├── lib/
│   │   ├── prisma.ts                     # Prisma client singleton
│   │   ├── utils.ts                      # Date formatting, pagination helpers
│   │   └── constants.ts                  # Emoji map, callback data prefixes
│   └── types/
│       ├── index.ts                      # Shared TypeScript interfaces
│       └── flutterwave.ts               # Flutterwave API response types
├── .env                                  # Environment variables
├── .env.example
├── next.config.js
├── package.json
├── tsconfig.json
├── vercel.json                           # Cron job config (if using Vercel)
└── README.md
```

---

## PRISMA SCHEMA

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Plan {
  id            Int       @id @default(autoincrement())
  name          String    // e.g., "Primetrex Community"
  price         Decimal   @db.Decimal(12, 2) // First payment price (e.g., 50000.00)
  renewalPrice  Decimal   @db.Decimal(12, 2) @map("renewal_price") // e.g., 35000.00
  durationDays  Int       @map("duration_days") @default(30)
  channelId     BigInt    @map("channel_id") // Telegram group/channel chat ID
  channelName   String    @map("channel_name")
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")

  subscribers   Subscriber[]
  payments      Payment[]

  @@map("plans")
}

model Subscriber {
  id          Int       @id @default(autoincrement()) // Displayed as /sub_{id}
  userId      BigInt    @map("user_id") // Telegram user ID
  username    String?   // @username (nullable)
  firstName   String?   @map("first_name")
  lastName    String?   @map("last_name")
  planId      Int       @map("plan_id")
  channelId   BigInt    @map("channel_id")
  startDate   DateTime  @map("start_date")
  expiryDate  DateTime  @map("expiry_date")
  status      String    @default("active") // active, expired, cancelled
  addedBy     String    @default("payment") @map("added_by") // payment, manual, special
  createdAt   DateTime  @default(now()) @map("created_at")

  plan        Plan      @relation(fields: [planId], references: [id])

  @@map("subscribers")
}

model SpecialUser {
  id          Int       @id @default(autoincrement())
  userId      BigInt    @unique @map("user_id")
  username    String?
  firstName   String?   @map("first_name")
  lastName    String?   @map("last_name")
  addedAt     DateTime  @default(now()) @map("added_at")

  @@map("special_users")
}

model SpecialConfig {
  id              Int     @id @default(autoincrement())
  discountType    String  @default("fixed") @map("discount_type") // fixed or percentage
  discountValue   Decimal @default(5000.00) @db.Decimal(12, 2) @map("discount_value")

  @@map("special_config")
}

model Payment {
  id            Int       @id @default(autoincrement())
  userId        BigInt    @map("user_id")
  planId        Int       @map("plan_id")
  amount        Decimal   @db.Decimal(12, 2)
  currency      String    @default("NGN")
  paymentRef    String?   @map("payment_ref") // tx_ref sent to Flutterwave
  flwRef        String?   @map("flw_ref") // Flutterwave internal ref
  status        String    @default("pending") // pending, successful, failed
  paymentType   String    @map("payment_type") // new or renewal
  createdAt     DateTime  @default(now()) @map("created_at")

  plan          Plan      @relation(fields: [planId], references: [id])

  @@map("payments")
}

model Coupon {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  discountType    String    @map("discount_type") // fixed or percentage
  discountValue   Decimal   @db.Decimal(12, 2) @map("discount_value")
  maxUses         Int?      @map("max_uses") // null = unlimited
  timesUsed       Int       @default(0) @map("times_used")
  isActive        Boolean   @default(true) @map("is_active")
  expiresAt       DateTime? @map("expires_at")
  createdAt       DateTime  @default(now()) @map("created_at")

  @@map("coupons")
}

model Admin {
  id      Int     @id @default(autoincrement())
  userId  BigInt  @unique @map("user_id")
  role    String  @default("admin") // owner, admin

  @@map("admins")
}
```

---

## ENVIRONMENT VARIABLES

```env
# .env

# Telegram
BOT_TOKEN="your-telegram-bot-token"
BOT_USERNAME="@YourBotName"
WEBHOOK_URL="https://your-domain.com/api/bot"
WEBHOOK_SECRET="random-secret-string"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/primetrex_bot"

# Flutterwave
FLW_SECRET_KEY="FLWSECK-xxxxxxxxxxxxxxxx-X"
FLW_PUBLIC_KEY="FLWPUBK-xxxxxxxxxxxxxxxx-X"
FLW_WEBHOOK_SECRET="your-flutterwave-webhook-hash"
FLW_REDIRECT_URL="https://your-domain.com/api/flutterwave/callback"

# App
TIMEZONE="Africa/Lagos"
ADMIN_IDS="123456789,987654321"  # Comma-separated initial admin Telegram user IDs
```

---

## TYPE DEFINITIONS

```typescript
// src/types/index.ts

export interface SessionData {
  step?:
    | "awaiting_user_id"
    | "awaiting_plan_selection"
    | "awaiting_start_date"
    | "awaiting_expiry_date"
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
  pendingPlanId?: number;
  pendingStartDate?: string;
  pendingChannelId?: number;
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

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

```typescript
// src/types/flutterwave.ts

export interface FlutterwavePaymentLink {
  status: string;
  message: string;
  data: {
    link: string;
  };
}

export interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string; // "successful" | "failed" | "pending"
    payment_type: string;
    created_at: string;
    customer: {
      id: number;
      email: string;
      name: string;
      phone_number: string;
    };
  };
}

export interface FlutterwaveWebhookPayload {
  event: string; // "charge.completed"
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string;
    payment_type: string;
    customer: {
      email: string;
      name: string;
    };
  };
}
```

---

## CONSTANTS & EMOJI MAP

```typescript
// src/lib/constants.ts

export const EMOJI = {
  // Menu & Navigation
  ADMIN_PANEL: "🔧",
  ADD_SUBSCRIBER: "➕",
  COUPONS: "🎫",
  SUBSCRIBERS: "👥",
  CHANNELS: "🖥",
  PAYMENT_PROVIDERS: "💳",
  SPECIAL_SUBSCRIBERS: "🌟",
  ANALYTICS: "📊",
  BROADCAST: "📢",
  HOME: "🏠",
  BACK: "⬅️",
  NEXT: "▶️",
  SEARCH: "🔍",

  // Actions
  SUBSCRIBE: "💳",
  RENEW: "🔄",
  PAID: "✅",
  HELP: "ℹ️",
  CANCEL: "❌",
  CONFIG: "⚙️",

  // Status
  SUCCESS: "✅",
  BLOCKED: "🚫",
  WARNING: "⚠️",
  ACTIVE: "🟢",
  EXPIRED: "🔴",

  // Content
  WAVE: "👋",
  ROCKET: "🚀",
  POINT_DOWN: "👇",
  INVITE: "✉️",
  PERSON: "🧑",
  FOLDER: "📁",
  CALENDAR: "📅",
  HOURGLASS: "⏳",
  TIP: "💡",
  GIFT: "🎁",
  LINK: "↗",
  ARROW: "→",
} as const;

export const CALLBACK = {
  // Main menu
  MAIN_MENU: "main_menu",
  SUBSCRIBE: "subscribe",
  RENEW: "renew",
  PAID: "ive_paid",
  HELP: "help",

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
```

---

## BOT INSTANCE & WEBHOOK SETUP

```typescript
// src/bot/index.ts

import { Bot, session, webhookCallback } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import type { Context, SessionFlavor } from "grammy";
import type { SessionData } from "@/types";

// Custom context
export type BotContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor;
export type BotConversation = Conversation<BotContext>;

// Create bot instance
const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

// Session middleware
bot.use(
  session({
    initial: (): SessionData => ({}),
  })
);

// Conversations plugin (for multi-step flows)
bot.use(conversations());

// Register all conversations
// bot.use(createConversation(addSubscriberConvo, "add-subscriber"));
// bot.use(createConversation(searchSubscriberConvo, "search-subscriber"));
// bot.use(createConversation(addSpecialUserConvo, "add-special-user"));
// bot.use(createConversation(createCouponConvo, "create-coupon"));
// bot.use(createConversation(broadcastConvo, "broadcast"));
// bot.use(createConversation(paymentVerifyConvo, "payment-verify"));

// Register handlers
// registerStartHandlers(bot);
// registerAdminHandlers(bot);
// registerSubscribeHandlers(bot);
// registerPaymentHandlers(bot);

export { bot };
export const handleUpdate = webhookCallback(bot, "std/http");
```

```typescript
// src/app/api/bot/route.ts

import { handleUpdate } from "@/bot";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Optional: verify webhook secret
  const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await handleUpdate(req);
  } catch (error) {
    console.error("Bot webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

---

## USER-FACING FLOWS (Non-Admin)

### 1. /start and Main Menu

When any user sends `/start` or taps "≡ Main Menu":

```
👋 Hi {first_name}!

Welcome to the official  {Bot Name} Community Subscription bot.

🚀 Get Premium Access

Subscribe now to unlock exclusive copy trading from {Bot Name}

👇 Tap Subscribe below to view available plans.
```

**Inline Keyboard (vertical stack):**
```
[ 💳 Subscribe          ]
[ 🔄 Renew              ]
[ ✅ I've Paid           ]
[ ℹ️ Help               ]
[ 🔧 Admin Panel        ]   ← Only visible if user is in admins table
```

**Persistent Reply Keyboard (ReplyKeyboardMarkup, bottom bar):**
```
[ ≡ Main Menu ]  [ 💳 Subscribe ]
```

---

### 2. Help

When user taps "ℹ️ Help":

```
ℹ️ Help

• Tap subscribe for {plan_name} first payment of #{price} if you want to make first payment
• Tap renew to make a renewal payment of #{renewal_price} if you want to renew your subscription
• If you paid already, tap I've Paid to verify.

If you have issues, contact the channel admin.
```

**Inline Keyboard:**
```
[ 💳 Subscribe ]
[ 🔄 Renew     ]
[ ✅ I've Paid  ]
[ ℹ️ Help      ]
```

---

### 3. Subscribe Flow

**Step 1 — Subscription Summary:**
```
💳 Subscription Summary
Plan: <b>{plan_name}</b>
Channel: {channel_name}
Price: ₦{price}
Total: ₦{total}

👇 Select Payment Method:
```

If user is whitelisted (special user), apply discount automatically:
```
Price: ₦{price}
🎁 Discount: -₦{discount}
Total: ₦{discounted_total}
```

**Inline Keyboard:**
```
[ Pay with FlutterWave  ]
[ ❌ Cancel              ]
```

**Step 2 — Payment Ready:**
```
💳 Payment Ready
Plan: {channel_name}
Amount: ₦{amount}

Click below to pay with Flutterwave.
```

**Inline Keyboard:**
```
[ Click here to pay ₦{amount}  ↗ ]   ← InlineKeyboard URL button → Flutterwave checkout link
[ ✅ I've Paid                     ]
[ ❌ Cancel                        ]
```

Generate Flutterwave payment link via their API (details in Flutterwave section below).

**Step 3 — After "I've Paid":**

First check if user is a first-time subscriber:
```
⚠️ First Time Subscriber?

You are a first time subscriber. Please use the Subscribe button to start your first plan.
```

For returning subscribers:
```
✅ Verified via Flutterwave.

✅ If you just paid, please send your payment reference (or transaction ID) here.
```

Bot enters `awaiting_payment_ref` conversation state. User sends their reference. Bot verifies against Flutterwave API.

**Step 4 — Successful Activation:**
```
✅ User Added Successfully!
User ID: {user_id}
Channel: {channel_name}
Expires: {expiry_date}

✉️ Invite sent to user via DM.
```

Bot generates a single-use invite link and DMs it to the user.

---

### 4. Renew Flow

Same as Subscribe but uses `renewal_price`. Only available if user has a prior subscription record.

---

## ADMIN PANEL (Admin users only)

### Admin Panel Menu

When admin taps "🔧 Admin Panel":

```
🔧 Admin Panel

Choose an action below.
```

**Inline Keyboard (vertical stack):**
```
[ ➕ Add Subscriber (Manual)  ]
[ 🎫 Coupons                  ]
[ 👥 Subscribers               ]
[ 🖥 Channels                  ]
[ 💳 Payment Providers         ]
[ 🌟 Special Subscribers       ]
[ 📊 Analytics                 ]
[ 📢 Broadcast                 ]
[ 🏠 Exit to Main Menu         ]
```

---

### A. ➕ Add Subscriber (Manual)

This is a multi-step conversation.

**Step 1 — Enter User ID:**
```
🧑 Enter User ID

Please send the Telegram User ID (numeric).
Or forward a message from them.
```

**Inline Keyboard:**
```
[ ⬅️ Back ]
```

If admin forwards a message, extract the user ID from `message.forward_from.id`.

**Step 2 — Select Plan:**
```
📁 Select Plan

Assign a plan for this user:
```

**Inline Keyboard (dynamic from plans table):**
```
[ {plan_name} ({duration_days} days) ]
[ ⬅️ Back                            ]
```

**Step 3 — Subscription Start Date:**
```
📅 Subscription Start Date

Enter start date (YYYY-MM-DD HH:MM)
Or type now for immediate start.
```

**Step 4 — Expiry Date:**
```
⏳ Enter the <b>expiry date/time</b> for this user.

<b>Format:</b> YYYY‐MM‐DD or YYYY‐MM‐DD HH:MM
<b>Timezone:</b> Africa/Lagos

<b>Examples:</b>
• 2026‐02‐08
• 2026‐02‐08 14:30

💡 <b>Tip:</b> Type skip to use the Plan's default duration (calculated from Start Date).
```

If user types "skip", calculate: `expiryDate = startDate + plan.durationDays`

**Step 5 — Success:**
```
✅ User Added Successfully!
User ID: {user_id}
Channel: {channel_name}
Expires: {expiry_date}

✉️ Invite sent to user via DM.
```

**Inline Keyboard:**
```
[ ⬅️ Back ]
```

The bot:
1. Creates a one-time invite link via `ctx.api.createChatInviteLink(channelId, { member_limit: 1, expire_date: ... })`
2. Attempts to DM the user with the invite link
3. If DM fails (user hasn't started the bot), shows:

```
⚠️ Could not DM user.
{invite_link_url}
```

**Duplicate Check:**
Before adding, check if user already has active subscription for this channel:
```
🚫 Action Blocked

User {user_id} already exists in the whitelist.

Duplicates are not allowed.
Please click Back to return.
```

**Inline Keyboard:**
```
[ ⬅️ Back ]
```

---

### B. 👥 Subscribers

Paginated list of all active subscribers (5 per page):

```
👥 Active Subscribers

1. 🟢 @{username} {firstName} {lastName} ({userId})
   └ Expires: {expiryDate} ({daysLeft}d left)
   → /sub_{id}

2. 🟢 @{username} {firstName} {lastName} ({userId})
   └ Expires: {expiryDate} ({daysLeft}d left)
   → /sub_{id}

3. 🟢 Unknown ({userId})
   └ Expires: {expiryDate} ({daysLeft}d left)
   → /sub_{id}

...

<i>Showing {start}-{end} of {total}</i>
```

**Inline Keyboard:**
```
[ 1/{totalPages}  ]  [ Next ▶️ ]
[ 🔍 Search       ]  [ ⬅️ Back ]
```

Display rules:
- 🟢 for active subscribers, 🔴 for expired
- Show "Unknown" when username AND first/last name are null
- Show `({userId})` — the raw Telegram numeric ID
- `/sub_{id}` is the internal database ID, tappable to view detail
- Sort by expiry date descending (latest expiry first)

**Search Subscribers:**

When admin taps "🔍 Search":
```
🔍 Search Subscribers

Enter a Telegram ID, username, or name to search:

Send /cancel to go back
```

Search the `subscribers` table WHERE:
- `userId::text LIKE '%{query}%'`
- OR `username ILIKE '%{query}%'`
- OR `firstName ILIKE '%{query}%'`
- OR `lastName ILIKE '%{query}%'`

If no results, just re-prompt with the search message again (as seen in screenshots — the bot simply shows the search prompt again with no error).

---

### C. 🌟 Special Subscribers (Whitelist)

```
🌟 Special Users Management

Whitelisted users get an automatic discount on all plans.

👥 Total Users: {count}
🎁 Current Discount: ₦{discountValue} ({discountType})
```

**Inline Keyboard:**
```
[ 📁 List Users     ]
[ ➕ Add User        ]
[ ⚙️ Config Discount ]
[ ⬅️ Back to Panel   ]
```

**➕ Add Special User Flow:**

Step 1: Prompt for User ID (same as add subscriber)
Step 2: Prompt for Expiry Date (YYYY-MM-DD) — for the subscription tied to the special user
Step 3: Add to `special_users` table. If user also has active subscription:

```
✅ Special User Added!
ID: {userId}

User is now whitelisted AND has an active subscription.
```

**Inline Keyboard:**
```
[ ⬅️ Back ]
```

If user already in whitelist:
```
🚫 Action Blocked

User {userId} already exists in the whitelist.

Duplicates are not allowed.
Please click Back to return.
```

**⚙️ Config Discount:**
```
⚙️ Configure Discount

Current: ₦{value} ({type})

Choose discount type:
```

**Inline Keyboard:**
```
[ Fixed Amount    ]
[ Percentage (%)  ]
[ ⬅️ Back         ]
```

Then prompt for the numeric value and update `special_config` table.

**📁 List Users:**

Paginated list similar to subscribers list, showing all whitelisted users.

---

### D. 🎫 Coupons

```
🎫 Coupon Management

Manage discount coupons for subscribers.
```

**Inline Keyboard:**
```
[ 📋 List Coupons    ]
[ ➕ Create Coupon    ]
[ ⬅️ Back to Panel    ]
```

**Create Coupon Conversation:**
1. Enter coupon code (text)
2. Select discount type: `[ Fixed Amount ]  [ Percentage ]`
3. Enter discount value (number)
4. Set max uses (number or "unlimited")
5. Set expiry date (YYYY-MM-DD or "never")
6. Confirm & create

**List Coupons:**
```
🎫 Active Coupons

1. <code>CODE123</code> — ₦5,000 off (Fixed)
   Used: 3/10 | Expires: 2026-03-01

2. <code>WELCOME50</code> — 50% off (Percentage)
   Used: 12/∞ | No expiry
```

---

### E. 🖥 Channels

```
🖥 Channel Management

Manage your connected Telegram channels/groups.
```

**Inline Keyboard:**
```
[ 📋 List Channels   ]
[ ➕ Add Channel      ]
[ ⬅️ Back to Panel    ]
```

List shows: channel name, channel ID, linked plan, member count.

---

### F. 💳 Payment Providers

```
💳 Payment Providers

Configure payment gateways.

Currently active: <b>Flutterwave</b> ✅
```

Show status of Flutterwave connection. Optionally allow updating API keys.

---

### G. 📊 Analytics

```
📊 Analytics Dashboard

📈 Total Subscribers: {total}
🟢 Active: {activeCount}
🔴 Expired: {expiredCount}
💰 Revenue This Month: ₦{monthlyRevenue}
💰 Revenue All Time: ₦{totalRevenue}
📅 New This Week: {weeklyNew}
🔄 Renewals This Month: {monthlyRenewals}
```

**Inline Keyboard:**
```
[ ⬅️ Back to Panel ]
```

Query from `subscribers` and `payments` tables.

---

### H. 📢 Broadcast

**Step 1 — Compose:**
```
📢 Broadcast Message

Send a message to all active subscribers.

Type your message below or send media (photo, video, document).

Send /cancel to go back.
```

**Step 2 — Preview & Confirm:**
```
📢 Broadcast Preview

"{message_preview}"

Send to {activeCount} active subscribers?
```

**Inline Keyboard:**
```
[ ✅ Send Now    ]
[ ❌ Cancel      ]
```

**Step 3 — Result:**
```
📢 Broadcast Complete

✅ Sent: {successCount}
❌ Failed: {failCount}
```

Implementation: iterate over all active subscribers, send message via `ctx.api.sendMessage(userId, ...)` with error handling per user. Add delay between messages to avoid rate limiting (e.g., 50ms per message).

---

## FLUTTERWAVE INTEGRATION

### Generate Payment Link

```typescript
// src/bot/services/flutterwave.ts

import type { FlutterwavePaymentLink, FlutterwaveVerifyResponse } from "@/types/flutterwave";

const FLW_BASE_URL = "https://api.flutterwave.com/v3";

export async function generatePaymentLink(params: {
  txRef: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  planName: string;
}): Promise<string> {
  const response = await fetch(`${FLW_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amount,
      currency: "NGN",
      redirect_url: process.env.FLW_REDIRECT_URL,
      customer: {
        email: params.customerEmail,
        name: params.customerName,
      },
      customizations: {
        title: "Primetrex Subscription",
        description: `Plan: ${params.planName}`,
      },
    }),
  });

  const data: FlutterwavePaymentLink = await response.json();

  if (data.status !== "success") {
    throw new Error(`Flutterwave error: ${data.message}`);
  }

  return data.data.link;
}

export async function verifyPayment(txRef: string): Promise<FlutterwaveVerifyResponse> {
  const response = await fetch(
    `${FLW_BASE_URL}/transactions/verify_by_reference?tx_ref=${txRef}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    }
  );

  return response.json();
}
```

### Transaction Reference Format
```
tx_ref: `PTRX-${userId}-${Date.now()}`
```

### Flutterwave Webhook Endpoint

```typescript
// src/app/api/flutterwave/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { activateSubscription } from "@/bot/services/subscription";

export async function POST(req: NextRequest) {
  // Verify webhook signature
  const signature = req.headers.get("verif-hash");
  if (signature !== process.env.FLW_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = await req.json();

  if (payload.event === "charge.completed" && payload.data.status === "successful") {
    const txRef = payload.data.tx_ref;

    // Update payment record
    await prisma.payment.updateMany({
      where: { paymentRef: txRef },
      data: {
        status: "successful",
        flwRef: payload.data.flw_ref,
      },
    });

    // Activate subscription
    await activateSubscription(txRef);
  }

  return NextResponse.json({ status: "ok" });
}
```

### Flutterwave Redirect Callback

```typescript
// src/app/api/flutterwave/callback/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const txRef = req.nextUrl.searchParams.get("tx_ref");

  // Redirect to Telegram bot deep link or show a simple success/failure page
  if (status === "successful") {
    return NextResponse.redirect(`https://t.me/${process.env.BOT_USERNAME}?start=payment_success_${txRef}`);
  }

  return NextResponse.redirect(`https://t.me/${process.env.BOT_USERNAME}?start=payment_failed`);
}
```

---

## INVITE LINK MANAGEMENT

```typescript
// src/bot/services/invite.ts

import { bot } from "@/bot";

export async function generateInviteLink(channelId: bigint): Promise<string> {
  const invite = await bot.api.createChatInviteLink(Number(channelId), {
    member_limit: 1,
    expire_date: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  });

  return invite.invite_link;
}

export async function removeUserFromChannel(
  channelId: bigint,
  userId: bigint
): Promise<void> {
  try {
    // Ban then immediately unban = remove without permanent ban
    await bot.api.banChatMember(Number(channelId), Number(userId));
    await bot.api.unbanChatMember(Number(channelId), Number(userId));
  } catch (error) {
    console.error(`Failed to remove user ${userId} from channel ${channelId}:`, error);
  }
}

export async function sendInviteDM(
  userId: bigint,
  channelName: string,
  inviteLink: string
): Promise<boolean> {
  try {
    await bot.api.sendMessage(Number(userId), 
      `✅ You've been granted access to <b>${channelName}</b>!\n\n` +
      `🔗 Join here: ${inviteLink}\n\n` +
      `This link expires in 24 hours and can only be used once.`,
      { parse_mode: "HTML" }
    );
    return true;
  } catch (error) {
    // User hasn't started the bot — can't DM
    console.error(`Could not DM user ${userId}:`, error);
    return false;
  }
}
```

---

## AUTOMATED BACKGROUND TASKS

### Subscription Expiry Checker (Cron)

```typescript
// src/app/api/cron/expiry/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { removeUserFromChannel } from "@/bot/services/invite";
import { bot } from "@/bot";

export async function GET(req: Request) {
  // Verify cron secret (Vercel cron or custom)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find expired active subscriptions
  const expired = await prisma.subscriber.findMany({
    where: {
      status: "active",
      expiryDate: { lte: now },
    },
    include: { plan: true },
  });

  let removed = 0;

  for (const sub of expired) {
    // Update status
    await prisma.subscriber.update({
      where: { id: sub.id },
      data: { status: "expired" },
    });

    // Remove from channel
    await removeUserFromChannel(sub.channelId, sub.userId);

    // Notify user
    try {
      await bot.api.sendMessage(Number(sub.userId),
        `⏰ Your subscription to <b>${sub.plan.channelName}</b> has expired.\n\n` +
        `Tap 🔄 Renew to continue access.`,
        { parse_mode: "HTML" }
      );
    } catch {
      // User may have blocked bot
    }

    removed++;
  }

  // --- Reminders (3 days before expiry) ---
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const soonExpiring = await prisma.subscriber.findMany({
    where: {
      status: "active",
      expiryDate: {
        gte: now,
        lte: threeDaysFromNow,
      },
    },
    include: { plan: true },
  });

  for (const sub of soonExpiring) {
    const daysLeft = Math.ceil(
      (sub.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    try {
      await bot.api.sendMessage(Number(sub.userId),
        `⏳ Your subscription to <b>${sub.plan.channelName}</b> expires in <b>${daysLeft} day(s)</b>.\n\n` +
        `Tap 🔄 Renew to avoid losing access.`,
        { parse_mode: "HTML" }
      );
    } catch {
      // Silent fail
    }
  }

  return NextResponse.json({
    expired: removed,
    reminders: soonExpiring.length,
    timestamp: now.toISOString(),
  });
}
```

### Vercel Cron Config (if deploying on Vercel)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/expiry",
      "schedule": "0 */1 * * *"
    }
  ]
}
```

This runs every hour. Adjust to `*/15 * * * *` for every 15 minutes.

---

## ADMIN MIDDLEWARE

```typescript
// src/bot/middleware/auth.ts

import { prisma } from "@/lib/prisma";
import type { BotContext } from "@/bot";

export async function isAdmin(ctx: BotContext): Promise<boolean> {
  const userId = ctx.from?.id;
  if (!userId) return false;

  // Check hardcoded admin IDs first (fallback)
  const envAdmins = (process.env.ADMIN_IDS || "")
    .split(",")
    .map((id) => parseInt(id.trim()))
    .filter(Boolean);

  if (envAdmins.includes(userId)) return true;

  // Check database
  const admin = await prisma.admin.findUnique({
    where: { userId: BigInt(userId) },
  });

  return !!admin;
}
```

---

## UTILITY HELPERS

```typescript
// src/lib/utils.ts

import { format, differenceInDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "Africa/Lagos";

export function formatDate(date: Date): string {
  const zonedDate = toZonedTime(date, TZ);
  return format(zonedDate, "yyyy-MM-dd HH:mm");
}

export function daysLeft(expiryDate: Date): number {
  return Math.max(0, differenceInDays(expiryDate, new Date()));
}

export function formatCurrency(amount: number | bigint | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function paginateText<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number,
  formatter: (item: T, index: number) => string
): { text: string; totalPages: number; start: number; end: number } {
  const totalPages = Math.ceil(total / pageSize);
  const start = page * pageSize + 1;
  const end = Math.min(start + items.length - 1, total);

  const text = items.map((item, i) => formatter(item, start + i - 1)).join("\n\n");

  return { text, totalPages, start, end };
}
```

---

## MESSAGE FORMATTING

All messages use **HTML parse mode** (`parse_mode: "HTML"`).

Formatting reference:
- Bold: `<b>text</b>`
- Italic: `<i>text</i>`
- Code/monospace: `<code>text</code>`
- Link: `<a href="url">text</a>`
- No markdown — HTML only throughout the entire bot

---

## PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "grammy": "^1.21.0",
    "@grammyjs/conversations": "^1.2.0",
    "@grammyjs/runner": "^2.0.0",
    "@prisma/client": "^5.10.0",
    "date-fns": "^3.3.0",
    "date-fns-tz": "^2.0.0",
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "prisma": "^5.10.0",
    "typescript": "^5"
  }
}
```

---

## SETUP & DEPLOYMENT INSTRUCTIONS

### 1. Initial Setup
```bash
npx create-next-app@latest primetrex-bot --typescript --app
cd primetrex-bot
npm install grammy @grammyjs/conversations @prisma/client date-fns date-fns-tz
npx prisma init
```

### 2. Database
```bash
npx prisma db push     # Create tables
npx prisma generate    # Generate client
```

### 3. Set Webhook
```bash
curl -X POST "https://api.telegram.org/bot{BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/bot",
    "secret_token": "your-webhook-secret"
  }'
```

### 4. Seed Initial Data
```sql
-- Insert default plan
INSERT INTO plans (name, price, renewal_price, duration_days, channel_id, channel_name)
VALUES ('Primetrex Community', 50000.00, 35000.00, 30, -1001234567890, 'Primetrex Community');

-- Insert default discount config
INSERT INTO special_config (discount_type, discount_value)
VALUES ('fixed', 5000.00);

-- Insert initial admin
INSERT INTO admins (user_id, role) VALUES (123456789, 'owner');
```

### 5. Deploy to Vercel
```bash
vercel --prod
```

---

This prompt covers every visible feature, UI element, button layout, emoji, message format, conversation flow, database schema, API integration, and background task observed in the PrimetrexBot screenshots — all adapted for a Next.js + TypeScript + grammY + Prisma architecture. Implement each section faithfully to produce an identical bot experience.
