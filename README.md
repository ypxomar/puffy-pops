# Puffy Pops Egypt

Full source for the public, location-aware Puffy Pops ordering website. Private owner, branch, developer and cashier controls are supplied separately in the Puffy Control desktop/mobile project.

Version 0.4.0 introduces the art-directed cinematic storefront: restrained product storytelling, a meaningful sticky order chapter, a touch-friendly favorites rail, adaptive navigation, and a complete reduced-motion experience. It also fixes the initial Small-size cart selection after the managed catalog loads.

The home page merges both designs into one page: the interactive soft-serve landing (flavour-switching hero, scroll-driven product journey, moments story, city/branch finder and an order drawer that hands the customer to WhatsApp or the full menu) now sits inside the storefront chrome, so the site has a single header, a single footer and a single order path. The storefront's favourites rail, three-step ordering band, proof strip and closing call to action live inside the same page instead of on a second landing page. Landing styles stay namespaced (`ss-` / `app/soft-serve-landing.css`) and the shared bands reuse the storefront classes in `app/globals.css`, so every other page keeps the existing design.

Start with [README-PUFFY-POPS.md](./README-PUFFY-POPS.md) for local setup, database behavior, delivery pricing configuration, app API security and the future payment-provider adapter.

For Cloudflare, follow [CLOUDFLARE-SETUP.md](./CLOUDFLARE-SETUP.md). The project includes the recommended `wrangler.jsonc` configuration.

This project is provided as files only. It has not been hosted or deployed.
