# Puffy Pops Egypt customer website

Source-only Cloudflare Worker website for public ordering. This build deliberately contains no browser-based admin, owner, developer, or cashier pages; private operations now live in the separate **Puffy Control** Windows/Android/iOS app.

## Public features

- Interactive soft-serve landing page as the home page (`/`): swap the four soft-serve flavours, follow the travelling swirl through the scroll story, pick a Puffy place and hand the order to the branch on WhatsApp or the full menu.
- Cairo/Alexandria menu, locations, story, checkout, tracking and receipt pages.
- Apple-inspired cinematic pacing in the Puffy Pops brand system: hero storytelling, one meaningful sticky chapter, a manual favorites rail, adaptive navigation and restrained Motion-powered transitions.
- Complete reduced-motion fallbacks that remove parallax, pinned transformations and automatic large motion without hiding content.
- Stable default-variant resolution so the visible Small option can be added immediately after the managed catalog loads.
- Nearest-branch detection plus manual branch selection.
- Branch-specific menus and validated prices.
- Clickable/draggable Google Maps checkout pin with address search, current-location support and reverse geocoding.
- Google Routes driving-distance matrix for nearest-branch selection and delivery fee calculation.
- Per-branch product availability, editable ingredient inventory and low-stock alerts.
- Automatic nearest-branch stock confirmation requests when the selected branch cannot fulfil an item.
- Cash on delivery; card checkout adapter ready for Puffy Pops' future payment provider.
- Secure order receipts and customer cancellation while an order is awaiting stock, New or Accepted.
- Cloudflare D1 storage and R2-managed product/site images.

The management APIs remain in the Worker so Puffy Control can securely manage orders, stock, staff, counter sales, products and images. They require signed bearer tokens and validate roles/branch scope on every request.

## Before going live

Confirm these business values with Puffy Pops:

1. Branch coordinates in `app/catalog.ts`.
2. Delivery settings in `app/location.ts` (currently EGP 30 through 2 km, then EGP 7 per additional km, rounded up to EGP 5, with a 25 km maximum).
3. Real ingredient inventory and costs, which branch managers can replace from Puffy Control.
4. Card provider implementation in `app/server/payment.ts`.
5. Google Maps Platform browser/server keys described in `GOOGLE-MAPS-SETUP.md`.

Keep `ADMIN_SESSION_SECRET`, `GOOGLE_MAPS_BROWSER_KEY`, `GOOGLE_MAPS_SERVER_KEY`, raw owner/branch codes and the developer password outside this repository. Cashier passwords are created by the owner from Puffy Control.

## Local development

Node.js 22.13+ is required.

```bash
npm install
npm run dev
```

The dev server is published at `http://localhost:5173`. It already binds `0.0.0.0`, so other devices on your network can open `http://<your-computer-ip>:5173`.

Customer pages: `/`, `/menu`, `/locations`, `/story`, `/checkout`, `/track-order`, and token-protected `/receipt/...`.

Old management page addresses such as `/admin`, `/developers` and `/pos` intentionally return 404.

## Run the production build on a local server

`npm start` (`vinext start`) runs the built Worker in plain Node, which has no
Cloudflare bindings, so every page and API answers `500` with
`Cannot read properties of undefined (reading 'DB')`. Use Wrangler instead — it
runs the built Worker in `workerd` with a local D1 database, a local R2 bucket
and the asset binding, exactly like Cloudflare:

```bash
npm run build
npm run start:local            # http://localhost:3000
npm run start:local -- --port 8080 --ip 0.0.0.0   # LAN / custom port
```

The local database and bucket are created on first use under `.wrangler/state`,
and the app creates its own tables and seeds the catalog automatically, so no
migration step is needed locally. Wipe `.wrangler/state` for a clean slate.

Optional: put local-only secrets such as `ADMIN_SESSION_SECRET`,
`GOOGLE_MAPS_BROWSER_KEY` and `GOOGLE_MAPS_SERVER_KEY` in a `.dev.vars` file at
the project root (git-ignored). The public storefront and the soft-serve landing
page run without them; the private management APIs do not.

## Build and verify

```bash
npm run lint
npm test
npm run validate:artifact
```

## Main files

- `app/page.tsx` — the home route, which serves the soft-serve landing page.
- `app/soft-serve/` — the landing page source: `SoftServeLanding.tsx`, `FlavourPicker.tsx`, `Product.tsx` (canvas product isolation), `OrderDialog.tsx` and `landing-data.ts`.
- `app/soft-serve-landing.css` — landing styles, namespaced with the `ss-` prefix so they cannot collide with `app/globals.css`. `scripts/sync-css.mjs` copies both stylesheets into `public/assets/`.
- `app/catalog.ts` — city menus, branch addresses and coordinates.
- `app/location.ts` — nearest branch and delivery-fee formula.
- `app/components/DeliveryMap.tsx` — customer map and draggable pin.
- `app/server/google-maps.ts` — Google Geocoding and Routes API integration.
- `app/api/orders/route.ts` — validated customer order creation.
- `app/api/track-order/route.ts` — secure tracking and cancellation.
- `app/api/app/` — native Puffy Control login/session bridge.
- `app/api/admin/` — role-protected order, inventory, workforce and owner APIs.
- `app/api/pos/` — cashier menu and counter-sale APIs.
- `app/api/cms/` — developer product/image APIs.
- `app/server/*-session.ts` — signed bearer/cookie token verification.
- `db/schema.ts` — D1 orders, staff, inventory, catalog and media data.

## Security model

- The public site has no management UI or discoverable dashboard route.
- Removing pages is not the only protection: all private APIs independently require a signed, expiring bearer token.
- Owner sessions expire after 30 minutes, branch sessions after 12 hours, cashier sessions after 10 hours and developer sessions after one hour.
- Branch tokens are restricted to their branch. Cashiers receive only their branch menu and register access.
- The owner can bulk-delete only completed/cancelled orders; active orders remain protected.
- Product image uploads accept JPG, PNG, WebP or GIF files up to 8 MB and store them in the private R2 bucket.

See `CLOUDFLARE-SETUP.md` for deployment and Puffy Control connection instructions.
