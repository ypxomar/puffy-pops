CREATE TABLE `inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`branch_id` text NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`current_stock` real DEFAULT 0 NOT NULL,
	`reorder_level` real DEFAULT 0 NOT NULL,
	`unit_cost` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_branch_sku_unique` ON `inventory` (`branch_id`,`sku`);--> statement-breakpoint
CREATE INDEX `inventory_branch_idx` ON `inventory` (`branch_id`);--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inventory_id` integer NOT NULL,
	`branch_id` text NOT NULL,
	`item_name` text NOT NULL,
	`previous_stock` real NOT NULL,
	`new_stock` real NOT NULL,
	`reason` text DEFAULT 'Manual count' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `inventory_movements_branch_idx` ON `inventory_movements` (`branch_id`,`created_at`);