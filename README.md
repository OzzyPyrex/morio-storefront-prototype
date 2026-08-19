# Morio Storefront Prototype

A responsive front-end concept for a contemporary Indian saree and lifestyle label. It is designed as a portfolio demonstration of catalogue discovery and a modern checkout journey—not as a live shop.

## Included

- Responsive catalogue with search, filters, sorting, product details and finish options
- Local-only wishlist, shopping bag, quantities, promotion demo and free-shipping progress
- Accessible drawers and modals, including keyboard focus handling and Escape-to-close support
- Three-stage demo checkout, order confirmation, profile and address experience
- Original local SVG product artwork rather than third-party stock-image links
- Browser-storage validation, bounded order history and a clear saved-demo-data control
- Netlify security headers, Node-based checks and GitHub Actions validation

## Privacy and payment safety

This project intentionally does not request card, UPI, wallet or bank details. Delivery inputs support the experience for the current demo screen but are not retained in order history. Optional profile, bag, wishlist, address and demo-order data stay only in the visitor's browser and can be cleared in the interface.

Read the full [portfolio and privacy boundary](docs/PORTFOLIO_BOUNDARY.md) before adapting the project.

## Run locally

Use any static web server from this folder, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Verify

```bash
npm run check
```

The check parses the browser modules and runs tests for storage handling, cart totals, input validation and safe display handling.

## Deploy

The repository includes `netlify.toml` for restrictive security headers. It can be deployed as a static site with the project root as the publish directory.

## Before production

Connect a secure commerce backend, a PCI-compliant payment provider, real inventory and fulfillment systems, verified customer authentication, and final legal, privacy, tax, returns and contact pages. Never add payment secrets, customer records or internal operational data to this repository.

The repository identifier uses `morio`; if a deployed experience uses the spelling `Moriyo`, select one final brand spelling before production so URLs, SEO, legal materials and customer communications remain consistent.
