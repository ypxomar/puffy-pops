# Cloudflare setup — Puffy Pops

This is a full Cloudflare Worker with server APIs, D1 and R2. Do not use the static Pages drag-and-drop uploader.

## Deploy from Windows

In PowerShell or Command Prompt, open the extracted website folder and run:

```powershell
npm install
npx wrangler login
npx wrangler r2 bucket create puffy-pops-assets
npx wrangler secret put ADMIN_SESSION_SECRET
npx wrangler secret put GOOGLE_MAPS_BROWSER_KEY
npx wrangler secret put GOOGLE_MAPS_SERVER_KEY
npm run deploy:cloudflare
```

If the R2 bucket already exists, continue. When Wrangler asks for a secret, paste the matching private value. Do not put secrets in `wrangler.jsonc`, GitHub or Puffy Control. Read `GOOGLE-MAPS-SETUP.md` before creating the two restricted Google keys.

You may instead connect a private GitHub repository in **Workers & Pages → Create → Import a repository** using:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

The first deployment creates the D1 database binding. The app initializes the production tables when they are first used.

## Connect Puffy Control

Deploy this website build first, then open the Puffy Control app. On its login screen enter the Worker address, for example:

```text
https://your-worker.your-account.workers.dev
```

Login types:

- **Management:** existing owner or branch secret code.
- **Cashier:** username/password created by the owner in Puffy Control → Team.
- **Developer:** existing developer password.

There are no `/admin`, `/developers` or `/pos` website pages anymore. The app talks to the protected `/api/app`, `/api/admin`, `/api/pos` and `/api/cms` routes with signed session tokens.

To confirm that the deployed Worker matches Puffy Control 1.2.0, open:

```text
https://your-worker.your-account.workers.dev/api/app/health
```

It must return JSON containing `"protocol":4`. A 404 or an older protocol means the old Worker is still deployed; run `DEPLOY-WEBSITE-WINDOWS.cmd` from this matching website folder.

## Private image storage

The developer workspace in Puffy Control can:

- add/edit/hide/delete Cairo and Alexandria products;
- attach or replace a product image while creating/editing products;
- replace the logo, homepage and story artwork;
- restore the original images retained from earlier builds;
- upload reusable photos and assign them to products or website slots.

These changes require the `puffy-pops-assets` R2 bucket bound as `BUCKET` by `wrangler.jsonc`.

## Cloudflare error 1101 / missing CSS

Keep the pinned compatibility date and `run_worker_first` asset setting in `wrangler.jsonc`. Then redeploy:

```powershell
npm install
npm run deploy:cloudflare
```

The build script is cross-platform JavaScript, so it does not depend on Bash on Windows.

## Custom domain

After the Worker is healthy, use **Settings → Domains & Routes → Add → Custom Domain**. Puffy Control can use either that HTTPS domain or the original `workers.dev` address.

## Inspect or clean test data

Prefer the owner app's multi-select deletion for completed/cancelled orders and workers. To inspect D1 directly:

```powershell
npx wrangler d1 execute puffy-pops-orders --remote --command "SELECT id,name,branch_id,role,username,active FROM employees ORDER BY id;"
npx wrangler d1 execute puffy-pops-orders --remote --command "SELECT id,order_number,source,branch_name,total,status,created_at FROM orders ORDER BY id DESC LIMIT 100;"
```

Review the results before any deletion. Active orders are intentionally protected by the application.
