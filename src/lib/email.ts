import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "Primetrex <noreply@primetrex.com>";

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your Primetrex account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #8808CC; font-size: 28px; margin: 0;">Primetrex</h1>
          <p style="color: #666; font-size: 14px; margin-top: 4px;">Let the Experts Trade, You Build the Business</p>
        </div>

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Welcome, ${firstName}!</h2>
          <p style="color: #555; line-height: 1.6;">
            Thank you for creating your Primetrex account. Please verify your email address by clicking the button below:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}"
               style="background: linear-gradient(135deg, #8808CC, #39005E); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
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

        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Primetrex. All rights reserved.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to Primetrex - Account Activated!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #8808CC; font-size: 28px; margin: 0;">Primetrex</h1>
        </div>

        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Welcome aboard, ${firstName}! 🎉</h2>
          <p style="color: #555; line-height: 1.6;">
            Your Primetrex affiliate account is now active. You can start earning commissions by sharing your unique referral link.
          </p>

          <div style="background: white; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #8808CC;">
            <p style="color: #333; margin: 0; font-weight: bold;">What you get:</p>
            <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
              <li>50% commission on direct referrals</li>
              <li>10% commission on sub-referrals (Tier 2)</li>
              <li>Personal affiliate dashboard</li>
              <li>Unique referral link &amp; QR code</li>
              <li>Bank withdrawal support</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard"
               style="background: linear-gradient(135deg, #8808CC, #39005E); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Primetrex. All rights reserved.
          </p>
        </div>
      </div>
    `,
  });
}
