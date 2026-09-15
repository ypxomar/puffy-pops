CREATE TABLE `branch_product_inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`branch_id` text NOT NULL,
	`city_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`track_quantity` integer DEFAULT false NOT NULL,
	`current_stock` real DEFAULT 0 NOT NULL,
	`reorder_level` real DEFAULT 3 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `branch_product_inventory_unique` ON `branch_product_inventory` (`branch_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `branch_product_inventory_branch_idx` ON `branch_product_inventory` (`branch_id`,`available`);--> statement-breakpoint
CREATE INDEX `branch_product_inventory_product_idx` ON `branch_product_inventory` (`product_id`,`available`);--> statement-breakpoint
CREATE TABLE `stock_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`order_number` text NOT NULL,
	`source_branch_id` text NOT NULL,
	`target_branch_id` text NOT NULL,
	`candidate_rank` integer DEFAULT 1 NOT NULL,
	`requested_products_json` text DEFAULT '[]' NOT NULL,
	`missing_products_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`response_note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`resolved_at` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stock_requests_target_status_idx` ON `stock_requests` (`target_branch_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `stock_requests_order_idx` ON `stock_requests` (`order_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `orders` ADD `original_branch_id` text DEFAULT '' NOT NULL;