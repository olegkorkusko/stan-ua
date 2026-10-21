import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "price_from_export" numeric;
  CREATE INDEX "products_price_from_export_idx" ON "products" USING btree ("price_from_export");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "products_price_from_export_idx";
  ALTER TABLE "products" DROP COLUMN "price_from_export";`)
}
