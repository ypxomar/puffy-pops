# Google Maps setup for Puffy Pops

The checkout now uses Google Maps for three jobs:

- an interactive customer pin on the checkout page;
- Google Geocoding for address search and pin-to-address lookup;
- Google Routes `computeRouteMatrix` for the nearest branch, driving distance and delivery fee.

## 1. Enable the APIs

In the same Google Cloud project, enable:

1. Maps JavaScript API
2. Geocoding API
3. Routes API

Google Maps Platform requires billing to be enabled on the Google Cloud project.

## 2. Create two API keys

Use two separate keys so the server key is never exposed to customers.

### Browser key

- Application restriction: **Websites**
- Add both the bare origin and the `/*` form for every address that can display checkout. For the current Worker add:

```text
https://puffy-pops-egypt.omarosman24448.workers.dev
https://puffy-pops-egypt.omarosman24448.workers.dev/*
```

- If a custom domain is connected, also add both forms for it, for example:

```text
https://puffypops.com
https://puffypops.com/*
https://www.puffypops.com
https://www.puffypops.com/*
```

- API restriction: **Maps JavaScript API only**
- Save this as `GOOGLE_MAPS_BROWSER_KEY`.

### Server key

- Keep this key private and never place it in source code.
- API restriction: **Routes API** and **Geocoding API only**
- Save this as `GOOGLE_MAPS_SERVER_KEY`.

## 3. Put the keys in Cloudflare and deploy

Open Command Prompt in the extracted website folder and run:

```cmd
npm install
npx wrangler login
npx wrangler secret put ADMIN_SESSION_SECRET
npx wrangler secret put GOOGLE_MAPS_BROWSER_KEY
npx wrangler secret put GOOGLE_MAPS_SERVER_KEY
npm run deploy:cloudflare
```

You can double-click `DEPLOY-WEBSITE-WINDOWS.cmd` to run the same process with prompts.

## If the map says “Oops! Something went wrong”

That screen means Google rejected the browser request; changing the checkout layout cannot authorize it. In Google Cloud verify all four items:

1. Billing is attached and active for the project that owns the browser key.
2. **Maps JavaScript API** is enabled in that same project.
3. The browser key uses **Websites / HTTP referrers**, not IP-address restrictions.
4. The exact address shown in the browser is included in the key's allowed referrers as listed above.

After saving a key change, wait a few minutes, redeploy after replacing the Cloudflare secret if the key value changed, then hard-refresh checkout. The website now catches Google authentication failures and shows this setup guidance instead of leaving customers on Google's grey error screen.

## 4. Confirm the deployment

Open:

```text
https://YOUR-WORKER.workers.dev/api/app/health
```

The response must contain `"protocol":4`. Then place a test order, drop the pin, and confirm that Puffy Control opens the same coordinates in Google Maps.
