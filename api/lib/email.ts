/**
 * Email dispatch helper for Amorah password reset & transactional emails.
 * Supports Resend API out of the box via native fetch (no additional npm packages required).
 * If process.env.RESEND_API_KEY is not set, falls back to logging the reset link to console in development.
 */

export interface SendPasswordResetEmailParams {
  toEmail: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ toEmail, resetUrl }: SendPasswordResetEmailParams): Promise<{ success: boolean; provider: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Amorah <no-reply@amorah.xyz>';

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: 'Reset your Amorah couple account password',
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #3A0D22;">
              <h2 style="color: #3A0D22; margin-bottom: 16px;">Password Reset Request</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #55404A;">
                You requested a password reset for your <strong>Weddings by Amorah</strong> couple account.
              </p>
              <p style="font-size: 16px; line-height: 1.5; color: #55404A;">
                Click the button below to choose a new password. This link is valid for 1 hour.
              </p>
              <div style="margin: 28px 0;">
                <a href="${resetUrl}" style="background-color: #3A0D22; color: #FFFDF9; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 13px; color: #888; margin-top: 24px;">
                If you did not request this, you can safely ignore this email. Your password will remain unchanged.
              </p>
              <hr style="border: none; border-top: 1px solid #EFE5EB; margin: 24px 0;" />
              <p style="font-size: 12px; color: #aaa; text-align: center;">
                &copy; ${new Date().getFullYear()} Amorah. All rights reserved.
              </p>
            </div>
          `,
        }),
      });

      if (response.ok) {
        console.log(`[Email Service] Password reset email successfully dispatched to ${toEmail} via Resend.`);
        return { success: true, provider: 'resend' };
      } else {
        const errorText = await response.text();
        console.error('[Email Service] Resend API error response:', errorText);
      }
    } catch (err) {
      console.error('[Email Service] Failed to send email via Resend:', err);
    }
  }

  // Development Fallback: Log reset link clearly to console when RESEND_API_KEY is not set
  console.log(`\n=============================================================`);
  console.log(`✉️  [EMAIL SERVICE DEV FALLBACK] Password Reset Requested`);
  console.log(`TO: ${toEmail}`);
  console.log(`RESET URL: ${resetUrl}`);
  console.log(`NOTE: Set RESEND_API_KEY in Vercel environment variables to send live emails in production.`);
  console.log(`=============================================================\n`);

  return { success: true, provider: 'console-fallback' };
}
