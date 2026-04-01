"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";

export const send = internalAction({
  args: { email: v.string(), token: v.string() },
  handler: async (_ctx, { email, token }) => {
    const pass = process.env.HANK_MAIL;
    if (!pass) throw new Error("HANK_MAIL environment variable not set");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: "hank.stanfood@gmail.com", pass },
    });

    await transporter.sendMail({
      from: '"when2eat" <hank.stanfood@gmail.com>',
      to: email,
      subject: `Your when2eat code is ${token}`,
      text: `Your verification code is: ${token}\n\nThis code expires in 15 minutes.\n\nwhen2eat - meal scheduling for Stanford`,
      html: `
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:400px;margin:0 auto;padding:40px 24px;text-align:center">
  <p style="margin:0 0 8px;font-size:14px;color:#666">Your verification code</p>
  <div style="font-size:36px;font-weight:700;letter-spacing:0.3em;color:#212121;padding:16px 0;margin:0 0 8px">
    ${token}
  </div>
  <p style="margin:0 0 32px;font-size:13px;color:#999">Expires in 15 minutes</p>
  <p style="margin:0;font-size:12px;color:#bbb">when2eat &middot; meal scheduling for Stanford</p>
</div>`,
    });
  },
});
