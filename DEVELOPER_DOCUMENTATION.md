# Primetrex Affiliates — Developer Documentation

> Complete technical reference for developers. Covers the full project structure, every file and what it does, all API endpoints, the database schema, auth system, payment flows, and the Telegram bot.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Environment Variables](#3-environment-variables)
4. [Database Models](#4-database-models)
5. [Authentication System](#5-authentication-system)
6. [API Routes Reference](#6-api-routes-reference)
7. [Core Libraries](#7-core-libraries)
8. [Payment System Deep Dive](#8-payment-system-deep-dive)
9. [Commission Calculation Logic](#9-commission-calculation-logic)
10. [Telegram Bot Architecture](#10-telegram-bot-architecture)
11. [Frontend Pages](#11-frontend-pages)
12. [Cron Jobs](#12-cron-jobs)
13. [Config Files](#13-config-files)
14. [Deployment](#14-deployment)

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | MongoDB via Mongoose |
| Auth | NextAuth v5 (JWT strategy) |
| Payments | Korapay (checkout + disbursements) |
| Email | Resend (SDK v2) |
| Telegram Bot | Grammy (grammY framework) |
| Styling | Tailwind CSS |
| Animations | Framer Motion (`motion/react`) |
| Validation | Zod |
| Password hashing | bcryptjs |
| Hosting | Vercel |

---

## 2. Project Structure

```
primetrex-app/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Public auth pages (no layout wrapper)
│   │   │   ├── login/page.tsx         # 2-step login (credentials + OTP)
│   │   │   ├── register/page.tsx      # Registration form
│   │   │   ├── register/verify/       # Payment verification after signup fee
│   │   │   ├── forgot-password/       # Request password reset
│   │   │   ├── reset-password/        # Set new password
│   │   │   └── verify-email/          # Click link from email → verifies token
│   │   │
│   │   ├── (dashboard)/               # Protected user dashboard pages
│   │   │   ├── layout.tsx             # Dashboard layout with sidebar, bottom nav, email banner
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           # Main overview (stats, chart, recent referrals)
│   │   │       ├── earnings/          # Full earnings history
│   │   │       ├── referrals/         # All referrals (tier 1 + tier 2)
│   │   │       ├── withdrawals/       # Request and view withdrawals
│   │   │       ├── subscription/      # Bot subscription status and payment
│   │   │       ├── bot-subscribe/     # Bot subscribe flow
│   │   │       └── settings/          # Profile picture, bank details, password, Telegram
│   │   │
│   │   ├── (admin)/                   # Protected admin pages
│   │   │   └── admin/
│   │   │       ├── page.tsx           # Admin overview dashboard
│   │   │       ├── users/page.tsx     # User management + special affiliate toggle
│   │   │       ├── withdrawals/       # Review withdrawal requests
│   │   │       ├── transactions/      # View all transactions
│   │   │       └── orders/            # Orders management (assign affiliates, update balance)
│   │   │
│   │   └── api/                       # All API routes (Next.js Route Handlers)
│   │       ├── auth/
│   │       │   ├── [...nextauth]/     # NextAuth core handler
│   │       │   ├── pre-login/         # Step 1: verify credentials, check device trust
│   │       │   ├── verify-otp/        # Step 2: validate OTP, add trusted device
│   │       │   ├── register/          # Create new user account
│   │       │   ├── verify-email/      # Validate email token
│   │       │   ├── resend-verification/ # Resend verification email
│   │       │   ├── forgot-password/   # Send password reset email
│   │       │   └── reset-password/    # Apply new password
│   │       ├── dashboard/
│   │       │   ├── route.ts           # GET — all dashboard data in one call
│   │       │   ├── settings/          # PUT — bank details, password, Telegram unlink
│   │       │   ├── profile/           # GET/POST — profile picture
│   │       │   ├── withdraw/          # POST — submit withdrawal
│   │       │   │   └── cancel/        # POST — cancel a pending withdrawal
│   │       │   └── bot-subscribe/     # POST — initialize bot subscription payment
│   │       ├── payments/
│   │       │   ├── initialize/        # POST — create Korapay checkout for signup fee
│   │       │   └── verify/            # GET — verify signup payment after redirect
│   │       ├── bot-subscription/
│   │       │   ├── initialize/        # POST — create Korapay checkout for bot subscription
│   │       │   ├── confirm/           # POST — confirm bot subscription payment
│   │       │   └── status/            # GET — check current bot subscription status
│   │       ├── banks/                 # GET — list banks or resolve account number
│   │       ├── korapay/
│   │       │   ├── webhook/           # POST — Korapay payment/transfer webhook
│   │       │   └── callback/          # GET — Korapay redirect callback for bot payments
│   │       ├── admin/
│   │       │   ├── stats/             # GET — admin overview statistics
│   │       │   ├── users/             # GET — list users with filters
│   │       │   │   └── [id]/          # PATCH — toggle isSpecialAffiliate
│   │       │   ├── withdrawals/       # GET — list all withdrawals
│   │       │   │   └── [id]/          # PATCH — mark_paid or reject
│   │       │   ├── transactions/      # GET — all transactions
│   │       │   └── orders/
│   │       │       ├── route.ts       # GET — orders list
│   │       │       └── [id]/          # PATCH — assign_affiliate, update_balance, link_affiliate_to_user
│   │       ├── cron/
│   │       │   ├── expiry/            # GET — daily subscription expiry checker
│   │       │   └── process-withdrawals/ # GET — Saturday batch withdrawal processor
│   │       ├── telegram/
│   │       │   └── setup/             # POST — register Telegram webhook URL
│   │       ├── webhooks/
│   │       │   └── telegram/          # POST — receives all Telegram bot updates
│   │       └── dashboard/
│   │           └── notifications/     # GET — user notifications
│   │
│   ├── bot/                           # Telegram bot code
│   │   ├── index.ts                   # Bot instance (Grammy Bot object)
│   │   ├── config.ts                  # Bot constants, callback data keys
│   │   ├── handlers/
│   │   │   ├── start.ts               # /start command handler
│   │   │   ├── subscribe.ts           # Subscription flow handler
│   │   │   └── ...                    # Other command handlers
│   │   └── services/
│   │       ├── subscription.ts        # activateSubscription, manualActivateSubscriber
│   │       ├── expiry.ts              # checkExpiredSubscriptions (cron logic)
│   │       ├── invite.ts              # generateInviteLink, removeUserFromChannel
│   │       └── korapay.ts             # Bot-side Korapay helpers
│   │
│   ├── models/                        # Mongoose schema definitions
│   │   ├── User.ts
│   │   ├── Transaction.ts
│   │   ├── Withdrawal.ts
│   │   ├── Referral.ts
│   │   ├── Plan.ts
│   │   ├── BotSubscriber.ts
│   │   ├── BotPayment.ts
│   │   └── Notification.ts
│   │
│   ├── lib/                           # Shared utility modules
│   │   ├── auth.ts                    # NextAuth configuration
│   │   ├── db.ts                      # MongoDB connection with connection caching
│   │   ├── email.ts                   # All Resend email functions
│   │   ├── korapay.ts                 # Korapay API client
│   │   ├── telegram.ts                # Low-level Telegram Bot API helpers
│   │   ├── notifications.ts           # In-app notification helpers
│   │   └── utils.ts                   # formatCurrency, generateReferralCode, etc.
│   │
│   ├── components/                    # Reusable React components
│   │   ├── ui/                        # Base UI components (Button, Badge, Input, etc.)
│   │   └── ...                        # Layout components, charts, etc.
│   │
│   └── config/
│       ├── site.ts                    # Commission rates, prices, links
│       └── navigation.ts              # Dashboard and admin nav items
│
├── vercel.json                        # Cron job schedules
└── .env.local                         # Local environment variables (never commit)
```

---

## 3. Environment Variables

```bash
# Database
MONGODB_URI=mongodb+srv://...

# NextAuth
NEXTAUTH_SECRET=<random 32+ char string>
NEXTAUTH_URL=https://primetrexaffiliates.com
NEXT_PUBLIC_APP_URL=https://primetrexaffiliates.com

# Korapay
KORA_SECRET_KEY=sk_live_...
KORA_PUBLIC_KEY=pk_live_...

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@primetrexaffiliates.com

# Telegram Bot
TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=PrimetrexBot
TELEGRAM_WEBHOOK_SECRET=<random string>

# Security
CRON_SECRET=<random 32+ char string>

# reCAPTCHA
RECAPTCHA_SECRET_KEY=...
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
```

---

## 4. Database Models

### User (`src/models/User.ts`)
The core user record for web accounts.

| Field | Type | Description |
|---|---|---|
| `firstName` | String | Required |
| `lastName` | String | Required |
| `email` | String | Unique, lowercased |
| `passwordHash` | String | bcrypt hash (cost 12) |
| `role` | `"user" \| "admin"` | Default: `"user"` |
| `referralCode` | String | Unique — e.g. `PRX-XYZ1` |
| `referredBy` | ObjectId → User | The user who referred this one |
| `hasPaidSignup` | Boolean | True once the ₦10,000 fee is paid |
| `signupPaymentRef` | String | Korapay txRef stored before payment |
| `isEmailVerified` | Boolean | True after clicking the verification link |
| `emailVerificationToken` | String | 32-byte hex token |
| `emailVerificationExpires` | Date | Token expires 24h after creation |
| `resetPasswordToken` | String | 32-byte hex token |
| `resetPasswordExpires` | Date | Expires 1 hour after creation |
| `isActive` | Boolean | True once signup fee is paid |
| `telegramId` | String | Telegram chat ID (as string) |
| `telegramLinked` | Boolean | True when Telegram is linked |
| `profileImage` | String | Base64 encoded image |
| `bankDetails` | Object | `{ bankName, bankCode, accountNumber, accountName }` |
| `isSpecialAffiliate` | Boolean | Default `false`. If `true`, earns 60% instead of 40% on subscriptions |
| `knownDevices` | Array | `[{ ip: String, lastSeen: Date }]` — trusted device list |
| `twoFAOTP` | String | Current 2FA OTP code |
| `twoFAOTPExpires` | Date | OTP expires in 10 minutes |

---

### Transaction (`src/models/Transaction.ts`)
All financial ledger entries.

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId → User | Who this transaction belongs to |
| `type` | `"commission" \| "withdrawal" \| "subscription"` | |
| `amount` | Number | In NGN kobo... actually NGN (e.g. 5000 = ₦5,000) |
| `status` | `"pending" \| "completed" \| "failed"` | |
| `tier` | Number | 1 or 2 (for commission type) |
| `sourceUserId` | ObjectId → User | Who's payment generated this commission |
| `paymentReference` | String | Korapay txRef |
| `orderId` | String | `PTX-{base36}-{random5}` |
| `description` | String | Human-readable description |
| `metadata` | Object | Extra data (e.g. `{ type: "signup" }`) |

**Available balance formula**:
```
availableBalance = sum(completed commissions) - sum(completed withdrawals) - sum(pending/processing withdrawals)
```

---

### Withdrawal (`src/models/Withdrawal.ts`)
Tracks withdrawal requests and their payout status.

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId → User | |
| `amount` | Number | Min 10,000 |
| `currency` | String | Default `"NGN"` |
| `status` | `"pending" \| "processing" \| "completed" \| "rejected" \| "failed"` | |
| `bankName` | String | |
| `bankCode` | String | Korapay bank code |
| `accountNumber` | String | |
| `accountName` | String | |
| `transferCode` | String | Korapay transfer reference |
| `transferReference` | String | Used to match `transfer.success` webhook |
| `rejectionReason` | String | Populated on rejection/failure |
| `processedAt` | Date | When admin/system processed it |
| `processedBy` | ObjectId → User | Admin user who processed it |

---

### Referral (`src/models/Referral.ts`)
Tracks referral relationships and their status.

| Field | Type | Description |
|---|---|---|
| `referrerId` | ObjectId → User | The affiliate who referred |
| `referredUserId` | ObjectId → User | The person who was referred |
| `tier` | Number | 1 (direct referral) or 2 (indirect) |
| `status` | `"pending" \| "active"` | Becomes `active` after referred user pays signup fee |

When a new user registers with a referral code:
- A Tier 1 record is created linking referrer → new user (`pending`).
- If the referrer was also referred by someone, a Tier 2 record is created linking the grand-referrer → new user (`pending`).
- Both become `active` when the new user pays the signup fee.

---

### Plan (`src/models/Plan.ts`)
Defines the Telegram channel subscription tiers.

| Field | Type | Description |
|---|---|---|
| `name` | String | Plan name |
| `price` | Number | Initial subscription price (e.g., 50000) |
| `renewalPrice` | Number | Renewal price (e.g., 35000) |
| `durationDays` | Number | Default 30 |
| `channelId` | String | Telegram channel ID |
| `channelName` | String | Human-readable channel name |
| `isActive` | Boolean | Only active plans are offered |

---

### BotSubscriber (`src/models/BotSubscriber.ts`)
Tracks who is currently subscribed to the Telegram channel.

| Field | Type | Description |
|---|---|---|
| `userId` | String | Telegram chat ID (as string) |
| `username` | String | Telegram username |
| `firstName` | String | Telegram first name |
| `lastName` | String | Telegram last name |
| `planId` | ObjectId → Plan | |
| `channelId` | String | Telegram channel ID |
| `startDate` | Date | |
| `expiryDate` | Date | When the subscription ends |
| `status` | `"active" \| "expired" \| "cancelled"` | |
| `addedBy` | `"payment" \| "manual" \| "special"` | How they were added |

---

### BotPayment (`src/models/BotPayment.ts`)
Pending and completed payment intents from the Telegram bot.

| Field | Type | Description |
|---|---|---|
| `userId` | String | Telegram chat ID |
| `planId` | ObjectId → Plan | |
| `amount` | Number | Amount in NGN |
| `paymentRef` | String | Korapay txRef (`PTRX-` or `PTXW-BOT-`) |
| `paymentType` | `"new" \| "renewal"` | |
| `status` | `"pending" \| "successful"` | |
| `flwRef` | String | Korapay's internal payment reference |
| `webUserId` | ObjectId → User | Linked web account (if any) |
| `referralCode` | String | Referral code used at the time of payment |

---

### Notification (`src/models/Notification.ts`)
In-app notification records.

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId → User | |
| `type` | `"referral_signup" \| "commission_earned" \| "withdrawal_update" \| "payment_received" \| "welcome" \| "system"` | |
| `title` | String | |
| `message` | String | |
| `isRead` | Boolean | Default `false` |
| `metadata` | Object | Extra data (e.g., amount, tier) |

---

## 5. Authentication System

### Session Strategy
NextAuth v5 with **JWT strategy** (sessions stored in cookies, not database).

### JWT Token Contents
```typescript
{
  sub: userId,          // MongoDB _id
  role: "user"|"admin",
  referralCode: string,
  isActive: boolean,
  isEmailVerified: boolean
}
```

### Login Flow (`src/app/(auth)/login/page.tsx`)

```
1. User submits email + password
2. POST /api/auth/pre-login
   - Validates credentials (bcrypt compare)
   - Checks if IP is in user.knownDevices and seen within 30 days
   - If trusted device: returns { needsOTP: false }
   - If new/untrusted device: generates 6-digit OTP, saves to user.twoFAOTP,
     sends email, returns { needsOTP: true }
3. If needsOTP: show OTP input form
4. User submits OTP
5. POST /api/auth/verify-otp
   - Validates OTP against user.twoFAOTP (timing-safe compare)
   - Checks expiry (10 minutes)
   - If valid: adds IP to user.knownDevices, clears OTP
   - Returns { success: true }
6. Client calls signIn("credentials", { email, password })
   - NextAuth Credentials provider re-validates and creates JWT
```

### JWT Refresh
When the client calls `update({})` (from `useSession()`):
- The NextAuth `jwt` callback fires with `trigger === "update"`.
- The callback re-reads `isEmailVerified` and `isActive` from the database.
- Updated values are written into the JWT cookie.
- This is used after email verification to remove the banner without requiring re-login.

### Route Protection
Handled by Next.js middleware (`middleware.ts`) which checks the JWT:
- Unauthenticated users accessing `/dashboard/*` → redirect to `/login`.
- Inactive users (not paid) accessing `/dashboard/*` → redirect to `/register`.
- Non-admin users accessing `/admin/*` → redirect to `/dashboard`.

---

## 6. API Routes Reference

### Auth Routes

#### `POST /api/auth/pre-login`
- **Auth**: None required
- **Body**: `{ email, password }`
- **Returns**: `{ needsOTP: boolean }` — if `true`, show OTP form; if `false`, call `signIn()` directly

#### `POST /api/auth/verify-otp`
- **Auth**: None required
- **Body**: `{ email, otp }`
- **Returns**: `{ success: true }` — client then calls `signIn()`

#### `POST /api/auth/register`
- **Auth**: None required
- **Body**: `{ firstName, lastName, email, password, confirmPassword, referralCode?, captchaToken? }`
- **Rate limit**: 5 per IP per 15 minutes
- **Returns**: `{ success: true, userId }`
- **Side effects**: Creates User, creates Referral records if referred, sends verification email

#### `GET /api/auth/verify-email?token=`
- **Auth**: None required
- **Returns**: `{ success: true, message }` or `{ error }`
- **Side effects**: Sets `user.isEmailVerified = true`

#### `POST /api/auth/resend-verification`
- **Auth**: None required
- **Body**: `{ email }`
- **Side effects**: Generates new token, sends verification email

#### `POST /api/auth/forgot-password`
- **Auth**: None required
- **Body**: `{ email }`
- **Side effects**: Generates reset token (1 hour expiry), sends reset email

#### `POST /api/auth/reset-password`
- **Auth**: None required
- **Body**: `{ token, password }`
- **Side effects**: Updates `passwordHash`, clears reset token

---

### Dashboard Routes (all require authenticated session)

#### `GET /api/dashboard`
Returns all dashboard data in one call:
```typescript
{
  user: { name, email, referralCode, initials, bankDetails, telegramLinked },
  stats: { totalEarnings, tier1Earnings, tier2Earnings, activeReferrals,
           totalReferrals, availableBalance, totalWithdrawn, pendingWithdrawals },
  chartData: [{ month, tier1, tier2 }],  // last 6 months
  recentReferrals: [...],
  allReferrals: [...],
  earningsHistory: [...],
  withdrawalHistory: [...]
}
```

#### `PUT /api/dashboard/settings`
Updates user settings. The action is determined by which key is present in the body:
- `{ bankDetails: { bankName, bankCode, accountNumber, accountName } }` → update bank
- `{ unlinkTelegram: true }` → unlink Telegram
- `{ password: { currentPassword, newPassword } }` → change password

#### `GET /api/dashboard/profile` / `POST /api/dashboard/profile`
- GET: returns `{ profileImage }` (base64 string)
- POST body: `{ image }` (base64 string, max ~200KB after client-side resize to 200×200)

#### `POST /api/dashboard/withdraw`
- **Body**: `{ amount, bankName, bankCode, accountNumber, accountName }`
- Friday-only gate: returns 403 with `{ error, nextFriday }` on non-Fridays
- Validates amount ≥ `siteConfig.minWithdrawal`
- Creates `Withdrawal` record
- Calls `initiatePayout()` immediately
- Returns `{ success, withdrawal }` or `{ error }` with 502 if Korapay fails

#### `POST /api/dashboard/withdraw/cancel`
- **Body**: `{ withdrawalId }`
- Only cancels if status is `"pending"` (not yet sent to Korapay)

---

### Payment Routes

#### `POST /api/payments/initialize`
- **Body**: `{ email, name, referralCode? }`
- Rate limit: 3 per IP per 10 minutes
- Generates `PTXW-SIGNUP-{timestamp}-{random}` txRef
- Stores txRef on `user.signupPaymentRef`
- Calls Korapay `initializeCharge()`
- Returns `{ paymentUrl, txRef }`

#### `GET /api/payments/verify?reference=`
- Called after Korapay redirect
- Verifies payment status via Korapay API
- Activates user account, creates Transaction, credits referral commissions
- Returns `{ verified: true }` or `{ error }`

---

### Banks Route

#### `GET /api/banks`
- Without params: returns `{ banks: [{ name, code }] }` sorted alphabetically
- With `?account_number=&bank_code=`: resolves account → returns `{ accountName, accountNumber }`
- Validates `account_number` must be exactly 10 digits

---

### Korapay Webhook

#### `POST /api/korapay/webhook`
- Verifies `x-korapay-signature` header (HMAC-SHA256 with `KORA_SECRET_KEY`, timing-safe)
- Handles 3 event types:
  - `charge.success + data.status === "success"`: Processes payments by reference prefix
    - `PTXW-SIGNUP-*`: Activates affiliate account, credits commissions
    - `PTXW-BOT-*`: Activates bot subscription (web-initiated)
    - `PTRX-*`: Activates bot subscription (direct bot payment)
  - `transfer.success`: Marks withdrawal `completed`
  - `transfer.failed`: Marks withdrawal `failed`

---

### Admin Routes (all require `role === "admin"`)

#### `GET /api/admin/stats`
Returns full platform statistics: user counts, revenue, commissions, withdrawals, monthly chart data, recent users, recent transactions.

#### `GET /api/admin/users`
- Query params: `page`, `limit`, `search`, `filter` (all/active/inactive/paid/unpaid)
- Returns paginated user list with referral counts and total earnings

#### `PATCH /api/admin/users/[id]`
- **Body**: `{ isSpecialAffiliate: boolean }`
- Toggles whether a user earns 60% (special) or 40% (standard) commission rate

#### `GET /api/admin/withdrawals`
Returns all withdrawals sorted by creation date.

#### `PATCH /api/admin/withdrawals/[id]`
- **Body**: `{ action: "mark_paid" | "reject", rejectionReason? }`
- `mark_paid`: Sets status to `completed`, sends notifications
- `reject`: Sets status to `rejected` with reason, sends notifications

#### `PATCH /api/admin/orders/[id]`
- **Body**: `{ action, ... }`
- Actions: `assign_affiliate`, `update_balance`, `link_affiliate_to_user`

---

### Cron Routes (require `Authorization: Bearer CRON_SECRET`)

#### `GET /api/cron/expiry`
Calls `checkExpiredSubscriptions()`. Returns `{ expired, reminders, timestamp }`.

#### `GET /api/cron/process-withdrawals`
Batch processes all `pending` withdrawals. Returns `{ processed, failed, skipped, total, details, timestamp }`.

---

## 7. Core Libraries

### `src/lib/db.ts` — Database Connection
```typescript
dbConnect(): Promise<typeof mongoose>
```
Singleton pattern using a module-level `cached` object. On Vercel serverless functions, connections are reused across invocations within the same instance. `maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000`.

---

### `src/lib/korapay.ts` — Korapay API Client

All requests go to `https://api.korapay.com/merchant/api/v1` with `Authorization: Bearer KORA_SECRET_KEY`.

```typescript
initializeCharge(params): Promise<string>
// Creates a checkout session. Returns the checkout_url to redirect the user to.

verifyCharge(reference): Promise<KoraVerifyResponse>
// Verifies a charge by reference. Check data.status === "success".

listBanks(): Promise<KoraBank[]>
// Returns all Nigerian banks with name, code, slug.

resolveAccount(accountNumber, bankCode): Promise<{ accountName, accountNumber }>
// Validates an account number against a bank and returns the account name.

initiatePayout(params): Promise<KoraPayoutResponse>
// Initiates a bank transfer via Korapay Disbursements API.
// params: { reference, accountBank, accountNumber, amount, narration, beneficiaryName, beneficiaryEmail? }

verifyWebhookSignature(signature, payloadData): boolean
// HMAC-SHA256(JSON.stringify(payloadData), KORA_SECRET_KEY) vs header value
// Uses crypto.timingSafeEqual to prevent timing attacks.

generateWebTxRef(): string
// Returns "PTXW-SIGNUP-{timestamp}-{random6}"

generateBotTxRef(type): string
// Returns "PTXW-BOT-NEW-{timestamp}-{random6}" or "PTXW-BOT-REN-..."

generatePayoutRef(withdrawalId): string
// Returns "WTH-{withdrawalId}"
```

---

### `src/lib/email.ts` — Email Functions (Resend SDK v2)

**Important**: Resend v2 returns `{ data, error }`. It does NOT throw on failure. Every function checks the `error` field and throws if present.

```typescript
sendVerificationEmail(email, firstName, token)
// Subject: "Verify your Primetrex account"
// Contains: verification button + fallback URL + 24h expiry warning

sendPasswordResetEmail(email, firstName, token)
// Subject: "Reset your Primetrex password"
// Contains: reset button + 1h expiry warning

sendWelcomeEmail(email, firstName)
// Subject: "Welcome to Primetrex — Your Affiliate Account is Active!"
// Contains: commission structure table, dashboard link, Telegram community link

sendOrderReceiptEmail({ email, firstName, orderId, amount, description, paymentReference })
// Subject: "Order Receipt — {orderId} | Primetrex"

sendAffiliateCommissionEmail({ affiliateEmail, affiliateFirstName, buyerName,
                               commissionAmount, orderId, tier, paymentReference })
// Subject: "Commission Earned — Order {orderId} | Primetrex"

sendWithdrawalRequestEmail({ email, firstName, amount, bankName,
                             accountNumber, accountName, withdrawalId })
// Subject: "Withdrawal Request Received — ₦{amount} | Primetrex"
// Contains: warning to cancel if not requested + cancel link

sendBankDetailsChangedEmail({ email, firstName, bankName, accountNumber, accountName })
// Subject: "Security Alert: Bank Details Updated | Primetrex"
// Contains: red warning box to change password if unauthorized

sendOTPEmail(email, firstName, otp)
// Subject: "Your Primetrex Login Verification Code"
// Contains: large OTP code display, 10-minute expiry

sendSubscriptionExpiryReminderEmail({ email, firstName, channelName, daysLeft, expiryDate })
// Subject varies: "expires in X days" or "has expired"
// daysLeft === 0 → expired state (red); daysLeft > 0 → warning state (yellow)
// Contains: renewal button linking to Telegram bot

generateOrderId(): string
// Returns: "PTX-{base36timestamp}-{random5}"
```

---

### `src/lib/notifications.ts` — In-App Notifications

```typescript
createNotification({ userId, type, title, message, metadata? })

notifyReferralSignup(referrerId, referredName)
// "New Referral! {name} just signed up using your referral link."

notifyCommissionEarned(userId, amount, tier, sourceName)
// "Tier {tier} Commission Earned! You earned ₦{amount} from {name}'s subscription."

notifyWithdrawalUpdate(userId, status, amount, reason?)
// Status-specific messages for: processing, completed, failed, rejected

notifyWelcome(userId, firstName)
// "Welcome to Primetrex! Your account is now active..."
```

---

### `src/lib/telegram.ts` — Telegram Bot API (Raw HTTP)

```typescript
sendMessage(chatId, text, replyMarkup?)
// POST /sendMessage — text supports HTML parse_mode

answerCallbackQuery(callbackQueryId, text?)
// Acknowledges inline button presses

setWebhook(url, secretToken)
// Registers the webhook URL with Telegram

getWebhookInfo()
// Returns current webhook status

parseCommand(text): { command, payload } | null
// Parses "/command payload" from Telegram messages
```

---

## 8. Payment System Deep Dive

### Signup Fee Payment Flow

```
User clicks "Pay Now" on the payment page
  ↓
POST /api/payments/initialize
  - generates PTXW-SIGNUP-{ts}-{rnd} txRef
  - saves txRef to user.signupPaymentRef (so we can look up user after redirect)
  - calls korapay.initializeCharge()
  ↓
Returns { paymentUrl }
  ↓
Client redirects to Korapay hosted checkout
  ↓
User pays (card or bank transfer)
  ↓
Korapay redirects to /register/verify?reference={txRef}
  ↓
GET /api/payments/verify?reference={txRef}
  - calls korapay.verifyCharge(reference)
  - looks up user by signupPaymentRef OR customer.email
  - sets hasPaidSignup=true, isActive=true
  - creates Transaction (subscription type)
  - credits commissions to referrer(s)
  - sends welcome email + in-app notification
  ↓
Page shows success → redirects to /dashboard

  ALSO (asynchronously, at any time after payment):
  ↓
Korapay fires POST /api/korapay/webhook with event=charge.success
  - Same logic, but idempotency checks prevent double-processing
```

### Withdrawal Flow

```
User opens withdrawal form (Friday only)
  ↓
Selects bank → enters 10-digit account number
  ↓ (auto-trigger)
GET /api/banks?account_number={n}&bank_code={c}
  - Korapay resolves account name
  ↓
User sees account name confirmed, enters amount, submits
  ↓
POST /api/dashboard/withdraw
  - Validates: Friday, amount ≥ min, sufficient balance
  - Creates Withdrawal record (status: "pending")
  - Calls initiatePayout() → Korapay Disbursements
  - On success: sets status="processing", stores transferReference
  - On failure: sets status="failed", returns 502 to user
  ↓
User sees "processing" in their withdrawal list
  ↓
Later... Korapay fires:
  transfer.success event → /api/korapay/webhook
    - Finds withdrawal by transferReference
    - Sets status="completed"
    - Sends in-app notification + Telegram message

  OR

  transfer.failed event → /api/korapay/webhook
    - Sets status="failed"
    - Sends in-app notification + Telegram message
```

### Korapay Reference Prefixes

| Prefix | Meaning | Handled by |
|---|---|---|
| `PTXW-SIGNUP-` | Affiliate signup fee (web) | Webhook `charge.success` + `verify` endpoint |
| `PTXW-BOT-NEW-` | New bot subscription via website | Webhook `charge.success` |
| `PTXW-BOT-REN-` | Bot subscription renewal via website | Webhook `charge.success` |
| `PTRX-` | Direct bot payment (in Telegram) | Webhook `charge.success` |
| `WTH-{id}` | Withdrawal payout | Webhook `transfer.success` / `transfer.failed` |

---

## 9. Commission Calculation Logic

### When a Signup Payment is Received

```typescript
// In webhook (PTXW-SIGNUP-) and /api/payments/verify
const tier1Referrer = await User.findById(user.referredBy);
const tier1Rate = tier1Referrer?.isSpecialAffiliate ? 60 : siteConfig.commission.tier1Rate; // 60 or 40
const tier1Amount = amount * (tier1Rate / 100);
// → Create commission Transaction for tier1Referrer

if (tier1Referrer.referredBy) {
  const tier2Amount = amount * (siteConfig.commission.tier2Rate / 100); // always 10%
  // → Create commission Transaction for tier2 referrer
}
```

### When a Subscription Payment is Received

```typescript
// In webhook (PTXW-BOT- and PTRX-)
const tier1Referrer = await User.findById(webUser.referredBy);
const subRate = tier1Referrer?.isSpecialAffiliate ? 60 : siteConfig.commission.subscriptionRate; // 60 or 40
const tier1Amount = paidAmount * (subRate / 100);
// → Create commission Transaction for tier1Referrer

if (tier1Referrer.referredBy) {
  const tier2Amount = paidAmount * (siteConfig.commission.tier2Rate / 100); // always 10%
  // → Create commission Transaction for tier2 referrer
}
```

### Idempotency Guard
Before creating any commission transaction, the code always checks:
```typescript
const existing = await Transaction.findOne({ paymentReference: txRef, type: "commission" });
if (existing) return; // skip — already processed
```
This prevents duplicate commissions if the webhook fires more than once.

### Commission Rates (configured in `src/config/site.ts`)
```typescript
commission: {
  tier1Rate: 40,        // affiliate signup commission
  subscriptionRate: 40, // bot subscription commission
  tier2Rate: 10,        // second-level commission
}
// Special affiliates override tier1Rate and subscriptionRate with 60
```

---

## 10. Telegram Bot Architecture

### Bot Instance (`src/bot/index.ts`)
The bot is created using the Grammy framework:
```typescript
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
// Handlers are registered here
export { bot };
```

### Webhook Mode
The bot runs in webhook mode. Telegram sends updates to `POST /api/webhooks/telegram`. The endpoint verifies the `X-Telegram-Bot-Api-Secret-Token` header before processing.

### Registering the Webhook
`POST /api/telegram/setup` calls `setWebhook()` from `src/lib/telegram.ts`. This only needs to be called once (or when the URL changes).

### Account Linking Flow
```
User visits Settings → clicks "Link Telegram" link
  ↓
Link format: https://t.me/PrimetrexBot?start=link_{referralCode}
  ↓
Telegram opens the bot with start payload "link_{referralCode}"
  ↓
Bot handler (start.ts handleStartLink):
  - Extracts referral code from payload
  - Finds web User by referralCode
  - Saves user.telegramId = update.message.from.id.toString()
  - Sets user.telegramLinked = true
  - Sends welcome message with "Subscribe via Website" button
```

### Subscription Activation (`src/bot/services/subscription.ts`)

```typescript
async function activateSubscription(txRef: string)
```

1. Finds `BotPayment` by `paymentRef`.
2. Finds `Plan` by `planId`.
3. Calculates `expiryDate = now + plan.durationDays * 24 * 60 * 60 * 1000`.
4. If existing active subscription exists: extends it (adds `durationDays` to current expiry).
5. If no existing subscription: creates new `BotSubscriber` record.
6. Marks `BotPayment.status = "successful"`.
7. Generates Telegram channel invite link and DMs it to the subscriber.

### Expiry Service (`src/bot/services/expiry.ts`)

Called by `GET /api/cron/expiry` daily at 2am:

```
1. Query: BotSubscriber where status="active" AND expiryDate <= now
   → For each:
     - Set status = "expired"
     - Remove user from channel via Telegram API
     - Send Telegram DM: "Your subscription has expired"
     - Look up web User by telegramId
     - Send expiry email (if web user found with email)

2. Query: BotSubscriber where status="active" AND expiryDate between now and now+3days
   → For each:
     - Send Telegram DM: "Expires in X day(s) — renew now"
     - Look up web User by telegramId
     - Send reminder email (if web user found with email)
```

---

## 11. Frontend Pages

### Auth Pages (`src/app/(auth)/`)

| Page | Path | Description |
|---|---|---|
| Login | `/login` | 2-step: credentials first, then OTP if new device |
| Register | `/register` | Sign up form with referral code support + reCAPTCHA |
| Payment | `/register/pay` | Initiates Korapay signup fee payment |
| Verify | `/register/verify` | Polls after redirect from Korapay to confirm payment |
| Forgot Password | `/forgot-password` | Sends reset link |
| Reset Password | `/reset-password?token=` | Set new password |
| Verify Email | `/verify-email?token=` | Validates email token, calls `update({})` to refresh JWT |

### Dashboard Pages (`src/app/(dashboard)/dashboard/`)

All dashboard pages share a common layout that includes:
- Top navigation bar with profile picture and notifications bell
- Sidebar (desktop) / Bottom navigation (mobile)
- Email verification banner (if email not verified)

| Page | Path | API Used |
|---|---|---|
| Overview | `/dashboard` | `GET /api/dashboard` |
| Earnings | `/dashboard/earnings` | `GET /api/dashboard` |
| Referrals | `/dashboard/referrals` | `GET /api/dashboard` |
| Withdrawals | `/dashboard/withdrawals` | `GET /api/dashboard` + `GET /api/banks` + `POST /api/dashboard/withdraw` |
| Subscription | `/dashboard/subscription` | `GET /api/bot-subscription/status` |
| Bot Subscribe | `/dashboard/bot-subscribe` | `POST /api/dashboard/bot-subscribe` |
| Settings | `/dashboard/settings` | `PUT /api/dashboard/settings` + `GET/POST /api/dashboard/profile` + `GET /api/banks` |

### Admin Pages (`src/app/(admin)/admin/`)

All admin pages require `role === "admin"` in the JWT.

| Page | Path | API Used |
|---|---|---|
| Overview | `/admin` | `GET /api/admin/stats` |
| Users | `/admin/users` | `GET /api/admin/users` + `PATCH /api/admin/users/[id]` |
| Withdrawals | `/admin/withdrawals` | `GET /api/admin/withdrawals` + `PATCH /api/admin/withdrawals/[id]` |
| Transactions | `/admin/transactions` | `GET /api/admin/transactions` |
| Orders | `/admin/orders` | `GET /api/admin/orders` + `PATCH /api/admin/orders/[id]` |

---

## 12. Cron Jobs

Defined in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/expiry", "schedule": "0 2 * * *" },
    { "path": "/api/cron/process-withdrawals", "schedule": "0 7 * * 6" }
  ]
}
```

| Cron | Schedule | Description |
|---|---|---|
| `/api/cron/expiry` | Daily at 2:00 AM UTC | Marks expired subscriptions, removes from channel, sends reminder/expiry emails |
| `/api/cron/process-withdrawals` | Saturdays at 7:00 AM UTC | Batch-processes any remaining pending withdrawals (safety net) |

Both endpoints require:
```
Authorization: Bearer {CRON_SECRET}
```

Vercel automatically injects this header when calling cron jobs. For local testing, pass the header manually:
```bash
curl -H "Authorization: Bearer your_cron_secret" http://localhost:3000/api/cron/expiry
```

---

## 13. Config Files

### `src/config/site.ts`
The single source of truth for business rules:
```typescript
export const siteConfig = {
  name: "Primetrex",
  signupFee: 10_000,        // ₦10,000 one-time signup fee
  subscription: {
    price: 50_000,           // ₦50,000 initial bot subscription
    currency: "NGN",
  },
  commission: {
    tier1Rate: 40,           // % of signup fee paid to direct referrer
    subscriptionRate: 40,    // % of subscription paid to direct referrer
    tier2Rate: 10,           // % paid to second-level referrer
  },
  minWithdrawal: 10_000,    // Minimum withdrawal amount in NGN
  links: { ... }
};
```
To change any rate or price, **only change this file**. The rest of the code reads from it.

### `vercel.json`
Defines Vercel cron jobs. See Section 12.

---

## 14. Deployment

### Vercel (Production)
1. Push to `main` branch → Vercel auto-deploys.
2. All environment variables must be set in Vercel project settings.
3. After first deploy (or after updating bot URL), register the Telegram webhook:
   ```
   POST /api/telegram/setup
   ```
4. Register the Korapay webhook URL in the Korapay dashboard:
   ```
   https://yourdomain.com/api/korapay/webhook
   ```
   Set the events: `charge.success`, `transfer.success`, `transfer.failed`.
5. Cron jobs run automatically via Vercel — no additional setup needed.

### Switching Between Test and Live Korapay Accounts
Just update `KORA_SECRET_KEY` and `KORA_PUBLIC_KEY` to the new account's keys and register the webhook URL in the new account's Korapay dashboard. The old test webhook will start failing signature checks (returns 401) harmlessly.

### Local Development
```bash
npm install
cp .env.example .env.local
# Fill in all variables
npm run dev
```

For testing webhooks locally, use `ngrok` to expose localhost:
```bash
ngrok http 3000
# Then register https://{ngrok-url}/api/korapay/webhook in Korapay test dashboard
```
