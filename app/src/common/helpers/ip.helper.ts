// src/common/helpers/ip.helper.ts
import { Request } from 'express';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  
  if (forwarded) {
    // Agar bir nechta proxy'dan o'tgan bo'lsa, birinchi IP real clientniki bo'ladi
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return ips[0].trim();
  }

  // To'g'ridan-to'g'ri kelgan so'rovlar uchun
  return (
    req.socket.remoteAddress ||
    (req.connection as any).remoteAddress ||
    '0.0.0.0'
  );
}