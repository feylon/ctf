import { isIpAllowed, isValidIpRange, normalizeIp } from './ip-range.helper';

describe('ip-range.helper', () => {
  describe('isIpAllowed', () => {
    it('cheklov berilmagan yoki * bo‘lsa hammaga ruxsat beradi', () => {
      expect(isIpAllowed('1.2.3.4', '*')).toBe(true);
      expect(isIpAllowed('1.2.3.4', '')).toBe(true);
      expect(isIpAllowed('1.2.3.4', null)).toBe(true);
    });

    it('aniq IP manzilni tekshiradi', () => {
      expect(isIpAllowed('192.168.1.50', '192.168.1.50')).toBe(true);
      expect(isIpAllowed('192.168.1.51', '192.168.1.50')).toBe(false);
    });

    it('CIDR tarmoqni tekshiradi', () => {
      expect(isIpAllowed('10.20.30.40', '10.0.0.0/8')).toBe(true);
      expect(isIpAllowed('11.0.0.1', '10.0.0.0/8')).toBe(false);
      expect(isIpAllowed('192.168.1.255', '192.168.1.0/24')).toBe(true);
    });

    it('vergul bilan bir nechta qoidani qabul qiladi', () => {
      expect(isIpAllowed('172.16.0.5', '10.0.0.0/8, 172.16.0.0/12')).toBe(true);
      expect(isIpAllowed('8.8.8.8', '10.0.0.0/8, 172.16.0.0/12')).toBe(false);
    });

    it('IPv6 ko‘rinishidagi IPv4 manzilni to‘g‘ri tushunadi', () => {
      expect(isIpAllowed('::ffff:192.168.1.10', '192.168.1.0/24')).toBe(true);
    });

    it('yaroqsiz client IP ni rad etadi', () => {
      expect(isIpAllowed('not-an-ip', '10.0.0.0/8')).toBe(false);
    });
  });

  describe('isValidIpRange', () => {
    it('to‘g‘ri formatlarni qabul qiladi', () => {
      expect(isValidIpRange('*')).toBe(true);
      expect(isValidIpRange('192.168.1.5')).toBe(true);
      expect(isValidIpRange('10.0.0.0/8,192.168.0.0/16')).toBe(true);
      expect(isValidIpRange('2001:db8::/32')).toBe(true);
    });

    it('noto‘g‘ri formatlarni rad etadi', () => {
      expect(isValidIpRange('abc')).toBe(false);
      expect(isValidIpRange('10.0.0.0/33')).toBe(false);
      expect(isValidIpRange('10.0.0.0/8/1')).toBe(false);
    });
  });

  it('normalizeIp ::ffff: prefiksini olib tashlaydi', () => {
    expect(normalizeIp('::ffff:127.0.0.1')).toBe('127.0.0.1');
    expect(normalizeIp('::1')).toBe('::1');
  });
});
