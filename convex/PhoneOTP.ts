import { Phone } from "@convex-dev/auth/providers/Phone";

function generateOTP(length: number): string {
  const digits = "0123456789";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (num) => digits[num % digits.length]).join("");
}

export const PhoneOTP = Phone({
  id: "phone",
  maxAge: 60 * 10,
  async generateVerificationToken() {
    return generateOTP(6);
  },
  async sendVerificationRequest({ identifier: phone, token }) {
    const endpoint = process.env.PHONE_OTP_ENDPOINT;
    if (!endpoint) {
      throw new Error("Phone OTP is not configured yet. Please use email sign-in until SMS delivery is connected.");
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        token,
        chatId: process.env.CHAT_ID,
        appName: process.env.APP_NAME || "Wellcare Medicose",
        secretKey: process.env.SECRET_KEY,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to send SMS verification code.");
    }
  },
});
