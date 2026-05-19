import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { name, email, date, startTime, meetingLink, customMessage } = await req.json();

    const GMAIL_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD');
    const GMAIL_USER = Deno.env.get('GMAIL_EMAIL') || 'Abdullah.shaban@athareg.com'; 

    if (!GMAIL_PASSWORD || !GMAIL_USER) {
      throw new Error('Email credentials not configured in environment variables.');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASSWORD,
      },
    });

    const emailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #126158; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">تأكيد حجز الاستشارة</h2>
        </div>
        <div style="padding: 20px; background-color: #fcfcfc;">
          ${!customMessage ? `
            <p style="font-size: 16px;">مرحباً <strong>${name}</strong>،</p>
            <p style="font-size: 16px;">يسعدنا إخبارك بأنه تم تأكيد حجز موعدك بنجاح!</p>
          ` : ''}
          <ul style="list-style: none; padding: 0; font-size: 16px; background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">
            <li style="margin-bottom: 10px;">📅 <strong>التاريخ:</strong> ${date}</li>
            <li style="margin-bottom: 10px;">⏰ <strong>الوقت:</strong> ${startTime}</li>
          </ul>
          ${customMessage ? `<div style="margin-top: 20px; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${customMessage}</div>` : ''}
          <div style="text-align: center; margin-top: 30px;">
            <a href="${meetingLink}" style="background-color: #126158; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
              رابط بدء الاستشارة (Meeting Link)
            </a>
          </div>
          <p style="font-size: 14px; color: #777; margin-top: 30px;">إذا كان لديك أي استفسار، لا تتردد في الرد على هذا البريد.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Wiqaiah Platform" <${GMAIL_USER}>`,
      to: email,
      subject: "تم تأكيد موعدك - منصة وقاية",
      html: emailHtml,
    });

    return new Response(JSON.stringify({ success: true, message: 'Email sent successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Error sending email:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
