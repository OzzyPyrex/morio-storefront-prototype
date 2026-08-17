# Morio Storefront Prototype

A responsive, modern e-commerce concept for **Morio**, a Bengaluru-based saree and lifestyle label.

## Included

- Premium home page inspired by the supplied Morio launch artwork
- Saree collections and product catalogue
- Search, filters and sorting
- Product detail modal and finish options
- Wishlist stored in the browser
- Shopping bag with quantity controls and free-shipping progress
- Three-step checkout with UPI, cards, wallets/net banking and COD interfaces
- Promo-code demo (`MORIO10`)
- Customer sign-in/profile, saved address, order history and wishlist
- Mobile navigation and responsive layout
- Original local SVG product artwork, so the catalogue does not depend on stock-photo links

## Open locally

Open `index.html` in a browser, or run a local web server from this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Important before launch

This is a polished front-end prototype. The checkout demonstrates the customer experience but **does not process real payments**.

For production, connect it to:

- A commerce/backend platform such as Shopify, WooCommerce, Medusa, Saleor or a custom API
- Razorpay, Cashfree, PayU or Stripe for live payments
- A database for products, inventory, customers, addresses and orders
- OTP/email authentication
- Shipping APIs such as Shiprocket, Delhivery or equivalent
- Transactional email and WhatsApp notifications
- Final legal pages, GST details, returns policy, contact information and social links

Replace the sample email `hello@morio.in`, sample product details and policies before publishing.

