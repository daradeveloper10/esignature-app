import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body to get test email if provided
    let testEmail = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        testEmail = body.testEmail;
      } catch {
        // If no body or invalid JSON, continue without test email
      }
    }

    // Check environment variables
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL');
    const fromName = Deno.env.get('FROM_NAME');
    
    // Use provided test email, or fall back to FROM_EMAIL, or use a default
    const recipientEmail = testEmail || fromEmail || 'test@example.com';

    console.log('🔍 Environment Check:', {
      hasSendGridKey: !!sendGridApiKey,
      sendGridKeyLength: sendGridApiKey?.length || 0,
      fromEmail: fromEmail || 'not set',
      fromName: fromName || 'not set',
      testRecipient: recipientEmail
    });

    if (!sendGridApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '❌ SENDGRID_API_KEY not found',
          details: 'Please add SENDGRID_API_KEY to your Supabase Edge Function secrets'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Test SendGrid API connection
    const testPayload = {
      personalizations: [
        {
          to: [{ email: recipientEmail }],
          subject: 'SendGrid Configuration Test',
        },
      ],
      from: {
        email: fromEmail || 'noreply@esignature-demo.com',
        name: fromName || 'eSignature Test Service',
      },
      content: [
        {
          type: 'text/plain',
          value: `✅ SendGrid Test Email\n\nThis is a test email sent to: ${recipientEmail}\n\nIf you receive this email, your eSignature app email system is working correctly!\n\nTimestamp: ${new Date().toISOString()}`,
        },
        {
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #22c55e;">✅ SendGrid Test Email</h2>
              <p>This is a test email sent to: <strong>${recipientEmail}</strong></p>
              <p><strong>If you receive this email, your eSignature app email system is working correctly!</strong></p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Test Details:</strong></p>
                <ul>
                  <li>Timestamp: ${new Date().toISOString()}</li>
                  <li>From: ${fromEmail || 'noreply@esignature-demo.com'}</li>
                  <li>Service: SendGrid API</li>
                </ul>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This email was sent from your eSignature application test function.</p>
            </div>
          `,
        },
      ],
    };

    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await sendGridResponse.text();
    
    console.log('📧 SendGrid Test Response:', {
      status: sendGridResponse.status,
      statusText: sendGridResponse.statusText,
      headers: Object.fromEntries(sendGridResponse.headers.entries()),
      body: responseText
    });

    if (sendGridResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: '✅ SendGrid configuration is working!',
          details: {
            apiKeyConfigured: true,
            apiKeyLength: sendGridApiKey.length,
            fromEmail: fromEmail || 'using default',
            fromName: fromName || 'using default',
            testRecipient: recipientEmail,
            sendGridStatus: sendGridResponse.status,
            emailSent: 'real email sent successfully'
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      let errorDetails = 'Unknown error';
      try {
        const errorData = JSON.parse(responseText);
        errorDetails = errorData.errors?.[0]?.message || responseText;
      } catch {
        errorDetails = responseText;
      }

      return new Response(
        JSON.stringify({ 
          success: false,
          error: '❌ SendGrid API error',
          details: {
            status: sendGridResponse.status,
            statusText: sendGridResponse.statusText,
            error: errorDetails,
            suggestion: sendGridResponse.status === 401 
              ? 'Check if your SendGrid API key is correct and has mail.send permissions'
              : 'Check SendGrid API documentation for this error'
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('❌ Test function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: '❌ Test function error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});