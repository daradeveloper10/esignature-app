export interface EmailRecipient {
  emails: string[];
  recipientId: string;
}

export interface SignatureRequest {
  title: string;
  message: string;
  signInOrder: boolean;
  documentName: string;
  senderName: string;
  senderEmail: string;
}

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export class EmailService {
  private static readonly SIGNING_URL_BASE = `${import.meta.env.VITE_PUBLIC_APP_URL || 'http://localhost:5173'}/sign`;

  static generateSigningUrl(requestId: string, recipientId: string, token: string): string {
    return `${this.SIGNING_URL_BASE}?request=${requestId}&recipient=${recipientId}&token=${token}`;
  }

  static generateEmailTemplate(
    request: SignatureRequest,
    signingUrl: string,
    orderNumber?: number
  ): EmailTemplate {
    const subject = `Signature Request: ${request.title}`;
    
    const orderText = request.signInOrder && orderNumber 
      ? `You are recipient #${orderNumber} in the signing order. `
      : '';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Signature Request</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .document-info { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .sign-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .sign-button:hover { background: #0056b3; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
          .order-info { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #007bff;">📝 Signature Request</h1>
            <p style="margin: 10px 0 0 0; color: #6c757d;">You have been requested to sign a document</p>
          </div>

          <p>Hello,</p>
          
          <p>You have received a signature request for the following document:</p>

          <div class="document-info">
            <h3 style="margin-top: 0;">${request.title}</h3>
            <p><strong>Document:</strong> ${request.documentName}</p>
            <p><strong>From:</strong> ${request.senderName} (${request.senderEmail})</p>
            ${request.message ? `<p><strong>Message:</strong></p><p style="font-style: italic;">${request.message}</p>` : ''}
          </div>

          ${request.signInOrder && orderNumber ? `
            <div class="order-info">
              <p><strong>📋 Signing Order:</strong> ${orderText}${orderNumber > 1 ? 'You will be notified when it\'s your turn to sign.' : 'You can sign immediately.'}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${signingUrl}" class="sign-button">Review & Sign Document</a>
          </div>

          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Click the button above to review the document</li>
            <li>Add your signature where indicated</li>
            <li>Submit your signed document</li>
            <li>All parties will receive a copy once complete</li>
          </ul>

          <div class="footer">
            <p>This signature request was sent through Microsoft Word eSignature integration.</p>
            <p>If you have any questions about this document, please contact ${request.senderName} at ${request.senderEmail}.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Signature Request: ${request.title}

Hello,

You have received a signature request for the following document:

Document: ${request.title}
File: ${request.documentName}
From: ${request.senderName} (${request.senderEmail})

${request.message ? `Message: ${request.message}` : ''}

${request.signInOrder && orderNumber ? `Signing Order: ${orderText}` : ''}

To review and sign the document, please visit:
${signingUrl}

What happens next?
1. Click the link above to review the document
2. Add your signature where indicated
3. Submit your signed document
4. All parties will receive a copy once complete

If you have any questions about this document, please contact ${request.senderName} at ${request.senderEmail}.

This signature request was sent through Microsoft Word eSignature integration.
    `.trim();

    return {
      subject,
      htmlBody,
      textBody
    };
  }

  static async sendSignatureRequest(
    recipients: EmailRecipient[],
    request: SignatureRequest,
    pdfUrl: string,
    requestId: string
  ): Promise<{ success: boolean; sentEmails: string[]; errors: string[] }> {
    const sentEmails: string[] = [];
    const errors: string[] = [];

    try {
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const orderNumber = request.signInOrder ? i + 1 : undefined;
        
        // Generate unique signing token for security
        const token = this.generateSecureToken();
        const signingUrl = this.generateSigningUrl(requestId, recipient.recipientId, token);
        console.log('Generated Signing URL:', signingUrl);

        
        // Generate email template
        const emailTemplate = this.generateEmailTemplate(request, signingUrl, orderNumber);
        
        // Send to all email addresses for this recipient
        for (const email of recipient.emails) {
          try {
            await this.sendEmail(email, emailTemplate, pdfUrl);
            sentEmails.push(email);
          } catch (error) {
            console.error(`Failed to send email to ${email}:`, error);
            errors.push(`Failed to send to ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return {
        success: errors.length === 0,
        sentEmails,
        errors
      };
    } catch (error) {
      console.error('Error sending signature requests:', error);
      return {
        success: false,
        sentEmails,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  private static async sendEmail(
    recipientEmail: string,
    template: EmailTemplate,
    pdfUrl: string
  ): Promise<void> {
    try {
      // Get Supabase configuration from environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      // Call the Supabase Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          pdfUrl: pdfUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Email sending failed');
      }

      console.log('📧 Email sent successfully:', {
        to: recipientEmail,
        subject: template.subject,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static generateSecureToken(): string {
    // Generate a secure random token for the signing URL
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}