// src/common/helpers/ip-range.helper.ts
import { BlockList, isIP } from 'net';

// IPv4 manzil IPv6 ko'rinishida kelsa (::ffff:192.168.1.5) oddiy IPv4 ga keltiramiz
export function normalizeIp(ip: string): string {
  const trimmed = ip.trim();
  return trimmed.startsWith('::ffff:') && isIP(trimmed.slice(7)) === 4 ? trimmed.slice(7) : trimmed;
}

/**
 * IP manzil ruxsat etilgan diapazonga kirishini tekshiradi.
 * Qo'llab-quvvatlanadigan formatlar (vergul bilan bir nechta):
 *   '*'                -> hamma uchun ochiq
 *   '192.168.1.50'     -> aniq IP
 *   '192.168.1.0/24'   -> CIDR tarmoq
 */
export function isIpAllowed(clientIp: string, allowedRange?: string | null): boolean {
  if (!allowedRange || allowedRange.trim() === '' || allowedRange.trim() === '*') {
    return true;
  }

  const ip = normalizeIp(clientIp);
  const family = isIP(ip);
  if (!family) return false;

  const blockList = new BlockList();
  for (const rule of allowedRange.split(',').map((r) => r.trim()).filter(Boolean)) {
    if (rule === '*') return true;

    const [address, prefix] = rule.split('/');
    const ruleFamily = isIP(address);
    if (!ruleFamily) continue;

    const type = ruleFamily === 6 ? 'ipv6' : 'ipv4';
    if (prefix !== undefined) {
      const bits = Number(prefix);
      if (Number.isInteger(bits)) blockList.addSubnet(address, bits, type);
    } else {
      blockList.addAddress(address, type);
    }
  }

  return blockList.check(ip, family === 6 ? 'ipv6' : 'ipv4');
}

// Admin kiritgan diapazon formati to'g'riligini tekshirish (DTO validatsiyasi uchun)
export function isValidIpRange(value: string): boolean {
  if (value.trim() === '*') return true;
  return value.split(',').map((r) => r.trim()).every((rule) => {
    const [address, prefix, extra] = rule.split('/');
    if (extra !== undefined || !isIP(address)) return false;
    if (prefix === undefined) return true;
    const bits = Number(prefix);
    const max = isIP(address) === 6 ? 128 : 32;
    return Number.isInteger(bits) && bits >= 0 && bits <= max;
  });
}
