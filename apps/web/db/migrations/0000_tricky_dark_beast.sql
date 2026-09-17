CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`name_ru` text NOT NULL,
	`name_kk` text,
	`name_en` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `categories_shop_idx` ON `categories` (`shop_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`code` text NOT NULL,
	`items_json` text NOT NULL,
	`total_tiyin` integer NOT NULL,
	`customer_name` text DEFAULT '' NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_address` text DEFAULT '' NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `orders_shop_idx` ON `orders` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`category_id` text,
	`name_ru` text NOT NULL,
	`name_kk` text,
	`name_en` text,
	`desc_ru` text,
	`desc_kk` text,
	`desc_en` text,
	`price_tiyin` integer NOT NULL,
	`photo_r2_key` text,
	`is_available` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `products_shop_idx` ON `products` (`shop_id`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE TABLE `shops` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`whatsapp_e164` text NOT NULL,
	`currency` text DEFAULT 'KZT' NOT NULL,
	`logo_r2_key` text,
	`address_text` text,
	`fulfillment_mode` text DEFAULT 'both' NOT NULL,
	`delivery_fee_tiyin` integer DEFAULT 0 NOT NULL,
	`min_order_tiyin` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shops_slug_unique` ON `shops` (`slug`);