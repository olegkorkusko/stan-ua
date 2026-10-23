import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ALTER COLUMN "delivery_method" SET DATA TYPE text;
  DROP TYPE "public"."enum_orders_delivery_method";
  CREATE TYPE "public"."enum_orders_delivery_method" AS ENUM('np_branch', 'np_locker', 'np_courier', 'ukrposhta', 'custom');
  ALTER TABLE "orders" ALTER COLUMN "delivery_method" SET DATA TYPE "public"."enum_orders_delivery_method" USING "delivery_method"::"public"."enum_orders_delivery_method";
  ALTER TABLE "customers" ALTER COLUMN "delivery_method" SET DATA TYPE text;
  DROP TYPE "public"."enum_customers_delivery_method";
  CREATE TYPE "public"."enum_customers_delivery_method" AS ENUM('np_branch', 'np_locker', 'np_courier', 'ukrposhta', 'custom');
  ALTER TABLE "customers" ALTER COLUMN "delivery_method" SET DATA TYPE "public"."enum_customers_delivery_method" USING "delivery_method"::"public"."enum_customers_delivery_method";
  DROP INDEX "products_price_from_export_idx";
  ALTER TABLE "products_variants" DROP COLUMN "price_export";
  ALTER TABLE "products" DROP COLUMN "price_export";
  ALTER TABLE "products" DROP COLUMN "old_price_export";
  ALTER TABLE "products" DROP COLUMN "price_from_export";
  ALTER TABLE "courses" DROP COLUMN "price_export";
  ALTER TABLE "courses" DROP COLUMN "old_price_export";
  ALTER TABLE "settings" DROP COLUMN "export_currency";
  ALTER TABLE "settings" DROP COLUMN "export_rate";
  DROP TYPE "public"."enum_settings_export_currency";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_settings_export_currency" AS ENUM('USD', 'EUR');
  ALTER TABLE "orders" ALTER COLUMN "delivery_method" SET DATA TYPE text;
  DROP TYPE "public"."enum_orders_delivery_method";
  CREATE TYPE "public"."enum_orders_delivery_method" AS ENUM('np_branch', 'np_locker', 'np_courier', 'ukrposhta', 'international');
  ALTER TABLE "orders" ALTER COLUMN "delivery_method" SET DATA TYPE "public"."enum_orders_delivery_method" USING "delivery_method"::"public"."enum_orders_delivery_method";
  ALTER TABLE "customers" ALTER COLUMN "delivery_method" SET DATA TYPE text;
  DROP TYPE "public"."enum_customers_delivery_method";
  CREATE TYPE "public"."enum_customers_delivery_method" AS ENUM('np_branch', 'np_locker', 'np_courier', 'ukrposhta', 'international');
  ALTER TABLE "customers" ALTER COLUMN "delivery_method" SET DATA TYPE "public"."enum_customers_delivery_method" USING "delivery_method"::"public"."enum_customers_delivery_method";
  ALTER TABLE "products_variants" ADD COLUMN "price_export" numeric;
  ALTER TABLE "products" ADD COLUMN "price_export" numeric;
  ALTER TABLE "products" ADD COLUMN "old_price_export" numeric;
  ALTER TABLE "products" ADD COLUMN "price_from_export" numeric;
  ALTER TABLE "courses" ADD COLUMN "price_export" numeric;
  ALTER TABLE "courses" ADD COLUMN "old_price_export" numeric;
  ALTER TABLE "settings" ADD COLUMN "export_currency" "enum_settings_export_currency" DEFAULT 'USD';
  ALTER TABLE "settings" ADD COLUMN "export_rate" numeric;
  CREATE INDEX "products_price_from_export_idx" ON "products" USING btree ("price_from_export");`)
}
