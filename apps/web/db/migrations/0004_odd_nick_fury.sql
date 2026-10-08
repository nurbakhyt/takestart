CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`kaspi_payment_id` text NOT NULL,
	`amount_tiyin` integer NOT NULL,
	`kaspi_amount_kzt` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payments_shop_idx` ON `payments` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`order_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_provider_kaspi_unique` ON `payments` (`provider`,`kaspi_payment_id`);