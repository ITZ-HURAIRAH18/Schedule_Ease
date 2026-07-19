const BRAND = {
  name: 'NexGen',
  tagline: 'Your time, perfectly orchestrated.',
  accent: '#FC6C26',
  accentDark: '#E05A1A',
  border: '#E8DCC0',
  bg: '#FFF4D6',
  white: '#ffffff',
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#8A8A8A',
};

const headerBg = `background:linear-gradient(135deg,${BRAND.accent} 0%,${BRAND.accentDark} 100%)`;
const btnStyle = `${headerBg};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:600;display:inline-block;font-size:15px;box-shadow:0 4px 14px rgba(252,108,38,0.35)`;

const logoSvg = `<svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ng" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stop-color="${BRAND.accent}"/><stop offset="100%" stop-color="${BRAND.accentDark}"/></linearGradient></defs><rect width="32" height="32" rx="6" fill="url(#ng)"/><path d="M9 24V8l14 16V8" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const wrap = (content) => `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${BRAND.name}</title></head><body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:'Inter','-apple-system',BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" style="width:100%;padding:40px 10px;"><tr><td align="center"><table role="presentation" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04);"><tr><td>${content}</td></tr></table></td></tr></table></body></html>`;

const footer = `<div style="background:#faf7f0;padding:25px;text-align:center;border-top:1px solid ${BRAND.border};"><p style="margin:0 0 8px;color:${BRAND.textMuted};font-size:12px;line-height:1.6;">You're receiving this because you joined <strong style="color:${BRAND.accent};">${BRAND.name}</strong>.</p><p style="margin:0;color:${BRAND.textMuted};font-size:12px;">&copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p><div style="margin-top:10px;"><a href="${process.env.FRONTEND_URL || '#'}" style="color:${BRAND.accent};text-decoration:none;font-size:12px;">Visit Website</a></div></div>`;

export const userWelcomeTemplate = (user) => wrap(`
  <div style="${headerBg};padding:50px 20px;text-align:center;">
    <div style="background:#ffffff;width:72px;height:72px;margin:0 auto 20px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
      ${logoSvg}
    </div>
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.3px;">Welcome to ${BRAND.name}</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">${BRAND.tagline}</p>
  </div>
  <div style="padding:40px 30px;">
    <h2 style="margin:0 0 16px;color:${BRAND.text};font-size:22px;font-weight:700;letter-spacing:-0.3px;">Hi ${user.fullName},</h2>
    <p style="margin:0 0 20px;color:${BRAND.textSecondary};font-size:15px;line-height:1.7;">Welcome aboard! You've successfully joined <strong style="color:${BRAND.accent};">${BRAND.name}</strong> — your intelligent scheduling companion. We're excited to help you streamline your meetings, manage your availability, and stay perfectly organized.</p>
    <div style="text-align:center;margin:35px 0;">
      <a href="${process.env.FRONTEND_URL || '#'}" style="${btnStyle};">Get Started</a>
    </div>
    <p style="margin:0;color:${BRAND.textSecondary};font-size:14px;line-height:1.6;">Need help setting up your profile or scheduling your first meeting? Our team is here to help — just reply to this email and we'll get you started.</p>
    <p style="margin:35px 0 0;color:${BRAND.textMuted};font-size:13px;text-align:center;">Cheers,<br/><strong style="color:${BRAND.accent};">The ${BRAND.name} Team</strong></p>
  </div>
  ${footer}
`);

export const adminNewUserTemplate = (user) => wrap(`
  <div style="${headerBg};padding:40px 30px;text-align:center;">
    <div style="background:#ffffff;width:60px;height:60px;margin:0 auto 16px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
      ${logoSvg}
    </div>
    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.3px;">New User Registered</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">A new member has joined <strong>${BRAND.name}</strong></p>
  </div>
  <div style="padding:40px 30px;">
    <p style="margin:0 0 30px;color:${BRAND.textSecondary};font-size:15px;line-height:1.6;">A new user has successfully signed up on <strong style="color:${BRAND.accent};">${BRAND.name}</strong>. Here are their details:</p>
    <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0;background:${BRAND.bg};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};">
      <tr>
        <td style="padding:24px;">
          <div style="margin-bottom:20px;">
            <div style="display:flex;align-items:center;margin-bottom:6px;">
              <span style="font-size:14px;margin-right:8px;color:${BRAND.accent};">&#9679;</span>
              <span style="color:${BRAND.textMuted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Full Name</span>
            </div>
            <div style="color:${BRAND.text};font-size:17px;font-weight:600;padding-left:22px;">${user.fullName}</div>
          </div>
          <div style="margin-bottom:20px;">
            <div style="display:flex;align-items:center;margin-bottom:6px;">
              <span style="font-size:14px;margin-right:8px;color:${BRAND.accent};">&#9679;</span>
              <span style="color:${BRAND.textMuted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email Address</span>
            </div>
            <div style="color:${BRAND.textSecondary};font-size:15px;padding-left:22px;">${user.email}</div>
          </div>
          <div style="margin-bottom:20px;">
            <div style="display:flex;align-items:center;margin-bottom:6px;">
              <span style="font-size:14px;margin-right:8px;color:${BRAND.accent};">&#9679;</span>
              <span style="color:${BRAND.textMuted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">User Role</span>
            </div>
            <div style="padding-left:22px;">
              <span style="display:inline-block;${headerBg};color:#ffffff;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:600;text-transform:capitalize;">${user.role}</span>
            </div>
          </div>
          <div>
            <div style="display:flex;align-items:center;margin-bottom:6px;">
              <span style="font-size:14px;margin-right:8px;color:${BRAND.accent};">&#9679;</span>
              <span style="color:${BRAND.textMuted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Registration Date</span>
            </div>
            <div style="color:${BRAND.textSecondary};font-size:15px;padding-left:22px;">
              ${new Date(user.createdAt).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
  <div style="background:#faf7f0;padding:30px;text-align:center;border-top:1px solid ${BRAND.border};">
    <p style="margin:0;color:${BRAND.textMuted};font-size:13px;">This is an automatic notification from <strong style="color:${BRAND.accent};">${BRAND.name}</strong>.</p>
    <p style="margin:8px 0 0;color:${BRAND.textMuted};font-size:12px;">&copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
  </div>
`);
