import crypto from 'crypto';

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);

/**
 * Generates a cryptographically secure numeric OTP string.
 */
export const generateOTP = () => {
  const max    = Math.pow(10, OTP_LENGTH);
  const bytes  = crypto.randomBytes(4);
  const number = bytes.readUInt32BE(0) % max;
  return number.toString().padStart(OTP_LENGTH, '0');
};