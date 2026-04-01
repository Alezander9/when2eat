import { Email } from "@convex-dev/auth/providers/Email";
import { internal } from "./_generated/api";

export const ResendOTP = Email({
  id: "resend-otp",
  maxAge: 60 * 15,
  async generateVerificationToken() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % 900000 + 100000).toString();
  },
  async sendVerificationRequest(...args: any[]) {
    const { identifier: email, token } = args[0];
    const ctx = args[1];
    await ctx.runAction(internal.sendOTPEmail.send, { email, token });
  },
});
