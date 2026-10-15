import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN "utm_source" varchar;
  ALTER TABLE "orders" ADD COLUMN "utm_campaign" varchar;
  ALTER TABLE "orders" ADD COLUMN "referrer" varchar;
  CREATE INDEX "orders_utm_source_idx" ON "orders" USING btree ("utm_source");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "orders_utm_source_idx";
  ALTER TABLE "orders" DROP COLUMN "utm_source";
  ALTER TABLE "orders" DROP COLUMN "utm_campaign";
  ALTER TABLE "orders" DROP COLUMN "referrer";`)
}
