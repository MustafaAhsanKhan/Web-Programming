import { Resend } from "resend";

// ─── Client ────────────────────────────────────────────────────────────────
// Resend is only initialised when an API key is present so the app still boots
// in dev without one (emails just silently no-op).
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "PropertyCRM <notifications@propertycrm.pk>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatPKR(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function scoreLabel(score: number) {
  return score === 3 ? "🔴 High" : score === 2 ? "🟡 Medium" : "🟢 Low";
}

// ─── Templates ─────────────────────────────────────────────────────────────

/** HTML template for admin "new lead" alert */
function newLeadHtml(lead: {
  name: string;
  email: string;
  phone: string;
  budget: number;
  propertyInterest?: string;
  source?: string;
  score?: number;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New Lead Alert</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
            <p style="margin:0;color:#e0e7ff;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">PropertyCRM</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;">🚀 New Lead Received</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">A new lead just came in. Here are the details:</p>

            <!-- Lead Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;border:1px solid #334155;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid #334155;">
                  <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Contact</p>
                  <p style="margin:6px 0 0;color:#f1f5f9;font-size:18px;font-weight:700;">${lead.name}</p>
                  <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${lead.email} · ${lead.phone}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%" style="padding:16px 24px;border-right:1px solid #334155;border-bottom:1px solid #334155;">
                        <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Budget</p>
                        <p style="margin:6px 0 0;color:#4ade80;font-size:16px;font-weight:700;">${formatPKR(lead.budget)}</p>
                      </td>
                      <td width="50%" style="padding:16px 24px;border-bottom:1px solid #334155;">
                        <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Priority</p>
                        <p style="margin:6px 0 0;color:#f1f5f9;font-size:16px;font-weight:700;">${scoreLabel(lead.score ?? 1)}</p>
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" style="padding:16px 24px;border-right:1px solid #334155;">
                        <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Property Interest</p>
                        <p style="margin:6px 0 0;color:#f1f5f9;font-size:14px;">${lead.propertyInterest || "Not specified"}</p>
                      </td>
                      <td width="50%" style="padding:16px 24px;">
                        <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Source</p>
                        <p style="margin:6px 0 0;color:#f1f5f9;font-size:14px;text-transform:capitalize;">${lead.source || "other"}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
              <tr>
                <td align="center">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin/leads"
                     style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;letter-spacing:0.5px;">
                    View in Dashboard →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #334155;">
            <p style="margin:0;color:#475569;font-size:12px;text-align:center;">
              PropertyCRM · Automated notification · Do not reply to this email
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** HTML template for agent assignment confirmation */
function assignmentHtml(agent: { name: string }, lead: {
  name: string;
  phone: string;
  email: string;
  budget: number;
  propertyInterest?: string;
  score?: number;
}, leadId: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Lead Assigned</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:32px 40px;">
            <p style="margin:0;color:#e0f2fe;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">PropertyCRM</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;">📋 New Lead Assigned to You</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
              Hi <strong style="color:#f1f5f9;">${agent.name}</strong>, you have been assigned a new lead. Please follow up promptly.
            </p>

            <!-- Lead Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;border:1px solid #334155;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid #334155;">
                  <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Lead</p>
                  <p style="margin:6px 0 0;color:#f1f5f9;font-size:18px;font-weight:700;">${lead.name}</p>
                  <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${lead.email}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%" style="padding:16px 24px;border-right:1px solid #334155;border-bottom:1px solid #334155;">
                        <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Phone</p>
                        <p style="margin:6px 0 0;color:#38bdf8;font-size:16px;font-weight:700;">${lead.phone}</p>
                      </td>
                      <td width="50%" style="padding:16px 24px;border-bottom:1px solid #334155;">
                        <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Budget</p>
                        <p style="margin:6px 0 0;color:#4ade80;font-size:16px;font-weight:700;">${formatPKR(lead.budget)}</p>
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" style="padding:16px 24px;border-right:1px solid #334155;">
                        <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Property Interest</p>
                        <p style="margin:6px 0 0;color:#f1f5f9;font-size:14px;">${lead.propertyInterest || "Not specified"}</p>
                      </td>
                      <td width="50%" style="padding:16px 24px;">
                        <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Priority</p>
                        <p style="margin:6px 0 0;color:#f1f5f9;font-size:14px;">${scoreLabel(lead.score ?? 1)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- WhatsApp CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
              <tr>
                <td width="48%" align="center" style="padding-right:8px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/leads/${leadId}"
                     style="display:block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:8px;font-weight:600;font-size:13px;text-align:center;">
                    View Lead →
                  </a>
                </td>
                <td width="48%" align="center" style="padding-left:8px;">
                  <a href="https://wa.me/${lead.phone.replace(/\D/g, "").replace(/^0/, "92")}"
                     style="display:block;background:#25d366;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:8px;font-weight:600;font-size:13px;text-align:center;">
                    WhatsApp →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #334155;">
            <p style="margin:0;color:#475569;font-size:12px;text-align:center;">
              PropertyCRM · Automated notification · Do not reply to this email
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface LeadEmailData {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  budget: number;
  propertyInterest?: string;
  source?: string;
  score?: number;
}

/**
 * Notify ALL admins when a new lead is created.
 * Fire-and-forget: never blocks the API response.
 */
export function sendNewLeadEmail(lead: LeadEmailData): void {
  if (!resend || !ADMIN_EMAIL) {
    console.log("[EMAIL] sendNewLeadEmail skipped — RESEND_API_KEY or ADMIN_EMAIL not set");
    return;
  }

  resend.emails
    .send({
      from: FROM,
      to: ADMIN_EMAIL.split(",").map((e) => e.trim()),
      subject: `🚀 New Lead: ${lead.name} — ${formatPKR(lead.budget)}`,
      html: newLeadHtml(lead),
    })
    .then(() => console.log(`[EMAIL] New-lead alert sent for ${lead.name}`))
    .catch((err) => console.error("[EMAIL] sendNewLeadEmail failed:", err));
}

/**
 * Notify the assigned agent when a lead is assigned to them.
 * Fire-and-forget: never blocks the API response.
 */
export function sendLeadAssignmentEmail(
  agentEmail: string,
  agentName: string,
  lead: LeadEmailData,
  leadId: string
): void {
  if (!resend) {
    console.log("[EMAIL] sendLeadAssignmentEmail skipped — RESEND_API_KEY not set");
    return;
  }

  resend.emails
    .send({
      from: FROM,
      to: agentEmail,
      subject: `📋 Lead Assigned: ${lead.name}`,
      html: assignmentHtml({ name: agentName }, lead, leadId),
    })
    .then(() => console.log(`[EMAIL] Assignment email sent to ${agentEmail}`))
    .catch((err) => console.error("[EMAIL] sendLeadAssignmentEmail failed:", err));
}
