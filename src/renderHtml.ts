import { EmailRecord } from "./types";

export function renderHtml(emails: EmailRecord[]) {
  const emailsHtml = emails.length > 0 
    ? `
      <table class="emails-table">
        <thead>
          <tr>
            <th>Received</th>
            <th>From</th>
            <th>To</th>
            <th>Subject</th>
            <th>Tag</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${emails.map((email, index) => `
            <tr class="email-row" onclick="toggleEmailDetails(${index})">
              <td class="date-cell">${formatDateShort(email.received_at)}</td>
              <td class="from-cell">
                <div class="sender-name">${escapeHtml(email.from_name || email.from_email)}</div>
                <div class="sender-email">${escapeHtml(email.from_email)}</div>
              </td>
              <td class="to-cell">
                <div class="recipient-name">${escapeHtml(email.to_name || email.to_email)}</div>
                <div class="recipient-email">${escapeHtml(email.to_email)}</div>
              </td>
              <td class="subject-cell">${escapeHtml(email.subject || '(No Subject)')}</td>
              <td class="tag-cell">
                ${email.tag ? `<span class="tag-badge">${escapeHtml(email.tag)}</span>` : '<span class="no-tag">-</span>'}
              </td>
              <td class="action-cell">
                <span class="expand-icon" id="icon-${index}">▶</span>
              </td>
            </tr>
            <tr class="email-details" id="details-${index}">
              <td colspan="6">
                <div class="detail-content">
                  <div class="detail-section">
                    <h4>Email Details</h4>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <strong>Message ID:</strong>
                        <span>${escapeHtml(email.message_id)}</span>
                      </div>
                      <div class="detail-item">
                        <strong>Received:</strong>
                        <span>${formatDate(email.received_at)}</span>
                      </div>
                      ${email.reply_to ? `
                        <div class="detail-item">
                          <strong>Reply To:</strong>
                          <span>${escapeHtml(email.reply_to)}</span>
                        </div>
                      ` : ''}
                      ${email.mailbox_hash ? `
                        <div class="detail-item">
                          <strong>Mailbox Hash:</strong>
                          <span>${escapeHtml(email.mailbox_hash)}</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                  ${email.text_body ? `
                    <div class="detail-section">
                      <h4>Text Body</h4>
                      <div class="text-body">${escapeHtml(email.text_body).replace(/\n/g, '<br>')}</div>
                    </div>
                  ` : ''}
                  ${email.html_body ? `
                    <div class="detail-section">
                      <h4>HTML Body</h4>
                      <div class="html-preview">
                        <iframe srcdoc="${escapeHtml(email.html_body)}" 
                                style="width: 100%; height: 300px; border: 1px solid #ddd; border-radius: 4px;">
                        </iframe>
                      </div>
                    </div>
                  ` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    : '<div class="no-emails"><p>No emails received yet.</p></div>';

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
          
          /* Table Styles */
          .emails-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .emails-table th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
          }
          
          .emails-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
          }
          
          .email-row {
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .email-row:hover {
            background-color: #f8f9fa;
          }
          
          .date-cell {
            font-size: 0.9em;
            color: #666;
            width: 140px;
          }
          
          .from-cell, .to-cell {
            width: 200px;
          }
          
          .sender-name, .recipient-name {
            font-weight: 500;
            margin-bottom: 2px;
          }
          
          .sender-email, .recipient-email {
            font-size: 0.85em;
            color: #666;
          }
          
          .subject-cell {
            font-weight: 500;
            max-width: 250px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .tag-cell {
            width: 100px;
            text-align: center;
          }
          
          .tag-badge {
            background: #e1f5fe;
            color: #0277bd;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 500;
          }
          
          .no-tag {
            color: #ccc;
          }
          
          .action-cell {
            width: 60px;
            text-align: center;
          }
          
          .expand-icon {
            transition: transform 0.2s;
            font-size: 0.8em;
            color: #666;
          }
          
          .expand-icon.expanded {
            transform: rotate(90deg);
          }
          
          /* Detail Styles */
          .email-details {
            display: none;
            background: #f8f9fa;
          }
          
          .email-details.show {
            display: table-row;
          }
          
          .detail-content {
            padding: 20px;
          }
          
          .detail-section {
            margin-bottom: 20px;
          }
          
          .detail-section h4 {
            margin: 0 0 10px 0;
            color: #495057;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 5px;
          }
          
          .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }
          
          .detail-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .detail-item strong {
            color: #495057;
            font-size: 0.9em;
          }
          
          .text-body {
            background: white;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 0.9em;
          }
          
          .html-preview {
            margin-top: 10px;
          }
          
          .no-emails {
            text-align: center;
            padding: 40px;
            color: #666;
            font-style: italic;
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            .emails-table {
              font-size: 0.9em;
            }
            
            .from-cell, .to-cell {
              width: 150px;
            }
            
            .subject-cell {
              max-width: 150px;
            }
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
        
        <script>
          function toggleEmailDetails(index) {
            const detailsRow = document.getElementById('details-' + index);
            const icon = document.getElementById('icon-' + index);
            
            if (detailsRow.classList.contains('show')) {
              detailsRow.classList.remove('show');
              icon.classList.remove('expanded');
            } else {
              // Close other open details
              document.querySelectorAll('.email-details.show').forEach(row => {
                row.classList.remove('show');
              });
              document.querySelectorAll('.expand-icon.expanded').forEach(iconEl => {
                iconEl.classList.remove('expanded');
              });
              
              // Open current details
              detailsRow.classList.add('show');
              icon.classList.add('expanded');
            }
          }
        </script>
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

function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  } catch {
    return dateString;
  }
}
