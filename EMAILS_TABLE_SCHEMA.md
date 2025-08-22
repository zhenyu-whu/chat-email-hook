# Emails Table Schema Documentation

## Database Information
- **Database Type**: Cloudflare D1 (SQLite-compatible)
- **Database Name**: `d1-email`
- **Database ID**: `3f02db09-d677-418a-8cc6-0d76ba71a358`
- **Table Name**: `emails`

## Table Schema

### Table Structure
```sql
CREATE TABLE emails (
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
```

### Indexes
```sql
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX idx_emails_message_id ON emails(message_id);
```

## Field Descriptions

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `id` | INTEGER | NO | Auto-incrementing primary key |
| `message_id` | TEXT | NO | Unique identifier from Postmark (e.g., "b7bc2f4a-e38e-4336-af7d-e6c392c2f817") |
| `from_email` | TEXT | NO | Sender's email address |
| `from_name` | TEXT | YES | Sender's display name (optional) |
| `to_email` | TEXT | NO | Recipient's email address |
| `to_name` | TEXT | YES | Recipient's display name (optional) |
| `subject` | TEXT | YES | Email subject line |
| `html_body` | TEXT | YES | HTML version of email content |
| `text_body` | TEXT | YES | Plain text version of email content |
| `reply_to` | TEXT | YES | Reply-to email address if different from sender |
| `mailbox_hash` | TEXT | YES | Postmark mailbox hash for routing |
| `tag` | TEXT | YES | Postmark tag for categorization |
| `received_at` | DATETIME | NO | When the email was received by Postmark |
| `created_at` | DATETIME | NO | When the record was created in database |

## Data Examples

### Sample Record
```json
{
  "id": 1,
  "message_id": "b7bc2f4a-e38e-4336-af7d-e6c392c2f817",
  "from_email": "sender@example.com",
  "from_name": "John Doe",
  "to_email": "recipient@yourdomain.com",
  "to_name": "Jane Smith",
  "subject": "Important Update",
  "html_body": "<p>Hello Jane,</p><p>This is an important update...</p>",
  "text_body": "Hello Jane,\n\nThis is an important update...",
  "reply_to": "noreply@example.com",
  "mailbox_hash": "abc123def456",
  "tag": "newsletter",
  "received_at": "2025-08-22T10:30:00.000Z",
  "created_at": "2025-08-22T10:30:05.123Z"
}
```

## Common Query Patterns

### Get Latest Emails
```sql
SELECT * FROM emails 
ORDER BY received_at DESC 
LIMIT 10;
```

### Filter by Sender
```sql
SELECT * FROM emails 
WHERE from_email = 'sender@example.com' 
ORDER BY received_at DESC;
```

### Filter by Tag
```sql
SELECT * FROM emails 
WHERE tag = 'newsletter' 
ORDER BY received_at DESC;
```

### Search by Subject
```sql
SELECT * FROM emails 
WHERE subject LIKE '%keyword%' 
ORDER BY received_at DESC;
```

### Get Email by Message ID
```sql
SELECT * FROM emails 
WHERE message_id = 'b7bc2f4a-e38e-4336-af7d-e6c392c2f817';
```

### Count Emails by Date Range
```sql
SELECT COUNT(*) as email_count 
FROM emails 
WHERE received_at >= '2025-08-01' 
AND received_at < '2025-09-01';
```

## External Access Methods

### 1. Cloudflare D1 API
```bash
# List databases
curl -X GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database" \
  -H "Authorization: Bearer {api_token}"

# Query database
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/3f02db09-d677-418a-8cc6-0d76ba71a358/query" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM emails ORDER BY received_at DESC LIMIT 10"}'
```

### 2. Wrangler CLI
```bash
# Query locally (for development)
wrangler d1 execute DB --command "SELECT * FROM emails LIMIT 5" --local

# Query remote database
wrangler d1 execute DB --command "SELECT * FROM emails LIMIT 5" --remote
```

### 3. Workers Integration
```typescript
// In another Cloudflare Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Query the emails table
    const stmt = env.DB.prepare("SELECT * FROM emails ORDER BY received_at DESC LIMIT 10");
    const { results } = await stmt.all();
    
    return new Response(JSON.stringify(results), {
      headers: { "content-type": "application/json" }
    });
  }
};
```

## Connection Configuration

### For New Cloudflare Worker
Add to `wrangler.json`:
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_id": "3f02db09-d677-418a-8cc6-0d76ba71a358",
      "database_name": "d1-email"
    }
  ]
}
```

### TypeScript Interface
```typescript
interface EmailRecord {
  id: number;
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
  received_at: string; // ISO 8601 datetime string
  created_at: string;  // ISO 8601 datetime string
}
```

## Performance Notes

1. **Indexed Fields**: Queries on `received_at` and `message_id` are optimized
2. **Large Text Fields**: `html_body` and `text_body` can contain large content
3. **Date Queries**: Use proper date formatting for range queries
4. **Pagination**: Use `LIMIT` and `OFFSET` for large result sets

## Data Sources

- **Primary Source**: Postmark Inbound Webhooks
- **Update Frequency**: Real-time (as emails are received)
- **Data Retention**: No automatic cleanup (manual purging if needed)

## Security Considerations

- Email content may contain sensitive information
- Consider data privacy regulations when accessing/processing
- Message IDs are unique and can be used for deduplication
- HTML content should be sanitized if displayed in web interfaces