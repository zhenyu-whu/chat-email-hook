import { renderHtml } from "./renderHtml";
import { PostmarkInboundWebhook, EmailRecord, ApiResponse } from "./types";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    try {
      if (method === "POST") {
        return await handlePostmarkWebhook(request, env);
      } else if (method === "GET") {
        return await handleGetEmails(env);
      } else {
        return new Response("Method not allowed", { status: 405 });
      }
    } catch (error) {
      console.error("Error handling request:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

async function handlePostmarkWebhook(request: Request, env: any): Promise<Response> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().substring(0, 8);
  
  try {
    // Read and parse the request
    const rawBody = await request.text();
    const payload: PostmarkInboundWebhook = JSON.parse(rawBody);
    
    // Extract email data from Postmark payload
    const emailRecord: Omit<EmailRecord, 'id' | 'created_at'> = {
      message_id: payload.MessageID,
      from_email: payload.From,
      from_name: payload.FromName || payload.FromFull?.Name,
      to_email: payload.To,
      to_name: payload.ToFull?.[0]?.Name,
      subject: payload.Subject,
      html_body: payload.HtmlBody,
      text_body: payload.TextBody,
      reply_to: payload.ReplyTo,
      mailbox_hash: payload.MailboxHash,
      tag: payload.Tag,
      received_at: new Date(payload.Date).toISOString()
    };

    // Insert email into database
    const stmt = env.DB.prepare(`
      INSERT INTO emails (
        message_id, from_email, from_name, to_email, to_name,
        subject, html_body, text_body, reply_to, mailbox_hash, tag, received_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const dbResult = await stmt.bind(
      emailRecord.message_id,
      emailRecord.from_email,
      emailRecord.from_name,
      emailRecord.to_email,
      emailRecord.to_name,
      emailRecord.subject,
      emailRecord.html_body,
      emailRecord.text_body,
      emailRecord.reply_to,
      emailRecord.mailbox_hash,
      emailRecord.tag,
      emailRecord.received_at
    ).run();

    const processingTime = Date.now() - startTime;
    const response: ApiResponse = {
      success: true,
      message: "Email stored successfully"
    };

    // Single comprehensive log entry
    console.log(`[${requestId}] POSTMARK WEBHOOK | ${payload.From} -> ${payload.To} | "${payload.Subject}" | Tag: ${payload.Tag || 'None'} | DB: ${dbResult.success ? 'SUCCESS' : 'FAILED'} | ${processingTime}ms | Body: ${rawBody.length}B | Full Payload: ${JSON.stringify(payload)}`);

    return new Response(JSON.stringify(response), {
      headers: { "content-type": "application/json" },
      status: 200
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const response: ApiResponse = {
      success: false,
      message: "Failed to process webhook"
    };

    // Single error log entry
    console.error(`[${requestId}] POSTMARK WEBHOOK ERROR | ${(error as Error)?.message} | ${processingTime}ms | Stack: ${(error as Error)?.stack}`);

    return new Response(JSON.stringify(response), {
      headers: { "content-type": "application/json" },
      status: 400
    });
  }
}

async function handleGetEmails(env: any): Promise<Response> {
  try {
    const stmt = env.DB.prepare(`
      SELECT 
        id, message_id, from_email, from_name, to_email, to_name,
        subject, reply_to, tag, received_at, created_at
      FROM emails 
      ORDER BY received_at DESC 
      LIMIT 10
    `);
    const { results } = await stmt.all();

    return new Response(renderHtml(results), {
      headers: {
        "content-type": "text/html",
      },
    });

  } catch (error) {
    console.error("Error fetching emails:", error);
    return new Response(renderHtml([]), {
      headers: {
        "content-type": "text/html",
      },
    });
  }
}
