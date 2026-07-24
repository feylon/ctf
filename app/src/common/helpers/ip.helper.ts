// src/common/helpers/ip.helper.ts
import { Request } from 'express';
import { normalizeIp } from './ip-range.helper';

// 'trust proxy' yoqilgan bo'lsa Express X-Forwarded-For ni o'zi xavfsiz tahlil qiladi
export function getClientIp(req: Request): string {
  const ip = req.ip || req.socket?.remoteAddress || '0.0.0.0';
  return normalizeIp(ip);
}
