export const FREE_SHIPPING_THRESHOLD = 4999;
export const STANDARD_SHIPPING = 199;
export const MAX_ITEM_QUANTITY = 10;
export const MAX_SAVED_ORDERS = 20;

const PAYMENT_METHODS = new Set(['upi', 'card', 'wallet', 'cod']);
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value, maximumLength = 160) {
  return typeof value === 'string' ? value.trim().slice(0, maximumLength) : '';
}

function asMoney(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0 ? Math.round(Number(value)) : 0;
}

export function readStoredJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeCart(value, validProductIds) {
  if (!Array.isArray(value)) return [];

  const quantities = new Map();
  value.forEach(item => {
    const id = Number(item?.id);
    const quantity = Math.floor(Number(item?.qty));
    if (!validProductIds.has(id) || !Number.isFinite(quantity) || quantity < 1) return;
    quantities.set(id, Math.min(MAX_ITEM_QUANTITY, (quantities.get(id) || 0) + quantity));
  });

  return [...quantities].map(([id, qty]) => ({ id, qty }));
}

export function normalizeWishlist(value, validProductIds) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter(id => validProductIds.has(id)))];
}

export function normalizeAddress(value) {
  if (!isRecord(value)) return null;
  const address = cleanText(value.address, 160);
  const city = cleanText(value.city, 60);
  const pincode = cleanText(value.pincode, 6);
  const state = cleanText(value.state, 60);

  if (!address && !city && !pincode && !state) return null;
  return { address, city, pincode, state };
}

export function normalizeProfile(value) {
  if (!isRecord(value)) return null;
  const name = cleanText(value.name, 80);
  const email = cleanText(value.email, 254);
  if (!name || !isEmail(email)) return null;

  const address = normalizeAddress(value.address);
  return address ? { name, email, address } : { name, email };
}

export function normalizeOrders(value, validProductIds) {
  if (!Array.isArray(value)) return [];

  return value
    .map(order => {
      if (!isRecord(order)) return null;
      const items = normalizeCart(order.items, validProductIds);
      const id = cleanText(order.id, 32);
      const date = cleanText(order.date, 40);
      const status = cleanText(order.status, 60) || 'Order confirmed';
      const payment = PAYMENT_METHODS.has(order.payment) ? order.payment : 'upi';
      if (!id || !date || !items.length) return null;
      return { id, date, status, payment, total: asMoney(order.total), items };
    })
    .filter(Boolean)
    .slice(0, MAX_SAVED_ORDERS);
}

export function calculateCartTotals(cart, products, promo = 0) {
  const productById = new Map(products.map(product => [product.id, product]));
  const subtotal = cart.reduce((sum, item) => {
    const product = productById.get(item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const safePromo = Number.isFinite(promo) ? Math.min(Math.max(promo, 0), 1) : 0;
  const discount = Math.round(subtotal * safePromo);
  return { subtotal, shipping, discount, total: subtotal + shipping - discount };
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(value, 254));
}

export function isValidDelivery(value) {
  if (!isRecord(value)) return false;
  return Boolean(
    cleanText(value.name, 80) &&
    /^\d{10}$/.test(cleanText(value.phone, 10)) &&
    isEmail(value.email) &&
    cleanText(value.address, 160) &&
    cleanText(value.city, 60) &&
    /^\d{6}$/.test(cleanText(value.pincode, 6)) &&
    cleanText(value.state, 60)
  );
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => HTML_ENTITIES[character]);
}
