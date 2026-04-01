import { Email } from "@convex-dev/auth/providers/Email";

export const ResendOTP = Email({
  id: "resend-otp",
  maxAge: 60 * 15,
  async generateVerificationToken() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % 900000 + 100000).toString();
  },
  async sendVerificationRequest({ identifier: email, token }) {
    // TODO: Replace with Resend API call for production
    console.log(`[when2eat] OTP for ${email}: ${token}`);
  },
});
