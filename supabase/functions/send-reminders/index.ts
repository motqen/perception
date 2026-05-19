import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const GMAIL_USER = Deno.env.get('GMAIL_EMAIL') || 'Abdullah.shaban@athareg.com';
const GMAIL_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` && 
      (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    if (!GMAIL_PASSWORD) {
      throw new Error('Email credentials not configured in environment variables.');
    }
    const now = new Date();
    const results = [];

    // --- REMINDER 24H --- (Looking for sessions starting between 23.5 and 24.5 hours from now)
    const tomorrow_start = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
    const tomorrow_end = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

    // --- REMINDER 1H --- (Looking for sessions starting between 0.5 and 1.5 hours from now)
    const hour_start = new Date(now.getTime() + 0.5 * 60 * 60 * 1000);
    const hour_end = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_PASSWORD },
    });

    // 1. Process Individual Bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, availability(*)')
      .eq('status', 'accepted');

    for (const b of (bookings || [])) {
      if (!b.availability) continue;
      
      const sessionDate = new Date(`${b.availability.date}T${b.availability.start_time}`);
      let type: '24h' | '1h' | '' = '';

      if (!b.reminder_24h_sent && sessionDate >= tomorrow_start && sessionDate <= tomorrow_end) {
        type = '24h';
      } else if (!b.reminder_1h_sent && sessionDate >= hour_start && sessionDate <= hour_end) {
        type = '1h';
      }

      if (type) {
        // Send to Patient
        await sendReminder(transporter, b.email, b.name, b.availability.date, b.availability.start_time, b.meeting_link, type, false);
        // Send to Admin (Doctor)
        await sendReminder(transporter, GMAIL_USER, b.name, b.availability.date, b.availability.start_time, b.meeting_link, type, true);
        
        await supabase.from('bookings').update({ [`reminder_${type}_sent`]: true }).eq('id', b.id);
        results.push(`Sent ${type} reminder to ${b.email} and Admin (Consultation)`);
      }
    }

    // 2. Process Webinar Registrations
    const { data: regs } = await supabase
      .from('webinar_registrations')
      .select('*, webinars(*)')
      .eq('status', 'accepted');

    for (const r of (regs || [])) {
      if (!r.webinars) continue;
      
      const sessionDate = new Date(r.webinars.start_time);
      let type: '24h' | '1h' | '' = '';

      if (!r.reminder_24h_sent && sessionDate >= tomorrow_start && sessionDate <= tomorrow_end) {
        type = '24h';
      } else if (!r.reminder_1h_sent && sessionDate >= hour_start && sessionDate <= hour_end) {
        type = '1h';
      }

      if (type) {
        // Send to Patient
        await sendReminder(transporter, r.email, r.name, r.webinars.start_time, '', r.webinars.meeting_link, type, false);
        // Send to Admin (Doctor)
        await sendReminder(transporter, GMAIL_USER, r.name, r.webinars.start_time, '', r.webinars.meeting_link, type, true);

        await supabase.from('webinar_registrations').update({ [`reminder_${type}_sent`]: true }).eq('id', r.id);
        results.push(`Sent ${type} reminder to ${r.email} and Admin (Webinar)`);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

async function sendReminder(transporter: any, email: string, name: string, date: string, time: string, link: string, type: string, isAdmin: boolean) {
  let subject = "";
  let msg = "";

  if (isAdmin) {
    subject = type === '24h' 
      ? `تنبيه دكتور: موعد غداً مع ${name}` 
      : `تنبيه دكتور: موعد بعد ساعة مع ${name}`;
    msg = type === '24h'
      ? `لديك موعد استشارة/ويبينار غداً مع **${name}**.`
      : `موعدك مع **${name}** سيبدأ خلال ساعة. يرجى الاستعداد!`;
  } else {
    subject = type === '24h' 
      ? "تذكير: موعدك غداً - منصة وقاية" 
      : "تذكير: موعدك يبدأ بعد ساعة - منصة وقاية";
    msg = type === '24h' 
      ? "هذا تذكير بموعدك غداً." 
      : "موعدك سيبدأ خلال ساعة واحدة. يرجى الاستعداد!";
  }

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #126158; text-align: center;">${isAdmin ? '🔔 تنبيه موعد' : '⏰ تذكير بالموعد'}</h2>
      <p style="font-size: 16px;">${isAdmin ? 'دكتور محمد،' : `مرحباً <strong>${name}</strong>،`}</p>
      <p style="font-size: 16px;">${msg}</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin: 20px 0;">
        <p style="margin: 5px 0;">👤 <strong>الاسم:</strong> ${name}</p>
        <p style="margin: 5px 0;">📅 <strong>التاريخ:</strong> ${new Date(date).toLocaleDateString('ar-EG')}</p>
        ${time ? `<p style="margin: 5px 0;">⏰ <strong>الوقت:</strong> ${time}</p>` : ''}
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${link || '#'}" style="background-color: #126158; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
          ${isAdmin ? 'دخول الجلسة (Host)' : 'رابط الحضور (Join)'}
        </a>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Wiqaiah Platform" <${GMAIL_USER}>`,
    to: email,
    subject: subject,
    html: html
  });
}
