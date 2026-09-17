CREATE TABLE `branch_profiles` (
	`branch_id` text PRIMARY KEY NOT NULL,
	`manager_employee_id` integer,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`manager_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_key` text NOT NULL,
	`branch_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'team' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`username` text,
	`password_salt` text DEFAULT '' NOT NULL,
	`password_hash` text DEFAULT '' NOT NULL,
	`setup_token_hash` text DEFAULT '' NOT NULL,
	`setup_expires_at` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_key_unique` ON `employees` (`employee_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `employees_username_unique` ON `employees` (`username`);--> statement-breakpoint
CREATE INDEX `employees_branch_idx` ON `employees` (`branch_id`,`active`);--> statement-breakpoint
ALTER TABLE `orders` ADD `source` text DEFAULT 'online' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `cashier_employee_id` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `cashier_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `receipt_token_hash` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `orders_cashier_created_idx` ON `orders` (`cashier_employee_id`,`created_at`);