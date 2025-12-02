import { createHash } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Mã hóa password bằng SHA-256
 * @param content - Password cần mã hóa
 * @returns Password đã được hash
 */
export function sha256(content: string): string {
  return createHash('sha256')
    .update(content + process.env.PASSWORD_SECRET)
    .digest('hex');
}

/**
 * Hash password trước khi lưu vào database
 */
export function hashPassword(password: string): string {
  return sha256(password);
}