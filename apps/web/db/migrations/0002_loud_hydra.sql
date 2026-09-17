DROP INDEX `accounts_provider_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_unique` ON `accounts` (`provider`,`providerAccountId`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
INSERT INTO `__new_verification_tokens`("identifier", "token", "expires") SELECT "identifier", "token", "expires" FROM `verification_tokens`;--> statement-breakpoint
DROP TABLE `verification_tokens`;--> statement-breakpoint
ALTER TABLE `__new_verification_tokens` RENAME TO `verification_tokens`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_unique` ON `verification_tokens` (`token`);