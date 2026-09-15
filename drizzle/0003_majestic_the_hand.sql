CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_products` (
	`id` text PRIMARY KEY NOT NULL,
	`city_id` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`variants_json` text NOT NULL,
	`choices_json` text DEFAULT '[]' NOT NULL,
	`image_key` text DEFAULT '' NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `catalog_products_city_category_idx` ON `catalog_products` (`city_id`,`category`,`sort_order`);--> statement-breakpoint
CREATE TABLE `site_assets` (
	`slot` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`image_key` text DEFAULT '' NOT NULL,
	`fallback_url` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
