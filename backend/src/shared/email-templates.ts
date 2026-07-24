const webOrigin = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function emailFrame({
  eyebrow,
  title,
  intro,
  content,
  footerNote,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  content: string;
  footerNote: string;
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f7f5;color:#121c2a;font-family:Arial,'Helvetica Neue',sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f7f5;">
      <tr>
        <td align="center" style="padding:32px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #d9d9d9;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(0,53,33,.10);">
            <tr>
              <td style="background:#003521;padding:28px 34px;text-align:center;">
                <img src="${webOrigin}/brand/logo-banner-transparent.png" width="228" alt="Cannathera" style="display:block;width:228px;max-width:78%;height:auto;margin:0 auto;">
                <div style="margin-top:14px;color:#9ef5be;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(eyebrow)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 34px 30px;">
                <h1 style="margin:0;color:#003521;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;">${escapeHtml(title)}</h1>
                <p style="margin:16px 0 0;color:#5f6b65;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>
                ${content}
                <p style="margin:26px 0 0;padding-top:20px;border-top:1px solid #e3e9e5;color:#6b7280;font-size:12px;line-height:1.6;">${escapeHtml(footerNote)}</p>
              </td>
            </tr>
            <tr>
              <td style="background:#eef5f1;padding:18px 28px;text-align:center;color:#66736c;font-size:11px;line-height:1.6;">
                <strong style="color:#003521;">Cannathera</strong><br>
                Structured clinical accompaniment · Secure by design<br>
                This is an automated service message. Please do not reply.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function twoFactorEmail({
  code,
  firstName,
  isRegistration,
}: {
  code: string;
  firstName?: string | null;
  isRegistration: boolean;
}) {
  const name = firstName?.trim() ? ` ${firstName.trim()}` : '';
  const title = isRegistration
    ? 'Welcome to Cannathera'
    : 'Confirm your sign-in';
  const intro = isRegistration
    ? `Hello${name}, your account has been created. Please confirm your email address with the secure verification code below.`
    : `Hello${name}, use the secure verification code below to complete your sign-in.`;
  return {
    subject: isRegistration
      ? 'Welcome to Cannathera – verify your account'
      : 'Your Cannathera verification code',
    text: `${title}\n\n${intro}\n\nVerification code: ${code}\n\nThis code expires in 10 minutes. If you did not request this, you can safely ignore this email.`,
    html: emailFrame({
      eyebrow: isRegistration ? 'Account verification' : 'Secure sign-in',
      title,
      intro,
      content: `
        <div style="margin:28px 0 0;padding:24px;border:1px solid #b9dfca;border-radius:14px;background:#eef8f2;text-align:center;">
          <div style="color:#4f655a;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">Your verification code</div>
          <div style="margin-top:10px;color:#003521;font-family:'Courier New',monospace;font-size:38px;font-weight:700;letter-spacing:9px;">${escapeHtml(code)}</div>
          <div style="margin-top:10px;color:#66736c;font-size:12px;">Valid for 10 minutes</div>
        </div>`,
      footerNote:
        'For your security, never share this code. Cannathera support will never ask you for a verification code or password.',
    }),
  };
}

export function onboardingEmail({
  firstName,
  email,
  temporaryPassword,
}: {
  firstName?: string | null;
  email: string;
  temporaryPassword: string;
}) {
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(temporaryPassword);
  const loginUrl = `${webOrigin}/en/login`;
  const intro = `Hello${firstName?.trim() ? ` ${firstName.trim()}` : ''}, your partner administrator account is ready. Use the temporary credentials below for your first sign-in.`;
  return {
    subject: 'Welcome to Cannathera – your partner account is ready',
    text: `Welcome to Cannathera\n\n${intro}\n\nEmail: ${email}\nTemporary password: ${temporaryPassword}\nLogin: ${loginUrl}\n\nYou will be required to create a new password immediately after signing in.`,
    html: emailFrame({
      eyebrow: 'Partner onboarding',
      title: 'Your account is ready',
      intro,
      content: `
        <div style="margin:26px 0 0;padding:22px;border:1px solid #d9e5de;border-radius:14px;background:#f7faf8;">
          <div style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Sign-in email</div>
          <div style="margin-top:6px;color:#003521;font-family:'Courier New',monospace;font-size:15px;font-weight:700;word-break:break-all;">${safeEmail}</div>
          <div style="margin-top:18px;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Temporary password</div>
          <div style="margin-top:6px;color:#003521;font-family:'Courier New',monospace;font-size:20px;font-weight:700;letter-spacing:1px;">${safePassword}</div>
        </div>
        <div style="margin-top:24px;text-align:center;">
          <a href="${loginUrl}" style="display:inline-block;background:#066c41;color:#ffffff;text-decoration:none;border-radius:11px;padding:14px 26px;font-size:14px;font-weight:700;">Sign in to Cannathera</a>
        </div>`,
      footerNote:
        'You will be asked to replace the temporary password immediately after your first sign-in. Do not forward this email or share these credentials.',
    }),
  };
}
