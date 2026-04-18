/** Body for verify-pickup-otp and verify-delivery-otp (otp 5 digits each) */
export type VerifyParcelOtpBody = {
  bookingId: string;
  otp: string;
};
