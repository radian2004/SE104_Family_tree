import { Request } from 'express';
import { TokenPayload } from './models/requests/User.requests';

declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
    cookies: {
      access_token?: string;
      refresh_token?: string;
      [key: string]: any;
    };
  }
}