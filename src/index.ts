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
    // Log incoming request details
    console.log(`[${requestId}] === INCOMING WEBHOOK REQUEST ===`);
    console.log(`[${requestId}] Method: ${request.method}`);
    console.log(`[${requestId}] URL: ${request.url}`);
    console.log(`[${requestId}] Headers:`, Object.fromEntries(request.headers.entries()));
    
    // Read raw body for logging
    const rawBody = await request.text();
    console.log(`[${requestId}] Raw Body Length: ${rawBody.length} bytes`);
    console.log(`[${requestId}] Raw Body Content:`, rawBody);
    
    // Parse the JSON payload
    const payload: PostmarkInboundWebhook = JSON.parse(rawBody);
    
    // Log parsed payload summary
    console.log(`[${requestId}] === PARSED POSTMARK PAYLOAD ===`);
    console.log(`[${requestId}] Message ID: ${payload.MessageID}`);
    console.log(`[${requestId}] From: ${payload.From} (${payload.FromName})`);
    console.log(`[${requestId}] To: ${payload.To}`);
    console.log(`[${requestId}] Subject: ${payload.Subject}`);
    console.log(`[${requestId}] Date: ${payload.Date}`);
    console.log(`[${requestId}] Tag: ${payload.Tag || 'None'}`);
    console.log(`[${requestId}] Has HTML Body: ${!!payload.HtmlBody}`);
    console.log(`[${requestId}] Has Text Body: ${!!payload.TextBody}`);
    console.log(`[${requestId}] Attachments Count: ${payload.Attachments?.length || 0}`);
    
    // Log full payload structure for debugging
    console.log(`[${requestId}] Full Payload:`, JSON.stringify(payload, null, 2));
    
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
    
    console.log(`[${requestId}] === EMAIL RECORD FOR DATABASE ===`);
    console.log(`[${requestId}] Email Record:`, JSON.stringify(emailRecord, null, 2));

    // Insert email into database
    console.log(`[${requestId}] === DATABASE OPERATION ===`);
    const stmt = env.DB.prepare(`
      INSERT INTO emails (
        message_id, from_email, from_name, to_email, to_name,
        subject, html_body, text_body, reply_to, mailbox_hash, tag, received_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    console.log(`[${requestId}] Executing database insert...`);
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

    console.log(`[${requestId}] Database insert result:`, dbResult);
    console.log(`[${requestId}] Email stored successfully in database`);

    const processingTime = Date.now() - startTime;
    const response: ApiResponse = {
      success: true,
      message: "Email stored successfully"
    };

    console.log(`[${requestId}] === RESPONSE ===`);
    console.log(`[${requestId}] Processing time: ${processingTime}ms`);
    console.log(`[${requestId}] Response:`, JSON.stringify(response, null, 2));
    console.log(`[${requestId}] === WEBHOOK PROCESSING COMPLETED ===`);

    return new Response(JSON.stringify(response), {
      headers: { "content-type": "application/json" },
      status: 200
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] === ERROR OCCURRED ===`);
    console.error(`[${requestId}] Error type:`, error?.constructor?.name);
    console.error(`[${requestId}] Error message:`, (error as Error)?.message);
    console.error(`[${requestId}] Error stack:`, (error as Error)?.stack);
    console.error(`[${requestId}] Processing time before error: ${processingTime}ms`);
    
    const response: ApiResponse = {
      success: false,
      message: "Failed to process webhook"
    };

    console.error(`[${requestId}] Error response:`, JSON.stringify(response, null, 2));
    console.error(`[${requestId}] === ERROR HANDLING COMPLETED ===`);

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
