import nodemailer from "nodemailer";
import { STORE_NAME } from "./constants";

export interface CodeLine {
  productName: string;
  variantName: string;
  quantity: number;
  codes: string[];
}

interface OrderCodesEmail {
  to: string;
  customerName: string;
  orderNumber: string;
  total: number;
  lines: CodeLine[];
}

function buildHtml(e: OrderCodesEmail): string {
  const rows = e.lines
    .flatMap((l) =>
      l.codes.map(
        (c, i) =>
          `<tr>
            <td style="padding:10px;border:1px solid #e5e7eb;">${l.productName} ${l.variantName}${i > 0 ? " (extra)" : ""}</td>
            <td style="padding:10px;border:1px solid #e5e7eb;"><code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-weight:bold;">${c}</code></td>
          </tr>`
      )
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
    <h1 style="color:#22d3ee;margin:0 0 8px;">${STORE_NAME}</h1>
    <p style="color:#94a3b8;margin:0 0 24px;">Order #${e.orderNumber}</p>
    <h2 style="color:#fff;">Your game codes are ready!</h2>
    <p>Hi ${e.customerName || "there"},<br/>Thank you for your purchase. Redeem your codes below:</p>
    <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:8px;overflow:hidden;color:#e2e8f0;">
      <tr><th style="padding:10px;border:1px solid #334155;text-align:left;">Item</th><th style="padding:10px;border:1px solid #334155;text-align:left;">Code</th></tr>
      ${rows}
    </table>
    <p style="margin-top:24px;"><strong>Total paid:</strong> $${e.total.toFixed(2)}</p>
    <p style="color:#94a3b8;font-size:12px;">Need help? Reply to this email and our support team will assist you.</p>
  </div>`;
}

export async function sendOrderCodesEmail(e: OrderCodesEmail): Promise<{ sent: boolean; reason?: string }> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    // Dev mode: log codes so they are not lost.
    console.log(
      `[email][dev] Order ${e.orderNumber} codes for ${e.to}:\n` +
        e.lines.map((l) => `${l.productName} ${l.variantName}: ${l.codes.join(", ")}`).join("\n")
    );
    return { sent: false, reason: "SMTP not configured - codes logged to console" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `${STORE_NAME} <${process.env.SMTP_USER}>`,
    to: e.to,
    subject: `${STORE_NAME} - Your game codes (Order #${e.orderNumber})`,
    html: buildHtml(e),
  });

  return { sent: true };
}
