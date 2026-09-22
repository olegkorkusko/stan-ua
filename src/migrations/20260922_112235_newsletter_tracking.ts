import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN "newsletter" boolean;
  ALTER TABLE "settings_locales" DROP COLUMN "delivery_info";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" ADD COLUMN "delivery_info" jsonb;
  ALTER TABLE "orders" DROP COLUMN "newsletter";`)
}
