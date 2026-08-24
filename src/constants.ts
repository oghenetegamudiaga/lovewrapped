export const PAID_PLAN_PRICE_NGN = 980;
export const PAID_PLAN_PRICE_KOBO = PAID_PLAN_PRICE_NGN * 100; // 98,000 kobo for Paystack (₦980)
export const PAID_PLAN_PRICE_FORMATTED = `₦${PAID_PLAN_PRICE_NGN.toLocaleString()}`; // "₦980"
export const DEFAULT_PAYMENT_REF = `LW_REF_${PAID_PLAN_PRICE_NGN}`; // "LW_REF_980"

export const WEDDING_PLAN_PRICE_NGN = 7500;
export const WEDDING_PLAN_PRICE_KOBO = WEDDING_PLAN_PRICE_NGN * 100; // 750,000 kobo for Paystack (₦7,500)
export const WEDDING_PLAN_PRICE_FORMATTED = `₦${WEDDING_PLAN_PRICE_NGN.toLocaleString()}`; // "₦7,500"

// Official Seeded Demo Identifiers (Single Source of Truth)
export const DEMO_MOMENTS_ID = 'exp-demo-001';
export const DEMO_MOMENTS_SLUG = 'demo';
export const DEMO_WEDDING_ID = 'wedding-demo-001';
export const DEMO_WEDDING_SLUG = 'dvds-and-dvs';

