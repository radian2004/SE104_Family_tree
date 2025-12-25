import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '~/models/requests/User.requests';

/**
 * Ký JWT token
 * @param payload - Dữ liệu cần mã hóa vào token
 * @param privateKey - Secret key để ký
 * @param options - Các tùy chọn (expiresIn...)
 */
export function signToken(
  payload: { user_id: string; token_type: number },
  privateKey: string,
  options?: SignOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, privateKey, options || { algorithm: 'HS256' }, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token as string);
      }
    });
  });
}

/**
 * Verify JWT token
 * @param token - Token cần verify
 * @param secretKey - Secret key để verify
 */
export function verifyToken(token: string, secretKey: string): Promise<TokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as TokenPayload);
      }
    });
  });
}