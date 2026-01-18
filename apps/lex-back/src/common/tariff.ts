export const TARIFF = {
  FREE: 'FREE',
  PRO: 'PRO',
  VIP: 'VIP',
} as const;

export type Tariff = (typeof TARIFF)[keyof typeof TARIFF];
