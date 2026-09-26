/**
 * sellermath-fee-engine
 * Pure, dependency-free fee & profit calculations for online marketplace sellers.
 * Rates reflect US 2026 published fee schedules. This is a calculation engine:
 * no DOM, no network, no side effects.
 *
 * Every money amount is a plain number in the seller's currency.
 * Rates are decimals (0.15 = 15%).
 */

/* ------------------------------------------------------------------ *
 * Generic finance math
 * ------------------------------------------------------------------ */

/** Gross profit = price − cost. */
export function grossProfit(price, cost) {
  return price - cost;
}

/** Profit margin = profit / price (0–1). */
export function profitMargin(price, cost) {
  if (price <= 0) return 0;
  return (price - cost) / price;
}

/** Markup = profit / cost (0–1). */
export function markup(price, cost) {
  if (cost <= 0) return 0;
  return (price - cost) / cost;
}

/** Price from a markup: price = cost * (1 + markup). */
export function priceFromMarkup(cost, markupRate) {
  return cost * (1 + markupRate);
}

/** Price for a target margin: price = cost / (1 − margin). */
export function priceFromMargin(cost, marginRate) {
  if (marginRate >= 1) return Infinity;
  return cost / (1 - marginRate);
}

/** Convert a markup rate to the equivalent margin rate. */
export function markupToMargin(markupRate) {
  return markupRate / (1 + markupRate);
}

/** Convert a margin rate to the equivalent markup rate. */
export function marginToMarkup(marginRate) {
  if (marginRate >= 1) return Infinity;
  return marginRate / (1 - marginRate);
}

/** Cost of goods sold for a period = beginning + purchases − ending. */
export function cogs(beginningInventory, purchases, endingInventory) {
  return beginningInventory + purchases - endingInventory;
}

/** Per-unit landed cost: wholesale + freight + packaging + duties + inspection + defects. */
export function landedCost({ wholesale = 0, freight = 0, packaging = 0, duties = 0, inspection = 0, defects = 0 } = {}) {
  return wholesale + freight + packaging + duties + inspection + defects;
}

/**
 * Break-even units for fixed costs given a per-unit contribution margin.
 * contributionMargin = price − variableCostPerUnit.
 */
export function breakEvenUnits(fixedCost, contributionMargin) {
  if (contributionMargin <= 0) return Infinity;
  return fixedCost / contributionMargin;
}

/* ------------------------------------------------------------------ *
 * Percentage-based fee helpers
 * ------------------------------------------------------------------ */

/** A simple percentage fee. */
export function percentFee(amount, rate) {
  return amount * rate;
}

/** A percentage fee plus a fixed fee, e.g. Stripe 2.9% + $0.30. */
export function percentPlusFixed(amount, rate, fixed) {
  return amount * rate + fixed;
}

/** Reverse the gross amount needed to receive a target payout for a fee = rate*amount + fixed. */
export function reverseForPayout(payout, rate, fixed) {
  if (rate >= 1) return Infinity;
  return (payout + fixed) / (1 - rate);
}

/* ------------------------------------------------------------------ *
 * Amazon (US, 2026)
 * ------------------------------------------------------------------ */

/** Referral fee rates by product category (fraction). */
export const AMAZON_REFERRAL_RATE = {
  electronics: 0.08,
  cameras: 0.08,
  automotive: 0.12,
  home: 0.15,
  beauty: 0.15,
  toys: 0.15,
  apparel: 0.17,
  default: 0.15
};

/**
 * Amazon referral fee for an item. A minimum referral fee of $0.30 applies.
 * @param {number} price item price
 * @param {string} category key of AMAZON_REFERRAL_RATE
 */
export function amazonReferralFee(price, category = 'default') {
  const rate = AMAZON_REFERRAL_RATE[category] ?? AMAZON_REFERRAL_RATE.default;
  return Math.max(price * rate, 0.3);
}

/**
 * Approximate FBA fulfillment fee for a standard-size item by shipping weight.
 * Anchor points: 1 lb ≈ $4.22, scaling with weight. Use Amazon's rate card for exact tiers.
 */
export function fbaFulfillmentFee(weightLb) {
  if (weightLb <= 1) return 4.22;
  return 4.22 + (Math.ceil(weightLb) - 1) * 0.38;
}

/** Total FBA cost = referral + fulfillment (+ optional storage). */
export function amazonFbaCost(price, weightLb, category = 'default', storageFeePerUnit = 0) {
  return amazonReferralFee(price, category) + fbaFulfillmentFee(weightLb) + storageFeePerUnit;
}

/* ------------------------------------------------------------------ *
 * eBay (US, 2026)
 * ------------------------------------------------------------------ */

/** eBay final value fee for most categories, plus a per-order fixed fee. */
export function ebayFinalValueFee(price, rate = 0.1325, perOrderFixed = 0.3) {
  return price * rate + perOrderFixed;
}

/* ------------------------------------------------------------------ *
 * Etsy (US, 2026)
 * ------------------------------------------------------------------ */

/**
 * Etsy all-in fee for a single item listing.
 * $0.20 listing fee, 6.5% transaction fee, US payment processing 3% + $0.25.
 * @param {number} price item price
 * @param {object} opts optional overrides
 */
export function etsyFee(price, { listingFee = 0.2, transactionRate = 0.065, paymentRate = 0.03, paymentFixed = 0.25 } = {}) {
  return listingFee + price * transactionRate + price * paymentRate + paymentFixed;
}

/* ------------------------------------------------------------------ *
 * Shopify (US, 2026)
 * ------------------------------------------------------------------ */

/** Shopify monthly plan prices. */
export const SHOPIFY_PLAN_PRICE = { basic: 27, grow: 65, advanced: 399 };
/** Shopify Payments in-person/online card rates by plan. */
export const SHOPIFY_CARD_RATE = { basic: 0.029, grow: 0.027, advanced: 0.025 };

/** Shopify Payments fee for an order = card rate * amount + $0.30. */
export function shopifyPaymentFee(amount, plan = 'basic') {
  const rate = SHOPIFY_CARD_RATE[plan] ?? SHOPIFY_CARD_RATE.basic;
  return amount * rate + 0.3;
}

/* ------------------------------------------------------------------ *
 * Payment processors (US, 2026)
 * ------------------------------------------------------------------ */

/** Stripe standard online fee: 2.9% + $0.30. */
export function stripeFee(amount, rate = 0.029, fixed = 0.3) {
  return percentPlusFixed(amount, rate, fixed);
}

/** PayPal Checkout fee: 3.49% + $0.49. */
export function paypalCheckoutFee(amount, rate = 0.0349, fixed = 0.49) {
  return percentPlusFixed(amount, rate, fixed);
}

/* ------------------------------------------------------------------ *
 * Walmart Marketplace (US, 2026)
 * ------------------------------------------------------------------ */

/**
 * Walmart referral fee by category and total sales price.
 * Returns the fee amount; tiered categories (apparel, appliances...) are handled explicitly.
 */
export function walmartReferralFee(price, category = 'home') {
  switch (category) {
    case 'apparel':
      if (price <= 15) return price * 0.05;
      if (price <= 20) return price * 0.1;
      return price * 0.15;
    case 'appliancesCompact':
      return price <= 300 ? price * 0.12 : 300 * 0.12 + (price - 300) * 0.08;
    case 'appliancesMajor':
    case 'camera':
    case 'collectibles':
      return price * 0.08;
    case 'automotive':
      return price * 0.12;
    case 'baby':
    case 'beauty':
      return price <= 10 ? price * 0.08 : price * 0.15;
    case 'electronicsAccessories':
      return price <= 100 ? price * 0.15 : 100 * 0.15 + (price - 100) * 0.08;
    case 'grocery':
      return price <= 15 ? price * 0.08 : price * 0.15;
    case 'furniture':
      return price <= 200 ? price * 0.15 : 200 * 0.15 + (price - 200) * 0.1;
    case 'home':
    default:
      return price * 0.15;
  }
}

/** Approximate WFS standard fulfillment fee by shipping weight. */
export function wfsFulfillmentFee(weightLb, price) {
  let f;
  if (weightLb <= 1) f = 3.45;
  else if (weightLb <= 3) f = 3.45 + Math.ceil(weightLb - 1) * 1.0;
  else {
    const lb = Math.ceil(weightLb + 0.25);
    f = lb <= 20 ? 5.75 + (lb - 4) * 0.4 : 15.55 + (lb - 21) * 0.4;
  }
  if (price < 10) f += 1;
  return f;
}

/* ------------------------------------------------------------------ *
 * Taxes
 * ------------------------------------------------------------------ */

/** Add tax: tax = net * rate; gross = net * (1 + rate). */
export function addTax(net, rate) {
  return { tax: net * rate, gross: net * (1 + rate) };
}

/** Reverse tax: net = gross / (1 + rate). */
export function removeTax(gross, rate) {
  const net = gross / (1 + rate);
  return { net, tax: gross - net };
}

const engine = {
  grossProfit, profitMargin, markup, priceFromMarkup, priceFromMargin,
  markupToMargin, marginToMarkup, cogs, landedCost, breakEvenUnits,
  percentFee, percentPlusFixed, reverseForPayout,
  AMAZON_REFERRAL_RATE, amazonReferralFee, fbaFulfillmentFee, amazonFbaCost,
  ebayFinalValueFee, etsyFee,
  SHOPIFY_PLAN_PRICE, SHOPIFY_CARD_RATE, shopifyPaymentFee,
  stripeFee, paypalCheckoutFee,
  walmartReferralFee, wfsFulfillmentFee,
  addTax, removeTax
};

export default engine;
