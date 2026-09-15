# Puffy Pops Egypt

Full source for the public, location-aware Puffy Pops ordering website. Private owner, branch, developer and cashier controls are supplied separately in the Puffy Control desktop/mobile project.

Version 0.4.0 introduces the art-directed cinematic storefront: restrained product storytelling, a meaningful sticky order chapter, a touch-friendly favorites rail, adaptive navigation, and a complete reduced-motion experience. It also fixes the initial Small-size cart selection after the managed catalog loads.

The home page is now the interactive soft-serve landing page: a flavour-switching hero, a scroll-driven product journey, the moments story, a city/branch finder and an order drawer that hands the customer to WhatsApp or into the full menu. Its styles are namespaced (`ss-` / `app/soft-serve-landing.css`) so every other storefront page keeps the existing design.

Start with [README-PUFFY-POPS.md](./README-PUFFY-POPS.md) for local setup, database behavior, delivery pricing configuration, app API security and the future payment-provider adapter.

For Cloudflare, follow [CLOUDFLARE-SETUP.md](./CLOUDFLARE-SETUP.md). The project includes the recommended `wrangler.jsonc` configuration.

This project is provided as files only. It has not been hosted or deployed.
