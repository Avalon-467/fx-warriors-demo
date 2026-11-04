CREATE TABLE `fx_usage_counters` (
	`bucket` text PRIMARY KEY NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL
);
