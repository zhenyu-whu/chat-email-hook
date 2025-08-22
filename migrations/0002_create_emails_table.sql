-- Migration number: 0002 	 2025-08-22T08:00:00.000Z
-- Create emails table for storing Postmark webhook data
CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    from_email TEXT NOT NULL,
    from_name TEXT,
    to_email TEXT NOT NULL,
    to_name TEXT,
    subject TEXT,
    html_body TEXT,
    text_body TEXT,
    reply_to TEXT,
    mailbox_hash TEXT,
    tag TEXT,
    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);