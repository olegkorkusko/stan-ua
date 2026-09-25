import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN "fiscal_receipt";
  ALTER TABLE "customers" DROP COLUMN "receipt_channel";
  DROP TYPE "public"."enum_customers_receipt_channel";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_customers_receipt_channel" AS ENUM('email', 'sms');
  ALTER TABLE "orders" ADD COLUMN "fiscal_receipt" varchar;
  ALTER TABLE "customers" ADD COLUMN "receipt_channel" "enum_customers_receipt_channel" DEFAULT 'email';`)
}
