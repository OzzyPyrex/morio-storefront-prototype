import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_ITEM_QUANTITY,
  calculateCartTotals,
  escapeHtml,
  isValidDelivery,
  normalizeCart,
  normalizeOrders,
  normalizeProfile,
  normalizeWishlist,
  readStoredJson
} from '../src/store-utils.mjs';

const productIds = new Set([1, 2, 3]);
const products = [
  { id: 1, price: 1000 },
  { id: 2, price: 4500 },
  { id: 3, price: 7000 }
];

test('reads browser storage safely when data is corrupt', () => {
  const storage = { getItem: () => '{not valid json' };
  assert.deepEqual(readStoredJson(storage, 'morio-cart', []), []);
});

test('normalizes cart and wishlist data from browser storage', () => {
  assert.deepEqual(
    normalizeCart([
      { id: 1, qty: 2 },
      { id: '1', qty: MAX_ITEM_QUANTITY },
      { id: 2, qty: 0 },
      { id: 99, qty: 2 }
    ], productIds),
    [{ id: 1, qty: MAX_ITEM_QUANTITY }]
  );
  assert.deepEqual(normalizeWishlist([1, '2', 2, 99], productIds), [1, 2]);
});

test('calculates shipping and promotional totals predictably', () => {
  assert.deepEqual(calculateCartTotals([{ id: 1, qty: 1 }], products), {
    subtotal: 1000,
    shipping: 199,
    discount: 0,
    total: 1199
  });
  assert.deepEqual(calculateCartTotals([{ id: 2, qty: 1 }, { id: 1, qty: 1 }], products, 0.1), {
    subtotal: 5500,
    shipping: 0,
    discount: 550,
    total: 4950
  });
});

test('validates delivery input and keeps profile details bounded', () => {
  assert.equal(isValidDelivery({
    name: 'Asha Patel',
    phone: '9876543210',
    email: 'asha@example.com',
    address: '12 Park Road',
    city: 'Bengaluru',
    pincode: '560001',
    state: 'Karnataka'
  }), true);
  assert.equal(isValidDelivery({ name: 'Asha', phone: '123', email: 'not-an-email' }), false);
  assert.deepEqual(normalizeProfile({ name: '  Asha Patel  ', email: 'asha@example.com' }), {
    name: 'Asha Patel',
    email: 'asha@example.com'
  });
});

test('retains only display-safe order fields and escapes rendered text', () => {
  const [order] = normalizeOrders([{
    id: 'MRY123',
    date: '20 Aug 2026',
    status: 'Order confirmed',
    payment: 'upi',
    total: 1200,
    address: { address: 'Sensitive address' },
    items: [{ id: 1, qty: 1 }]
  }], productIds);
  assert.deepEqual(order, {
    id: 'MRY123',
    date: '20 Aug 2026',
    status: 'Order confirmed',
    payment: 'upi',
    total: 1200,
    items: [{ id: 1, qty: 1 }]
  });
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
});
