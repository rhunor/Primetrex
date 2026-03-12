import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM!;

function emailHeader(appUrl: string) {
  return `
    <style>
      @media (prefers-color-scheme: dark) {
        .ptx-logo-light { display: none !important; max-height: 0 !important; overflow: hidden !important; }
        .ptx-logo-dark  { display: block !important; max-height: none !important; }
        .ptx-divider    { border-color: #333 !important; }
      }
    </style>
    <div style="text-align: center; padding: 28px 0 20px; border-bottom: 1px solid #f0f0f0; margin-bottom: 8px;" class="ptx-divider">
      <a href="${appUrl}" style="text-decoration: none; display: inline-block;">
        <!-- Shown in light mode (default) -->
        <img
          class="ptx-logo-light"
          src="${appUrl}/logos/PNG/Dark%20Comb.png"
          alt="Primetrex"
          width="160"
          height="auto"
          style="display: block; margin: 0 auto; max-width: 160px;"
        />
        <!-- Shown in dark mode -->
        <img
          class="ptx-logo-dark"
          src="${appUrl}/logos/PNG/Light%20Comb.png"
          alt="Primetrex"
          width="160"
          height="auto"
          style="display: none; margin: 0 auto; max-width: 160px;"
        />
      </a>
    </div>
  `;
}

function emailFooter() {
  return `
    <div style="text-align: center; padding: 24px 0 8px; border-top: 1px solid #eee; margin-top: 8px;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        &copy; ${new Date().getFullYear()} Primetrex Affiliates. All rights reserved.
      </p>
      <p style="color: #bbb; font-size: 11px; margin-top: 4px;">
        primetrexaffiliates.com
      </p>
    </div>
  `;
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  // Log URL in non-production so it's visible in Vercel function logs during testing
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Email verification URL for ${email}:`, verifyUrl);
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your Primetrex account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        ${emailHeader(appUrl)}

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Welcome, ${firstName}!</h2>
          <p style="color: #555; line-height: 1.6;">
            Thank you for creating your Primetrex account. Please verify your email address by clicking the button below:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}"
               style="background: linear-gradient(135deg, #39005E 0%, #8808CC 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              Verify Email Address
            </a>
          </div>

          <p style="color: #888; font-size: 13px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${verifyUrl}" style="color: #8808CC; word-break: break-all;">${verifyUrl}</a>
          </p>

          <p style="color: #888; font-size: 13px;">
            This link expires in 24 hours.
          </p>
        </div>

        ${emailFooter()}
      </div>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Password reset URL for ${email}:`, resetUrl);
  }

  const { error: resetError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your Primetrex password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        ${emailHeader(appUrl)}

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #555; line-height: 1.6;">
            Hi ${firstName}, we received a request to reset your Primetrex account password.
            Click the button below to set a new password:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: linear-gradient(135deg, #39005E 0%, #8808CC 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              Reset My Password
            </a>
          </div>

          <p style="color: #888; font-size: 13px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #8808CC; word-break: break-all;">${resetUrl}</a>
          </p>

          <p style="color: #888; font-size: 13px;">
            This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.
          </p>
        </div>

        ${emailFooter()}
      </div>
    `,
  });
  if (resetError) throw new Error(`Resend error: ${resetError.message}`);
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error: welcomeError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to Primetrex — Your Affiliate Account is Active!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        ${emailHeader(appUrl)}

        <div style="background: linear-gradient(135deg, #39005E 0%, #8808CC 100%); border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center;">
          <h2 style="color: #ffffff; margin: 0 0 8px; font-size: 24px;">Welcome aboard, ${firstName}! 🎉</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 15px;">Your affiliate account is now active and ready to earn.</p>
        </div>

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <p style="color: #555; line-height: 1.6; margin-top: 0;">
            You can start earning commissions immediately by sharing your unique affiliate link. Every time someone subscribes through your link, you earn — every month.
          </p>

          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
            <p style="color: #333; margin: 0 0 12px; font-weight: bold; font-size: 15px;">Your commission structure:</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="color: #8808CC; font-weight: bold;">Affiliate Join</span>
                  <span style="color: #555; font-size: 13px;"> — When referral joins as affiliate</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; color: #8808CC; font-size: 18px;">40%</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="color: #8808CC; font-weight: bold;">Tier 1</span>
                  <span style="color: #555; font-size: 13px;"> — Subscription payments from direct referrals</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; color: #8808CC; font-size: 18px;">40%</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <span style="color: #1DBA2B; font-weight: bold;">Tier 2</span>
                  <span style="color: #555; font-size: 13px;"> — Your referrals' referrals</span>
                </td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1DBA2B; font-size: 18px;">10%</td>
              </tr>
            </table>
          </div>

          <ul style="color: #555; line-height: 2; padding-left: 20px; margin: 0 0 24px;">
            <li>Personal affiliate dashboard with live stats</li>
            <li>Unique affiliate link &amp; QR code</li>
            <li>Direct bank withdrawals (min ₦10,000)</li>
            <li>Real-time commission notifications</li>
          </ul>

          <div style="text-align: center; margin: 24px 0 0;">
            <a href="${appUrl}/dashboard"
               style="background: linear-gradient(135deg, #39005E 0%, #8808CC 100%); color: white; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              Go to Your Dashboard →
            </a>
          </div>

          <div style="text-align: center; margin: 20px 0 0;">
            <p style="color: #555; font-size: 14px; margin: 0 0 10px;">Join the Primetrex Affiliates community on Telegram:</p>
            <a href="https://t.me/Primetrexaffiliates"
               style="background: #229ED9; color: white; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
              Join Telegram Community →
            </a>
          </div>
        </div>

        ${emailFooter()}
      </div>
    `,
  });
  if (welcomeError) throw new Error(`Resend error: ${welcomeError.message}`);
}

// ─── Order ID generator ───────────────────────────────────────────────────────
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PTX-${timestamp}-${random}`;
}

// ─── Order receipt email sent to the buyer ────────────────────────────────────
export async function sendOrderReceiptEmail(params: {
  email: string;
  firstName: string;
  orderId: string;
  amount: number;
  description: string;
  paymentReference: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { email, firstName, orderId, amount, description, paymentReference } = params;

  const { error: receiptError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Order Receipt — ${orderId} | Primetrex`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        ${emailHeader(appUrl)}

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Payment Receipt</h2>
          <p style="color: #555; line-height: 1.6;">Hi ${firstName}, thank you for your payment.</p>

          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Order ID</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; font-family: monospace; color: #8808CC; font-size: 14px;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Description</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #333; font-size: 13px;">${description}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Reference</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-family: monospace; color: #555; font-size: 12px;">${paymentReference}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #333; font-weight: bold;">Amount Paid</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #8808CC; font-size: 20px;">&#8358;${amount.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          <p style="color: #888; font-size: 13px; margin: 0;">
            Keep your Order ID <strong>${orderId}</strong> safe. You may need it when contacting support.
          </p>
        </div>
        ${emailFooter()}
      </div>
    `,
  });
  if (receiptError) throw new Error(`Resend error: ${receiptError.message}`);
}

// ─── Affiliate commission notification email ──────────────────────────────────
export async function sendAffiliateCommissionEmail(params: {
  affiliateEmail: string;
  affiliateFirstName: string;
  buyerName: string;
  commissionAmount: number;
  orderId: string;
  tier: number;
  paymentReference: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { affiliateEmail, affiliateFirstName, buyerName, commissionAmount, orderId, tier, paymentReference } = params;

  const { error: commissionError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: affiliateEmail,
    subject: `Commission Earned — Order ${orderId} | Primetrex`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        ${emailHeader(appUrl)}

        <div style="background: linear-gradient(135deg, #39005E 0%, #8808CC 100%); border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
          <h2 style="color: #ffffff; margin: 0 0 6px; font-size: 22px;">Commission Earned!</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 15px;">Tier ${tier} commission credited</p>
        </div>

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <p style="color: #555; line-height: 1.6; margin-top: 0;">
            Hi ${affiliateFirstName}, you earned a commission from a transaction by one of your referrals.
          </p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Order ID</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; font-family: monospace; color: #8808CC; font-size: 14px;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Buyer</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #333; font-size: 13px;">${buyerName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Commission Tier</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #555;">Tier ${tier}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Reference</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-family: monospace; color: #555; font-size: 12px;">${paymentReference}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #333; font-weight: bold;">Your Commission</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #8808CC; font-size: 20px;">&#8358;${commissionAmount.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          <p style="color: #888; font-size: 13px;">
            If this commission does not appear in your dashboard, contact support with Order ID <strong>${orderId}</strong>.
          </p>
          <div style="text-align: center; margin: 20px 0 0;">
            <a href="${appUrl}/dashboard/earnings"
               style="background: linear-gradient(135deg, #39005E 0%, #8808CC 100%); color: white; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
              View Earnings &#8594;
            </a>
          </div>
        </div>
        ${emailFooter()}
      </div>
    `,
  });
  if (commissionError) throw new Error(`Resend error: ${commissionError.message}`);
}

// ─── Withdrawal request email ─────────────────────────────────────────────────
export async function sendWithdrawalRequestEmail(params: {
  email: string;
  firstName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  withdrawalId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { email, firstName, amount, bankName, accountNumber, accountName, withdrawalId } = params;

  const { error: withdrawalError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Withdrawal Request Received — ₦${amount.toLocaleString()} | Primetrex`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        ${emailHeader(appUrl)}

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Withdrawal Request Received</h2>
          <p style="color: #555; line-height: 1.6;">
            Hi ${firstName}, we received your withdrawal request. It will be processed on the next Saturday.
          </p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Amount</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; color: #8808CC; font-size: 18px;">&#8358;${amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Bank</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #333; font-size: 13px;">${bankName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Account Number</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-family: monospace; color: #333; font-size: 13px;">${accountNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888; font-size: 13px;">Account Name</td>
                <td style="padding: 10px 0; text-align: right; color: #333; font-size: 13px;">${accountName}</td>
              </tr>
            </table>
          </div>
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 14px; margin: 16px 0;">
            <p style="color: #856404; font-size: 13px; margin: 0;">
              <strong>&#9888; If you did not request this withdrawal</strong>, cancel it immediately from your dashboard or contact support.
            </p>
          </div>
          <div style="text-align: center; margin: 20px 0 0;">
            <a href="${appUrl}/dashboard/withdrawals"
               style="background: linear-gradient(135deg, #39005E 0%, #8808CC 100%); color: white; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
              View / Cancel Withdrawal &#8594;
            </a>
          </div>
          <p style="color: #aaa; font-size: 11px; text-align: center; margin-top: 12px;">Reference: ${withdrawalId}</p>
        </div>
        ${emailFooter()}
      </div>
    `,
  });
  if (withdrawalError) throw new Error(`Resend error: ${withdrawalError.message}`);
}

// ─── Bank details changed security alert ──────────────────────────────────────
export async function sendBankDetailsChangedEmail(params: {
  email: string;
  firstName: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { email, firstName, bankName, accountNumber, accountName } = params;

  const { error: bankError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Security Alert: Bank Details Updated | Primetrex",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        ${emailHeader(appUrl)}

        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="font-size: 28px; margin: 0;">&#9888;&#65039;</p>
          <h2 style="color: #856404; margin: 8px 0 0;">Security Alert</h2>
          <p style="color: #856404; margin: 4px 0 0; font-size: 14px;">Your bank account details were changed</p>
        </div>

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <p style="color: #555; line-height: 1.6; margin-top: 0;">
            Hi ${firstName}, your withdrawal bank details on Primetrex were just updated to the following:
          </p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 16px 0; border: 1px solid #eee;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Bank</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #333; font-size: 13px;">${bankName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Account Number</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-family: monospace; color: #333; font-size: 13px;">${accountNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888; font-size: 13px;">Account Name</td>
                <td style="padding: 10px 0; text-align: right; color: #333; font-size: 13px;">${accountName}</td>
              </tr>
            </table>
          </div>
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 14px; margin: 16px 0;">
            <p style="color: #721c24; font-size: 13px; margin: 0;">
              <strong>If you did not make this change</strong>, your account may be compromised. Change your password immediately and contact support.
            </p>
          </div>
          <div style="text-align: center; margin: 20px 0 0;">
            <a href="${appUrl}/dashboard/settings"
               style="background: #dc3545; color: white; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
              Secure My Account &#8594;
            </a>
          </div>
        </div>
        ${emailFooter()}
      </div>
    `,
  });
  if (bankError) throw new Error(`Resend error: ${bankError.message}`);
}

// ─── Subscription expiry reminder email ──────────────────────────────────────
export async function sendSubscriptionExpiryReminderEmail(params: {
  email: string;
  firstName: string;
  channelName: string;
  daysLeft: number;
  expiryDate: Date;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { email, firstName, channelName, daysLeft, expiryDate } = params;

  const isExpired = daysLeft <= 0;
  const formattedDate = expiryDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject = isExpired
    ? `Your Primetrex subscription has expired — Renew now`
    : `Your Primetrex subscription expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;

  const { error: expiryError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        ${emailHeader(appUrl)}

        <div style="background: ${isExpired ? "#f8d7da" : "#fff3cd"}; border: 2px solid ${isExpired ? "#f5c6cb" : "#ffc107"}; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="font-size: 32px; margin: 0;">${isExpired ? "&#9940;" : "&#9203;"}</p>
          <h2 style="color: ${isExpired ? "#721c24" : "#856404"}; margin: 8px 0 0; font-size: 20px;">
            ${isExpired ? "Subscription Expired" : `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
          </h2>
          <p style="color: ${isExpired ? "#721c24" : "#856404"}; margin: 4px 0 0; font-size: 14px;">
            ${channelName}
          </p>
        </div>

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <p style="color: #555; line-height: 1.6; margin-top: 0;">
            Hi ${firstName},
            ${
              isExpired
                ? ` your subscription to <strong>${channelName}</strong> expired on <strong>${formattedDate}</strong>. You have been removed from the channel.`
                : ` your subscription to <strong>${channelName}</strong> will expire on <strong>${formattedDate}</strong>. Renew now to keep your access uninterrupted.`
            }
          </p>

          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">Channel</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; color: #333; font-size: 13px;">${channelName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888; font-size: 13px;">${isExpired ? "Expired on" : "Expires on"}</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: ${isExpired ? "#dc3545" : "#856404"}; font-size: 13px;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 24px 0 0;">
            <a href="https://t.me/Primetrex_bot"
               style="background: linear-gradient(135deg, #39005E 0%, #8808CC 100%); color: white; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              Renew Subscription &#8594;
            </a>
          </div>

          <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 16px;">
            Open the Primetrex bot on Telegram to renew your plan.
          </p>
        </div>

        ${emailFooter()}
      </div>
    `,
  });
  if (expiryError) throw new Error(`Resend error: ${expiryError.message}`);
}

// ─── OTP email for 2FA login verification ────────────────────────────────────
export async function sendOTPEmail(email: string, firstName: string, otp: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error: otpError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your Primetrex Login Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        ${emailHeader(appUrl)}

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Login Verification</h2>
          <p style="color: #555; line-height: 1.6;">
            Hi ${firstName}, we detected a login from a new device. Enter the code below to verify your identity.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #39005E 0%, #8808CC 100%); border-radius: 12px; padding: 20px 40px;">
              <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0 0 8px; letter-spacing: 0.1em; text-transform: uppercase;">Verification Code</p>
              <p style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 0.3em; margin: 0; font-family: monospace;">${otp}</p>
            </div>
          </div>

          <p style="color: #888; font-size: 13px; text-align: center;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #888; font-size: 13px; text-align: center;">If you did not attempt to log in, please change your password immediately.</p>
        </div>

        ${emailFooter()}
      </div>
    `,
  });
  if (otpError) throw new Error(`Resend error: ${otpError.message}`);
}
