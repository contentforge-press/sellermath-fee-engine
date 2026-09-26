# sellermath-fee-engine

Pure, dependency-free fee & profit calculations for online marketplace sellers.

Covers **Amazon, eBay, Etsy, Shopify, Walmart Marketplace, Stripe, PayPal** and
**US/state sales tax**, using US **2026** published fee schedules. No DOM, no
network calls, no side effects — just well-tested math you can embed anywhere.

Part of [SellerMath](https://dytsk9wrfv.page.coze.site), the free toolkit for
e-commerce sellers.

## Install

```bash
npm install @contentforge-press/sellermath-fee-engine
```

ESM and CommonJS are both supported.

## Usage

```js
import {
  amazonReferralFee, fbaFulfillmentFee, amazonFbaCost,
  walmartReferralFee, wfsFulfillmentFee,
  etsyFee, ebayFinalValueFee, shopifyPaymentFee,
  stripeFee, paypalCheckoutFee,
  priceFromMargin, addTax, removeTax
} from '@contentforge-press/sellermath-fee-engine';

// Amazon: $100 home-category item, 1 lb, FBA
amazonReferralFee(100, 'home');   // 15  (8–17% by category, $0.30 minimum)
fbaFulfillmentFee(1);             // 4.22
amazonFbaCost(100, 1, 'home');    // 19.22

// Walmart Marketplace (no monthly fee)
walmartReferralFee(30, 'apparel');              // 4.5  (5/10/15% tiers)
walmartReferralFee(400, 'appliancesCompact');   // 44   (12% to $300, 8% after)
wfsFulfillmentFee(3, 35);                        // 5.45

// Per-sale fees
etsyFee(100);              // 9.95  ($0.20 + 6.5% + 3% + $0.25)
ebayFinalValueFee(100);    // 13.55 (13.25% + $0.30)
shopifyPaymentFee(100);    // 3.2   (2.9% + $0.30, basic plan)
stripeFee(100);            // 3.2
paypalCheckoutFee(100);    // 3.98  (3.49% + $0.49)

// Pricing & tax
priceFromMargin(30, 0.4);          // 50
addTax(100, 0.0725).gross;         // 107.25
removeTax(107.25, 0.0725).net;     // 100
```

## API

### Generic finance
`grossProfit`, `profitMargin`, `markup`, `priceFromMarkup`, `priceFromMargin`,
`markupToMargin`, `marginToMarkup`, `cogs`, `landedCost`, `breakEvenUnits`

### Fee helpers
`percentFee`, `percentPlusFixed`, `reverseForPayout`

### Amazon
`AMAZON_REFERRAL_RATE`, `amazonReferralFee`, `fbaFulfillmentFee`, `amazonFbaCost`

### eBay
`ebayFinalValueFee`

### Etsy
`etsyFee`

### Shopify
`SHOPIFY_PLAN_PRICE`, `SHOPIFY_CARD_RATE`, `shopifyPaymentFee`

### Processors
`stripeFee`, `paypalCheckoutFee`

### Walmart
`walmartReferralFee`, `wfsFulfillmentFee`

### Taxes
`addTax`, `removeTax`

## Notes on accuracy

- Rates reflect the US **2026** fee schedules used by SellerMath; marketplaces
  change fees, so treat these as estimates and confirm in each seller dashboard
  for production decisions.
- Fulfillment functions are anchor-point approximations; exact fees depend on
  size tier, dimensions and weight.
- Money amounts are plain numbers in the seller's currency; rates are decimals.

## License

[MIT](./LICENSE)
