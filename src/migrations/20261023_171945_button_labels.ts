import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" ADD COLUMN "button_in_stock" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "button_preorder" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "button_course" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" DROP COLUMN "button_in_stock";
  ALTER TABLE "settings_locales" DROP COLUMN "button_preorder";
  ALTER TABLE "settings_locales" DROP COLUMN "button_course";`)
}
