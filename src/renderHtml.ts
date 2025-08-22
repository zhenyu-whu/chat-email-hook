import { EmailRecord } from "./types";

export function renderHtml(emails: EmailRecord[]) {
  const emailsHtml = emails.length > 0 
    ? emails.map(email => `
        <div class="email-item" style="border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; background: #f9f9f9;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <strong>From:</strong> ${escapeHtml(email.from_name || email.from_email)} &lt;${escapeHtml(email.from_email)}&gt;
            <span style="color: #666; font-size: 0.9em;">${formatDate(email.received_at)}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <strong>To:</strong> ${escapeHtml(email.to_name || email.to_email)} &lt;${escapeHtml(email.to_email)}&gt;
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Subject:</strong> ${escapeHtml(email.subject || '(No Subject)')}
          </div>
          ${email.tag ? `<div style="margin-bottom: 8px;"><strong>Tag:</strong> <span style="background: #e1f5fe; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">${escapeHtml(email.tag)}</span></div>` : ''}
          <div style="font-size: 0.8em; color: #888;">
            <strong>Message ID:</strong> ${escapeHtml(email.message_id)}
          </div>
        </div>
      `).join('')
    : '<p style="text-align: center; color: #666; font-style: italic;">No emails received yet.</p>';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Email Hook - Postmark Inbound Emails</title>
        <link rel="stylesheet" type="text/css" href="https://static.integrations.cloudflare.com/styles.css">
        <style>
          .email-count {
            background: #0E838F;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
          }
          .refresh-note {
            color: #666;
            font-size: 0.9em;
            margin-top: 20px;
            text-align: center;
          }
        </style>
      </head>
    
      <body>
        <header>
          <img
            src="https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/30e0d3f6-6076-40f8-7abb-8a7676f83c00/public"
          />
          <h1>📧 Postmark Email Hook Dashboard</h1>
          <p>Displaying the latest <span class="email-count">${emails.length}</span> received emails</p>
        </header>
        <main>
          <div style="margin-bottom: 20px;">
            <h2>Recent Emails</h2>
            <p style="color: #666;">Emails are sorted by received date (newest first)</p>
          </div>
          
          ${emailsHtml}
          
          <div class="refresh-note">
            <p>Refresh this page to see newly received emails.</p>
            <small>
              <strong>Webhook Endpoint:</strong> POST to this URL to receive Postmark inbound emails
            </small>
          </div>
        </main>
      </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch {
    return dateString;
  }
}
