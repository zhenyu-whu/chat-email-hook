// Postmark Inbound Webhook Payload Types
// Based on: https://postmarkapp.com/developer/webhooks/inbound-webhook

export interface PostmarkInboundWebhook {
  FromName: string;
  MessageStream: string;
  From: string;
  FromFull: {
    Email: string;
    Name: string;
    MailboxHash: string;
  };
  To: string;
  ToFull: Array<{
    Email: string;
    Name: string;
    MailboxHash: string;
  }>;
  Cc?: string;
  CcFull?: Array<{
    Email: string;
    Name: string;
    MailboxHash: string;
  }>;
  Bcc?: string;
  BccFull?: Array<{
    Email: string;
    Name: string;
    MailboxHash: string;
  }>;
  OriginalRecipient: string;
  Subject: string;
  MessageID: string;
  ReplyTo?: string;
  MailboxHash: string;
  Date: string;
  TextBody?: string;
  HtmlBody?: string;
  StrippedTextReply?: string;
  Tag?: string;
  Headers: Array<{
    Name: string;
    Value: string;
  }>;
  Attachments?: Array<{
    Name: string;
    Content: string;
    ContentType: string;
    ContentLength: number;
  }>;
}

// Database Email Record Type
export interface EmailRecord {
  id?: number;
  message_id: string;
  from_email: string;
  from_name?: string;
  to_email: string;
  to_name?: string;
  subject?: string;
  html_body?: string;
  text_body?: string;
  reply_to?: string;
  mailbox_hash?: string;
  tag?: string;
  received_at: string;
  created_at?: string;
}

// Response types for API
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}