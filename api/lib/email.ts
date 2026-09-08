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

export interface SendCreationConfirmationEmailParams {
  product: 'moments' | 'weddings';
  toEmail: string;
  name: string; // Recipient name for moments, Couple names for weddings
  shareUrl: string;
}

export interface SendFollowUpEmailParams {
  product: 'moments' | 'weddings';
  toEmail: string;
  name: string; // Recipient name for moments, Couple names for weddings
  shareUrl: string;
}

export const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/DCOZ3PaIa8p3YUlmDW8jSv?s=cl&p=a&mlu=4&ilr=4';

export async function sendCreationConfirmationEmail({
  product,
  toEmail,
  name,
  shareUrl,
}: SendCreationConfirmationEmailParams): Promise<{ success: boolean; provider: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Amorah <no-reply@amorah.xyz>';

  const isMoments = product === 'moments';
  const subject = isMoments
    ? 'Thanks for creating your Moment with Amorah'
    : 'Thanks for creating your wedding invitation with Amorah';

  const headingText = isMoments
    ? 'Your Moment story card is ready'
    : 'Your digital wedding invitation is ready';

  const bodyCopy = isMoments
    ? `Thank you for creating a special story card for <strong>${name}</strong>. Your story card is live and ready to bring a smile to their face.`
    : `Thank you for creating your wedding invitation for <strong>${name}</strong>. Your digital invitation is live and ready to share with your guests.`;

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px 24px; color: #3A0D22; background-color: #FFFEFE;">
      <h2 style="color: #3A0D22; font-size: 22px; font-weight: 700; margin-bottom: 16px;">${headingText}</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #55404A;">
        ${bodyCopy}
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #55404A;">
        You can view and share your link anytime:
      </p>
      <div style="margin: 24px 0;">
        <a href="${shareUrl}" style="background-color: #3A0D22; color: #FFFDF9; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
          View & Share Link
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #EFE5EB; margin: 28px 0;" />
      <div style="background-color: #FFF9F5; border: 1px solid #F3E6DF; padding: 20px; border-radius: 16px;">
        <h3 style="color: #3A0D22; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">Join our growing community</h3>
        <p style="font-size: 14px; line-height: 1.5; color: #6F4658; margin: 0 0 16px 0;">
          Share your love stories, connect with other couples, and see how others are celebrating the people they love.
        </p>
        <a href="${WHATSAPP_COMMUNITY_URL}" target="_blank" style="background-color: #25D366; color: #FFFFFF; padding: 10px 20px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block;">
          Join WhatsApp Community
        </a>
      </div>
      <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 28px;">
        &copy; ${new Date().getFullYear()} Amorah. All rights reserved.
      </p>
    </div>
  `;

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
          subject,
          html,
        }),
      });

      if (response.ok) {
        console.log(`[Email Service] ${product} confirmation email sent to ${toEmail} via Resend.`);
        return { success: true, provider: 'resend' };
      } else {
        const errorText = await response.text();
        console.error('[Email Service] Resend API error response:', errorText);
      }
    } catch (err) {
      console.error('[Email Service] Failed to send confirmation email via Resend:', err);
    }
  }

  console.log(`\n=============================================================`);
  console.log(`✉️  [EMAIL SERVICE DEV FALLBACK] ${product.toUpperCase()} Confirmation Email`);
  console.log(`TO: ${toEmail}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`SHARE URL: ${shareUrl}`);
  console.log(`COMMUNITY CTA: ${WHATSAPP_COMMUNITY_URL}`);
  console.log(`=============================================================\n`);

  return { success: true, provider: 'console-fallback' };
}

export async function sendFollowUpEmail({
  product,
  toEmail,
  name,
  shareUrl,
}: SendFollowUpEmailParams): Promise<{ success: boolean; provider: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Amorah <no-reply@amorah.xyz>';

  const isMoments = product === 'moments';
  const subject = isMoments
    ? 'How was your Amorah Moment received?'
    : 'How did your wedding celebration go?';

  const headingText = isMoments
    ? 'How was your story card received?'
    : 'How was your wedding day?';

  const bodyCopy = isMoments
    ? `A few days ago you created a special story card for <strong>${name}</strong>. We would love to hear how they received your gift. Did it bring a smile or warm memories?`
    : `It has been a week since your wedding date for <strong>${name}</strong>. We hope your wedding celebration was everything you dreamed of and more.`;

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px 24px; color: #3A0D22; background-color: #FFFEFE;">
      <h2 style="color: #3A0D22; font-size: 22px; font-weight: 700; margin-bottom: 16px;">${headingText}</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #55404A;">
        ${bodyCopy}
      </p>
      <div style="margin: 24px 0;">
        <a href="${shareUrl}" style="background-color: #3A0D22; color: #FFFDF9; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
          Revisit Story Card
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #EFE5EB; margin: 28px 0;" />
      <div style="background-color: #FFF9F5; border: 1px solid #F3E6DF; padding: 20px; border-radius: 16px;">
        <h3 style="color: #3A0D22; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">Join our growing community</h3>
        <p style="font-size: 14px; line-height: 1.5; color: #6F4658; margin: 0 0 16px 0;">
          Share your experience with other members of our community and connect with people who believe in celebrating love.
        </p>
        <a href="${WHATSAPP_COMMUNITY_URL}" target="_blank" style="background-color: #25D366; color: #FFFFFF; padding: 10px 20px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block;">
          Join WhatsApp Community
        </a>
      </div>
      <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 28px;">
        &copy; ${new Date().getFullYear()} Amorah. All rights reserved.
      </p>
    </div>
  `;

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
          subject,
          html,
        }),
      });

      if (response.ok) {
        console.log(`[Email Service] ${product} follow-up email sent to ${toEmail} via Resend.`);
        return { success: true, provider: 'resend' };
      } else {
        const errorText = await response.text();
        console.error('[Email Service] Resend API error response:', errorText);
      }
    } catch (err) {
      console.error('[Email Service] Failed to send follow-up email via Resend:', err);
    }
  }

  console.log(`\n=============================================================`);
  console.log(`✉️  [EMAIL SERVICE DEV FALLBACK] ${product.toUpperCase()} Follow-Up Email`);
  console.log(`TO: ${toEmail}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`SHARE URL: ${shareUrl}`);
  console.log(`COMMUNITY CTA: ${WHATSAPP_COMMUNITY_URL}`);
  console.log(`=============================================================\n`);

  return { success: true, provider: 'console-fallback' };
}
