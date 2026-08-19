import {
  FREE_SHIPPING_THRESHOLD,
  MAX_ITEM_QUANTITY,
  calculateCartTotals,
  escapeHtml,
  isValidDelivery,
  normalizeCart,
  normalizeOrders,
  normalizeProfile,
  normalizeWishlist,
  readStoredJson
} from './src/store-utils.mjs';

const products = [
  {
    id: 1,
    name: 'Moonlit Kanjivaram',
    category: 'Silk',
    tags: ['Silk', 'Festive', 'Kanjivaram', 'Zari'],
    price: 14990,
    fabric: 'Pure silk blend with zari border',
    badge: 'Signature',
    image: 'assets/moonlit-kanjivaram.svg',
    description: 'A deep wine Kanjivaram-inspired saree with a softened temple border and luminous gold detailing. Designed to feel ceremonial without feeling overdone.'
  },
  {
    id: 2,
    name: 'Gulmohar Banarasi',
    category: 'Silk',
    tags: ['Silk', 'Festive', 'Banarasi', 'Wedding'],
    price: 17990,
    fabric: 'Banarasi silk blend with floral brocade',
    badge: 'Limited',
    image: 'assets/gulmohar-banarasi.svg',
    description: 'A rich gulmohar red drape patterned with delicate brocade motifs. Traditional at heart, edited for a cleaner and more contemporary finish.'
  },
  {
    id: 3,
    name: 'Champagne Organza',
    category: 'Lightweight',
    tags: ['Lightweight', 'Organza', 'Festive', 'Embroidered'],
    price: 8990,
    fabric: 'Silk organza with hand-finished embroidery',
    badge: 'Bestseller',
    image: 'assets/champagne-organza.svg',
    description: 'A sheer champagne organza with fine hand-finished details and a quietly lustrous border. Elegant, airy and made for soft evening light.'
  },
  {
    id: 4,
    name: 'Indigo Linen',
    category: 'Everyday',
    tags: ['Everyday', 'Linen', 'Workwear', 'Blue'],
    price: 6490,
    fabric: 'Linen-cotton handloom blend',
    badge: 'Easy drape',
    image: 'assets/indigo-linen.svg',
    description: 'A breathable indigo linen-cotton saree with a restrained woven check and subtle antique-gold edge. An everyday piece with presence.'
  },
  {
    id: 5,
    name: 'Sage Chanderi',
    category: 'Lightweight',
    tags: ['Lightweight', 'Chanderi', 'Everyday', 'Festive'],
    price: 7490,
    fabric: 'Chanderi silk-cotton with woven butti',
    badge: 'New',
    image: 'assets/sage-chanderi.svg',
    description: 'A calm sage Chanderi woven with tiny butti motifs. Light enough for long days, polished enough for intimate celebrations.'
  },
  {
    id: 6,
    name: 'Rose Tissue',
    category: 'Festive',
    tags: ['Festive', 'Tissue', 'Wedding', 'Pink'],
    price: 10990,
    fabric: 'Metallic tissue silk blend',
    badge: 'Evening edit',
    image: 'assets/rose-tissue.svg',
    description: 'A rose-toned tissue saree with a diffused metallic sheen. It catches the light beautifully while keeping the silhouette refined.'
  },
  {
    id: 7,
    name: 'Ivory Jamdhani Cotton',
    category: 'Everyday',
    tags: ['Everyday', 'Cotton', 'Jamdhani', 'Ivory'],
    price: 5990,
    fabric: 'Fine cotton with Jamdhani-inspired detail',
    badge: 'Daylight edit',
    image: 'assets/ivory-cotton.svg',
    description: 'An ivory cotton saree with delicate Jamdhani-inspired accents and an antique border. Clean, breathable and endlessly adaptable.'
  },
  {
    id: 8,
    name: 'Midnight Silk',
    category: 'Festive',
    tags: ['Festive', 'Silk', 'Evening', 'Blue'],
    price: 12990,
    fabric: 'Soft silk blend with statement zari',
    badge: 'After dark',
    image: 'assets/midnight-silk.svg',
    description: 'An inky midnight saree with a precise statement border. The kind of piece that needs very little styling to feel complete.'
  }
];

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const productIds = new Set(products.map(product => product.id));

const state = {
  filter: 'All',
  query: '',
  sort: 'featured',
  selectedProduct: null,
  cart: normalizeCart(readStoredJson(localStorage, 'morio-cart', []), productIds),
  wishlist: new Set(normalizeWishlist(readStoredJson(localStorage, 'morio-wishlist', []), productIds)),
  profile: normalizeProfile(readStoredJson(localStorage, 'morio-profile', null)),
  orders: normalizeOrders(readStoredJson(localStorage, 'morio-orders', []), productIds),
  promo: 0
};

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const productGrid = $('#productGrid');
const cartCount = $('#cartCount');
const overlay = $('#overlay');
const toast = $('#toast');
let activeLayer = null;
let toastTimer;
let previouslyFocusedElement = null;

function saveState() {
  try {
    localStorage.setItem('morio-cart', JSON.stringify(state.cart));
    localStorage.setItem('morio-wishlist', JSON.stringify([...state.wishlist]));
    localStorage.setItem('morio-orders', JSON.stringify(state.orders));
    if (state.profile) localStorage.setItem('morio-profile', JSON.stringify(state.profile));
    else localStorage.removeItem('morio-profile');
  } catch {
    showToast('Your changes could not be saved in this browser.');
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function getFocusableElements(container) {
  return $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
    .filter(element => !element.hidden && element.offsetParent !== null);
}

function setLayerTriggerState(id, isOpen) {
  const trigger = {
    cartDrawer: $('#cartToggle'),
    profileModal: $('#profileToggle'),
    mobileMenu: $('#menuToggle')
  }[id];
  if (trigger) trigger.setAttribute('aria-expanded', String(isOpen));
}

function openLayer(id) {
  if (activeLayer && activeLayer.id !== id) closeLayer(activeLayer.id, false);
  const el = document.getElementById(id);
  if (!el) return;
  previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  setLayerTriggerState(id, true);
  overlay.classList.add('open');
  document.body.classList.add('no-scroll');
  activeLayer = el;
  window.setTimeout(() => getFocusableElements(el)[0]?.focus(), 0);
}

function closeLayer(id, restoreBody = true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  setLayerTriggerState(id, false);
  if (activeLayer === el) activeLayer = null;
  if (restoreBody) {
    overlay.classList.remove('open');
    document.body.classList.remove('no-scroll');
    previouslyFocusedElement?.focus();
    previouslyFocusedElement = null;
  }
}

function closeActiveLayer() {
  if (activeLayer) closeLayer(activeLayer.id);
}

function getFilteredProducts() {
  let list = products.filter(product => {
    const matchesFilter = state.filter === 'All' || product.tags.includes(state.filter) || product.category === state.filter;
    const haystack = `${product.name} ${product.category} ${product.tags.join(' ')} ${product.fabric}`.toLowerCase();
    const matchesQuery = !state.query || haystack.includes(state.query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  if (state.sort === 'price-low') list.sort((a, b) => a.price - b.price);
  if (state.sort === 'price-high') list.sort((a, b) => b.price - a.price);
  if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function renderProducts() {
  const list = getFilteredProducts();
  productGrid.innerHTML = list.map(product => `
    <article class="product-card reveal visible" data-product-id="${product.id}">
      <div class="product-image-wrap" data-open-product="${product.id}" tabindex="0" role="button" aria-label="View ${product.name}">
        <span class="product-badge">${product.badge}</span>
        <button class="wishlist-button ${state.wishlist.has(product.id) ? 'active' : ''}" data-wishlist="${product.id}" aria-label="${state.wishlist.has(product.id) ? 'Remove from' : 'Add to'} wishlist">${state.wishlist.has(product.id) ? 'â™¥' : 'â™¡'}</button>
        <img src="${product.image}" alt="${product.name} saree illustration" loading="lazy" />
        <button class="quick-add" data-add="${product.id}">Quick add</button>
      </div>
      <div class="product-info">
        <p class="product-category">${product.category} Â· ${product.fabric.split(' with ')[0]}</p>
        <h3 data-open-product="${product.id}">${product.name}</h3>
        <div class="product-info-row"><span>${product.badge}</span><span>${rupees.format(product.price)}</span></div>
      </div>
    </article>
  `).join('');

  $('#emptyState').hidden = list.length !== 0;
}

function cartQuantity() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function cartSubtotal() {
  return calculateCartTotals(state.cart, products, state.promo).subtotal;
}

function updateCartUI() {
  const quantity = cartQuantity();
  const subtotal = cartSubtotal();
  cartCount.textContent = quantity;
  $('#cartItemLabel').textContent = `${quantity} ${quantity === 1 ? 'item' : 'items'}`;

  const itemsEl = $('#cartItems');
  itemsEl.innerHTML = state.cart.map(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return '';
    return `
      <div class="cart-item">
        <img src="${product.image}" alt="${product.name}" />
        <div>
          <h4>${product.name}</h4>
          <p>Classic finish Â· ${product.category}</p>
          <div class="qty-control"><button data-qty="minus" data-id="${product.id}" aria-label="Reduce quantity">âˆ’</button><span>${item.qty}</span><button data-qty="plus" data-id="${product.id}" aria-label="Increase quantity">+</button></div>
        </div>
        <div class="cart-item-price"><strong>${rupees.format(product.price * item.qty)}</strong><button data-remove="${product.id}">Remove</button></div>
      </div>
    `;
  }).join('');

  $('#cartEmpty').hidden = quantity > 0;
  $('#cartFooter').hidden = quantity === 0;
  $('#cartSubtotal').textContent = rupees.format(subtotal);

  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  $('#shippingProgress').style.width = `${progress}%`;
  $('#shippingMessage').textContent = subtotal >= FREE_SHIPPING_THRESHOLD ? 'Unlocked' : `${rupees.format(FREE_SHIPPING_THRESHOLD - subtotal)} away`;

  updateCheckoutSummary();
  updateProfileUI();
  saveState();
}

function addToCart(id, qty = 1) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const existing = state.cart.find(item => item.id === id);
  if (existing) {
    const nextQuantity = Math.min(MAX_ITEM_QUANTITY, existing.qty + qty);
    if (nextQuantity === existing.qty) {
      showToast(`You can add up to ${MAX_ITEM_QUANTITY} of each piece in this demo.`);
      return;
    }
    existing.qty = nextQuantity;
  } else state.cart.push({ id, qty: Math.min(MAX_ITEM_QUANTITY, Math.max(1, qty)) });
  updateCartUI();
  showToast(`${product.name} added to your bag`);
}

function changeQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.min(MAX_ITEM_QUANTITY, item.qty + delta);
  if (item.qty <= 0) state.cart = state.cart.filter(i => i.id !== id);
  updateCartUI();
}

function toggleWishlist(id) {
  if (state.wishlist.has(id)) {
    state.wishlist.delete(id);
    showToast('Removed from wishlist');
  } else {
    state.wishlist.add(id);
    showToast('Saved to your wishlist');
  }
  renderProducts();
  updateProductModalWishlist();
  updateProfileUI();
  saveState();
}

function openProduct(id) {
  const product = products.find(p => p.id === Number(id));
  if (!product) return;
  state.selectedProduct = product;
  $('#productModalImage').src = product.image;
  $('#productModalImage').alt = product.name;
  $('#productModalBadge').textContent = product.badge;
  $('#productModalCategory').textContent = `${product.category} Â· Morio first edit`;
  $('#productTitle').textContent = product.name;
  $('#productModalPrice').textContent = rupees.format(product.price);
  $('#productModalDescription').textContent = product.description;
  $('#productModalFabric').textContent = product.fabric;
  updateProductModalWishlist();
  $$('.option-chip').forEach((chip, index) => chip.classList.toggle('active', index === 0));
  openLayer('productModal');
}

function updateProductModalWishlist() {
  if (!state.selectedProduct) return;
  const button = $('#modalWishlist');
  const active = state.wishlist.has(state.selectedProduct.id);
  button.classList.toggle('active', active);
  button.textContent = active ? 'â™¥' : 'â™¡';
}

function updateCheckoutSummary() {
  const list = $('#checkoutItems');
  if (!list) return;
  list.innerHTML = state.cart.map(item => {
    const product = products.find(p => p.id === item.id);
    return product ? `<div class="checkout-summary-item"><img src="${product.image}" alt="${product.name}" /><div><strong>${product.name}</strong><br /><span>Qty ${item.qty}</span></div><strong>${rupees.format(product.price * item.qty)}</strong></div>` : '';
  }).join('');

  const { subtotal, shipping, discount, total } = calculateCartTotals(state.cart, products, state.promo);
  $('#checkoutSubtotal').textContent = rupees.format(subtotal);
  $('#checkoutShipping').textContent = shipping ? rupees.format(shipping) : 'Free';
  $('#discountLine').hidden = discount === 0;
  $('#checkoutDiscount').textContent = discount ? `âˆ’${rupees.format(discount)}` : '';
  $('#checkoutTotal').textContent = rupees.format(total);
}

function setCheckoutStep(step) {
  $$('.checkout-step').forEach(el => el.classList.toggle('active', Number(el.dataset.step) === step));
  $$('[data-step-indicator]').forEach(el => el.classList.toggle('active', Number(el.dataset.stepIndicator) <= step));
  $('.checkout-main').scrollTop = 0;
}

function validateDeliveryForm() {
  const form = $('#deliveryForm');
  const delivery = Object.fromEntries(new FormData(form).entries());
  const valid = form.checkValidity() && isValidDelivery(delivery);
  [...form.querySelectorAll('[required]')].forEach(input => {
    input.style.borderColor = input.checkValidity() && input.value.trim() ? '' : '#b42318';
  });
  if (!valid) {
    form.reportValidity();
    showToast('Please enter valid delivery details.');
  }
  return valid;
}

function selectedPayment() {
  return $('input[name="payment"]:checked')?.value || 'upi';
}

function renderConfirmation(order) {
  const summary = $('#confirmationSummary');
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
  const amount = document.createElement('strong');
  amount.textContent = rupees.format(order.total);
  summary.replaceChildren(
    amount,
    document.createTextNode(` • ${itemCount} item(s)`),
    document.createElement('br'),
    document.createTextNode('Delivery details are shown only for this demo and are not saved with the order.'),
    document.createElement('br'),
    document.createTextNode(`Payment: ${order.payment.toUpperCase()}`)
  );
}

function placeOrder() {
  if (!state.cart.length) {
    showToast('Your bag is empty');
    return;
  }
  if (!validateDeliveryForm()) return;

  const payment = selectedPayment();
  const formData = Object.fromEntries(new FormData($('#deliveryForm')).entries());
  const { total } = calculateCartTotals(state.cart, products, state.promo);
  const orderId = `MRY${Date.now().toString().slice(-8)}`;
  const order = {
    id: orderId,
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: 'Order confirmed',
    payment,
    total,
    items: state.cart.map(item => ({ ...item }))
  };

  state.orders.unshift(order);
  state.orders = normalizeOrders(state.orders, productIds);
  if (formData.save && state.profile) {
    state.profile.address = {
      address: formData.address,
      city: formData.city,
      pincode: formData.pincode,
      state: formData.state
    };
  }

  $('#confirmationOrderId').textContent = orderId;
  renderConfirmation(order);

  state.cart = [];
  state.promo = 0;
  $('#promoCode').value = '';
  $('#promoMessage').textContent = '';
  updateCartUI();
  saveState();
  setCheckoutStep(3);
}

function updateProfileUI() {
  const loginView = $('#loginView');
  const accountView = $('#accountView');
  if (!state.profile) {
    loginView.hidden = false;
    accountView.hidden = true;
    return;
  }

  loginView.hidden = true;
  accountView.hidden = false;
  $('#accountName').textContent = state.profile.name;
  $('#accountEmail').textContent = state.profile.email;
  $('#profileOrderCount').textContent = state.orders.length;
  $('#profileWishlistCount').textContent = state.wishlist.size;

  $('#profileOrders').innerHTML = state.orders.length ? state.orders.map(order => `
    <div class="order-card">
      <div class="order-card-head"><strong>${escapeHtml(order.id)}</strong><span>${escapeHtml(order.status)}</span></div>
      <p>${escapeHtml(order.date)} Â· ${order.items.reduce((sum, item) => sum + item.qty, 0)} item(s)</p>
      <p>${rupees.format(order.total)} Â· ${escapeHtml(order.payment.toUpperCase())}</p>
    </div>
  `).join('') : '<p class="checkout-note">No orders yet. Your future favourites will appear here.</p>';

  $('#profileWishlist').innerHTML = state.wishlist.size ? [...state.wishlist].map(id => {
    const product = products.find(p => p.id === id);
    return product ? `<div class="profile-wishlist-item"><img src="${product.image}" alt="${product.name}" /><div><h4>${product.name}</h4><strong>${rupees.format(product.price)}</strong><br /><button data-profile-add="${product.id}">Add to bag</button></div></div>` : '';
  }).join('') : '<p class="checkout-note">Your wishlist is empty. Tap the heart on any piece to save it.</p>';

  if (state.profile.address) {
    const form = $('#addressForm');
    Object.entries(state.profile.address).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value;
    });
  }
}

function clearDemoData() {
  const confirmed = window.confirm('Clear your locally saved bag, wishlist, profile and demo orders from this browser?');
  if (!confirmed) return;

  state.cart = [];
  state.wishlist = new Set();
  state.profile = null;
  state.orders = [];
  state.promo = 0;
  state.selectedProduct = null;

  let storageCleared = true;
  try {
    ['morio-cart', 'morio-wishlist', 'morio-profile', 'morio-orders'].forEach(key => localStorage.removeItem(key));
  } catch {
    storageCleared = false;
  }

  $('#deliveryForm').reset();
  $('#promoCode').value = '';
  $('#promoMessage').textContent = '';
  updateCartUI();
  renderProducts();
  showToast(storageCleared ? 'Demo data cleared from this browser.' : 'Demo data was cleared for this visit, but could not be removed from browser storage.');
}

function openInfo(type) {
  const content = {
    payment: {
      eyebrow: 'Secure checkout',
      title: 'Payment options',
      body: '<p>The prototype includes UPI, Indian cards, wallets, net banking and cash on delivery.</p><p>For launch, the checkout can be connected to Razorpay, Cashfree, PayU or Stripe. A live payment gateway requires a merchant account, KYC approval, API credentials and a secure backend endpoint.</p>'
    },
    shipping: {
      eyebrow: 'Delivery',
      title: 'Shipping & returns',
      body: '<p>Suggested launch policy:</p><ul><li>Free India shipping above â‚¹4,999.</li><li>Standard dispatch in 3â€“5 working days.</li><li>Made-to-order or customised pieces follow the timeline shown on the product page.</li><li>Returns accepted only for eligible, unused pieces with original packaging.</li></ul><p>Replace this sample text with the final business policy before publishing.</p>'
    },
    care: {
      eyebrow: 'Keep it beautiful',
      title: 'Saree care',
      body: '<ul><li>Dry clean silk, organza, tissue and zari pieces.</li><li>Store folded in breathable cotton or muslin.</li><li>Refold every few months to avoid permanent creases.</li><li>Keep perfume, moisture and direct sunlight away from metallic borders.</li></ul>'
    },
    contact: {
      eyebrow: 'We are here',
      title: 'Contact Morio',
      body: '<p>This portfolio demo has no live contact channel.</p><p>Before launch, publish an approved business email, WhatsApp or phone number, studio details and customer-support policy.</p>'
    }
  }[type];
  if (!content) return;
  $('#infoEyebrow').textContent = content.eyebrow;
  $('#infoTitle').textContent = content.title;
  $('#infoBody').innerHTML = content.body;
  openLayer('infoModal');
}

function applyFilter(filter) {
  state.filter = filter;
  $$('.filter-pill').forEach(button => button.classList.toggle('active', button.dataset.filter === filter));
  renderProducts();
}

// Global click handling
document.addEventListener('click', event => {
  const openProductTrigger = event.target.closest('[data-open-product]');
  if (openProductTrigger) {
    openProduct(openProductTrigger.dataset.openProduct);
    return;
  }

  const addButton = event.target.closest('[data-add]');
  if (addButton) {
    event.stopPropagation();
    addToCart(Number(addButton.dataset.add));
    return;
  }

  const wishlistButton = event.target.closest('[data-wishlist]');
  if (wishlistButton) {
    event.stopPropagation();
    toggleWishlist(Number(wishlistButton.dataset.wishlist));
    return;
  }

  const qtyButton = event.target.closest('[data-qty]');
  if (qtyButton) {
    changeQty(Number(qtyButton.dataset.id), qtyButton.dataset.qty === 'plus' ? 1 : -1);
    return;
  }

  const removeButton = event.target.closest('[data-remove]');
  if (removeButton) {
    state.cart = state.cart.filter(item => item.id !== Number(removeButton.dataset.remove));
    updateCartUI();
    showToast('Item removed');
    return;
  }

  const closeButton = event.target.closest('[data-close]');
  if (closeButton) {
    closeLayer(closeButton.dataset.close);
    return;
  }

  const nextButton = event.target.closest('[data-next]');
  if (nextButton) {
    if (Number(nextButton.dataset.next) === 2 && !validateDeliveryForm()) return;
    setCheckoutStep(Number(nextButton.dataset.next));
    return;
  }

  const backButton = event.target.closest('[data-back]');
  if (backButton) {
    setCheckoutStep(Number(backButton.dataset.back));
    return;
  }

  const profileAdd = event.target.closest('[data-profile-add]');
  if (profileAdd) {
    addToCart(Number(profileAdd.dataset.profileAdd));
    return;
  }

  const footerAction = event.target.closest('[data-footer-action]');
  if (footerAction) openInfo(footerAction.dataset.footerAction);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeActiveLayer();
    $('#searchBar').classList.remove('open');
  }
  if (event.key === 'Tab' && activeLayer) {
    const focusable = getFocusableElements(activeLayer);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-open-product]')) {
    event.preventDefault();
    openProduct(event.target.dataset.openProduct);
  }
});

overlay.addEventListener('click', closeActiveLayer);

$('#cartToggle').addEventListener('click', () => openLayer('cartDrawer'));
$('#profileToggle').addEventListener('click', () => { updateProfileUI(); openLayer('profileModal'); });
$('#menuToggle').addEventListener('click', () => openLayer('mobileMenu'));
$('#checkoutButton').addEventListener('click', () => {
  closeLayer('cartDrawer', false);
  setCheckoutStep(1);
  updateCheckoutSummary();
  openLayer('checkoutModal');
});
$('#quickUPI').addEventListener('click', () => {
  closeLayer('cartDrawer', false);
  setCheckoutStep(1);
  openLayer('checkoutModal');
});

$('#searchToggle').addEventListener('click', () => {
  $('#searchBar').classList.toggle('open');
  if ($('#searchBar').classList.contains('open')) setTimeout(() => $('#siteSearch').focus(), 200);
});
$('#closeSearch').addEventListener('click', () => $('#searchBar').classList.remove('open'));
$('#siteSearch').addEventListener('input', event => {
  state.query = event.target.value.trim();
  renderProducts();
  document.getElementById('new').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

$$('.filter-pill').forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
$('#sortProducts').addEventListener('change', event => { state.sort = event.target.value; renderProducts(); });
$('#clearFilters').addEventListener('click', () => {
  state.query = '';
  $('#siteSearch').value = '';
  applyFilter('All');
});

$$('.collection-card').forEach(card => card.addEventListener('click', () => {
  applyFilter(card.dataset.category);
  document.getElementById('new').scrollIntoView({ behavior: 'smooth' });
}));

$('#modalAddToCart').addEventListener('click', () => {
  if (!state.selectedProduct) return;
  addToCart(state.selectedProduct.id);
  closeLayer('productModal', false);
  openLayer('cartDrawer');
});
$('#modalWishlist').addEventListener('click', () => {
  if (state.selectedProduct) toggleWishlist(state.selectedProduct.id);
});
$$('.option-chip').forEach(chip => chip.addEventListener('click', () => {
  $$('.option-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
}));

$$('.payment-option').forEach(option => option.addEventListener('click', () => {
  $$('.payment-option').forEach(el => el.classList.remove('active'));
  option.classList.add('active');
  option.querySelector('input').checked = true;
  const value = option.querySelector('input').value;
  $$('.payment-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.paymentPanel === value));
}));

$('#placeOrder').addEventListener('click', placeOrder);
$('#applyPromo').addEventListener('click', () => {
  const code = $('#promoCode').value.trim().toUpperCase();
  if (code === 'MORIO10') {
    state.promo = .10;
    $('#promoMessage').textContent = 'MORIO10 applied â€” 10% off this demo order.';
  } else if (!code) {
    $('#promoMessage').textContent = 'Enter a promo code.';
  } else {
    state.promo = 0;
    $('#promoMessage').textContent = 'That code is not active. Try MORIO10.';
  }
  updateCheckoutSummary();
});

$('#loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const profile = normalizeProfile(data);
  if (!profile) {
    showToast('Please enter a valid name and email address.');
    return;
  }
  state.profile = profile;
  saveState();
  updateProfileUI();
  showToast(`Welcome, ${profile.name.split(' ')[0]}`);
});

$('#logoutButton').addEventListener('click', () => {
  state.profile = null;
  saveState();
  updateProfileUI();
  showToast('Signed out');
});

$('#clearDemoData').addEventListener('click', clearDemoData);

$$('[data-profile-tab]').forEach(tab => tab.addEventListener('click', () => {
  $$('[data-profile-tab]').forEach(t => t.classList.toggle('active', t === tab));
  $$('[data-profile-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.profilePanel === tab.dataset.profileTab));
}));

$('#addressForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!state.profile) return;
  state.profile.address = Object.fromEntries(new FormData(event.currentTarget).entries());
  saveState();
  showToast('Address saved');
});

$('#newsletterForm').addEventListener('submit', event => {
  event.preventDefault();
  showToast('Thanks — you are on the demo list.');
  event.currentTarget.reset();
});

$('#paymentInfo').addEventListener('click', () => openInfo('payment'));

$$('.mobile-menu a').forEach(link => link.addEventListener('click', () => closeLayer('mobileMenu')));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
$$('.reveal').forEach(el => revealObserver.observe(el));

renderProducts();
updateCartUI();
updateProfileUI();

