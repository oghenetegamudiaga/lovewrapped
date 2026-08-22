export const PAID_PLAN_PRICE_NGN = 2000;
export const PAID_PLAN_PRICE_KOBO = PAID_PLAN_PRICE_NGN * 100; // 200,000 kobo for Paystack (₦2,000)
export const PAID_PLAN_PRICE_FORMATTED = `₦${PAID_PLAN_PRICE_NGN.toLocaleString()}`; // "₦2,000"
export const DEFAULT_PAYMENT_REF = `LW_REF_${PAID_PLAN_PRICE_NGN}`; // "LW_REF_2000"

export const WEDDING_PLAN_PRICE_NGN = 10000;
export const WEDDING_PLAN_PRICE_KOBO = WEDDING_PLAN_PRICE_NGN * 100; // 1,000,000 kobo for Paystack (₦10,000)
export const WEDDING_PLAN_PRICE_FORMATTED = `₦${WEDDING_PLAN_PRICE_NGN.toLocaleString()}`; // "₦10,000"

// Official Seeded Demo Identifiers (Single Source of Truth)
export const DEMO_MOMENTS_ID = 'exp-demo-001';
export const DEMO_MOMENTS_SLUG = 'demo';
export const DEMO_WEDDING_ID = 'wedding-demo-001';
export const DEMO_WEDDING_SLUG = 'dvds-and-dvs';

