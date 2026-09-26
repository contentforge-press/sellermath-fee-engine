import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  grossProfit, profitMargin, markup, priceFromMarkup, priceFromMargin,
  markupToMargin, marginToMarkup, cogs, landedCost, breakEvenUnits,
  percentPlusFixed, reverseForPayout,
  amazonReferralFee, fbaFulfillmentFee, amazonFbaCost,
  ebayFinalValueFee, etsyFee, shopifyPaymentFee,
  stripeFee, paypalCheckoutFee,
  walmartReferralFee, wfsFulfillmentFee,
  addTax, removeTax
} from '../src/index.js';

test('gross profit / margin / markup', () => {
  assert.equal(grossProfit(100, 60), 40);
  assert.ok(Math.abs(profitMargin(100, 60) - 0.4) < 1e-9);
  assert.ok(Math.abs(markup(100, 60) - 2 / 3) < 1e-9);
});

test('price from markup and margin', () => {
  assert.equal(priceFromMarkup(40, 0.5), 60);
  assert.equal(priceFromMargin(30, 0.4), 50);
});

test('markup <-> margin round trip', () => {
  const m = markupToMargin(0.5); // 1/3
  assert.ok(Math.abs(m - 1 / 3) < 1e-9);
  assert.ok(Math.abs(marginToMarkup(m) - 0.5) < 1e-9);
});

test('cogs and landed cost', () => {
  assert.equal(cogs(10000, 22000, 5000), 27000);
  assert.equal(landedCost({ wholesale: 5, freight: 2, packaging: 0.5, duties: 1, inspection: 0.3, defects: 0.2 }), 9);
});

test('break even units', () => {
  assert.equal(breakEvenUnits(1000, 10), 100);
  assert.equal(breakEvenUnits(1000, 0), Infinity);
});

test('stripe-style fee and reverse payout', () => {
  assert.equal(percentPlusFixed(100, 0.029, 0.3), 3.2);
  // To net 100 with 2.9% + 0.30: (100.3)/0.971
  assert.ok(Math.abs(reverseForPayout(100, 0.029, 0.3) - 100.3 / 0.971) < 1e-9);
});

test('amazon referral minimum and categories', () => {
  assert.equal(amazonReferralFee(1, 'electronics'), 0.3); // below $0.30 minimum
  assert.equal(amazonReferralFee(100, 'electronics'), 8);
  assert.equal(amazonReferralFee(100, 'home'), 15);
});

test('fba fulfillment and total', () => {
  assert.equal(fbaFulfillmentFee(1), 4.22);
  assert.ok(Math.abs(amazonFbaCost(100, 1, 'home') - (15 + 4.22)) < 1e-9);
});

test('ebay and etsy', () => {
  assert.equal(ebayFinalValueFee(100), 13.55);
  // etsy: 0.2 + 6.5 + 3 + 0.25 = 9.95
  assert.ok(Math.abs(etsyFee(100) - 9.95) < 1e-9);
});

test('shopify payment fee by plan', () => {
  assert.equal(shopifyPaymentFee(100, 'basic'), 3.2);
  assert.equal(shopifyPaymentFee(100, 'advanced'), 2.8);
});

test('stripe and paypal checkout', () => {
  assert.equal(stripeFee(100), 3.2);
  assert.ok(Math.abs(paypalCheckoutFee(100) - 3.98) < 1e-9);
});

test('walmart tiered referral', () => {
  const approx = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
  approx(walmartReferralFee(12, 'apparel'), 0.6);
  approx(walmartReferralFee(18, 'apparel'), 1.8);
  approx(walmartReferralFee(30, 'apparel'), 4.5);
  approx(walmartReferralFee(400, 'appliancesCompact'), 44);
  approx(walmartReferralFee(300, 'furniture'), 40);
  approx(walmartReferralFee(34.99, 'home'), 34.99 * 0.15);
});

test('wfs fulfillment', () => {
  assert.equal(wfsFulfillmentFee(1, 35), 3.45);
  assert.equal(wfsFulfillmentFee(3, 35), 5.45);
  assert.equal(wfsFulfillmentFee(0.5, 8), 4.45);
});

test('sales tax add and reverse', () => {
  const a = addTax(100, 0.0725);
  assert.ok(Math.abs(a.tax - 7.25) < 1e-9);
  assert.ok(Math.abs(a.gross - 107.25) < 1e-9);
  const r = removeTax(107.25, 0.0725);
  assert.ok(Math.abs(r.net - 100) < 1e-9);
});
