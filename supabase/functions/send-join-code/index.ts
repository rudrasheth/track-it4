import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import nodemailer from "npm:nodemailer";

const EMAIL_USER = Deno.env.get("EMAIL_USER");
const EMAIL_PASS = Deno.env.get("EMAIL_PASS");

serve(async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response("", { headers });
  }

  if (!EMAIL_USER || !EMAIL_PASS) {
    return new Response(
      JSON.stringify({ error: "Missing EMAIL_USER or EMAIL_PASS env vars" }),
      { status: 500, headers }
    );
  }

  try {
    const { email, joinCode, groupName } = await req.json();

    if (!email || !joinCode || !groupName) {
      return new Response(
        JSON.stringify({ error: "Missing email, joinCode, or groupName" }),
        { status: 400, headers }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `TrackIt <${EMAIL_USER}>`,
      to: email,
      subject: `Join code for ${groupName}`,
      text: `Your join code is ${joinCode} for group ${groupName}.`,
      html: `<p>Your join code is <b>${joinCode}</b> for group <b>${groupName}</b>.</p>`,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Send failed" }),
      { status: 500, headers }
    );
  }
});
