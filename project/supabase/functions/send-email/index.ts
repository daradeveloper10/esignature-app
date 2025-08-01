import { corsHeaders } from '../_shared/cors.ts';

interface EmailRequest {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  pdfUrl?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const emailRequest: EmailRequest = await req.json();
    const { to, subject, htmlBody, textBody, pdfUrl } = emailRequest;

    // Validate required fields
    if (!to || !subject || !htmlBody) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, htmlBody' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get SendGrid API key from environment variables
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendGridApiKey) {
      console.error('❌ SENDGRID_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '❌ Email service not configured - Missing SendGrid API key' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare email payload for SendGrid
    const emailPayload = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject,
        },
      ],
      from: {
        email: Deno.env.get('FROM_EMAIL') || 'noreply@esignature-demo.com',
        name: Deno.env.get('FROM_NAME') || 'eSignature Demo Service',
      },
      content: [
        {
          type: 'text/plain',
          value: textBody,
        },
        {
          type: 'text/html',
          value: htmlBody,
        },
      ],
    };

    // Add PDF attachment if provided
    if (pdfUrl) {
      try {
        // Fetch the PDF content
        const pdfResponse = await fetch(pdfUrl);
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
          
          emailPayload.attachments = [
            {
              content: pdfBase64,
              filename: 'document.pdf',
              type: 'application/pdf',
              disposition: 'attachment',
            },
          ];
        } else {
          console.warn('Failed to fetch PDF for attachment:', pdfResponse.statusText);
        }
      } catch (error) {
        console.warn('Error fetching PDF for attachment:', error);
      }
    }

    // Send email via SendGrid API
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (sendGridResponse.ok) {
      // SendGrid returns 202 for successful requests
      const messageId = sendGridResponse.headers.get('X-Message-Id') || 'unknown';
      
      console.log('Email sent successfully:', {
        to,
        subject,
        messageId,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      const errorText = await sendGridResponse.text();
      console.error('SendGrid API error:', {
        status: sendGridResponse.status,
        statusText: sendGridResponse.statusText,
        error: errorText,
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send email' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in send-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});