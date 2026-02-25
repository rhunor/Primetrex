import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use onboarding@resend.dev as the default — Resend's shared domain, works without domain verification
const FROM_EMAIL = process.env.EMAIL_FROM || "Primetrex <onboarding@resend.dev>";

function emailHeader(appUrl: string) {
  return `
    <div style="text-align: center; padding: 28px 0 20px; border-bottom: 1px solid #f0f0f0; margin-bottom: 8px;">
      <a href="${appUrl}" style="text-decoration: none; display: inline-block;">
        <img
          src="${appUrl}/logos/PNG/Dark%20Comb.png"
          alt="Primetrex"
          width="160"
          height="auto"
          style="display: block; margin: 0 auto; max-width: 160px;"
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

  await resend.emails.send({
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
               style="background: #8808CC; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
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
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to Primetrex — Your Affiliate Account is Active!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        ${emailHeader(appUrl)}

        <div style="background: #8808CC; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center;">
          <h2 style="color: #ffffff; margin: 0 0 8px; font-size: 24px;">Welcome aboard, ${firstName}! 🎉</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 15px;">Your affiliate account is now active and ready to earn.</p>
        </div>

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <p style="color: #555; line-height: 1.6; margin-top: 0;">
            You can start earning commissions immediately by sharing your unique referral link. Every time someone subscribes through your link, you earn — every month.
          </p>

          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
            <p style="color: #333; margin: 0 0 12px; font-weight: bold; font-size: 15px;">Your commission structure:</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="color: #8808CC; font-weight: bold;">Tier 1</span>
                  <span style="color: #555; font-size: 13px;"> — Direct referrals</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; color: #8808CC; font-size: 18px;">50%</td>
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
            <li>Unique referral link &amp; QR code</li>
            <li>Direct bank withdrawals (min ₦10,000)</li>
            <li>Real-time commission notifications</li>
          </ul>

          <div style="text-align: center; margin: 24px 0 0;">
            <a href="${appUrl}/dashboard"
               style="background: #8808CC; color: white; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              Go to Your Dashboard →
            </a>
          </div>
        </div>

        ${emailFooter()}
      </div>
    `,
  });
}
