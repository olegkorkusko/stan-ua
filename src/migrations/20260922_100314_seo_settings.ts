import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" ADD COLUMN "seo_image_id" integer;
  ALTER TABLE "settings" ADD COLUMN "search_visible" boolean DEFAULT true;
  ALTER TABLE "settings" ADD COLUMN "google_verification" varchar;
  ALTER TABLE "settings" ADD COLUMN "ga_id" varchar;
  ALTER TABLE "settings" ADD COLUMN "meta_pixel_id" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "settings" ADD CONSTRAINT "settings_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "settings_seo_image_idx" ON "settings" USING btree ("seo_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" DROP CONSTRAINT "settings_seo_image_id_media_id_fk";
  
  DROP INDEX "settings_seo_image_idx";
  ALTER TABLE "settings" DROP COLUMN "seo_image_id";
  ALTER TABLE "settings" DROP COLUMN "search_visible";
  ALTER TABLE "settings" DROP COLUMN "google_verification";
  ALTER TABLE "settings" DROP COLUMN "ga_id";
  ALTER TABLE "settings" DROP COLUMN "meta_pixel_id";
  ALTER TABLE "settings_locales" DROP COLUMN "seo_title";
  ALTER TABLE "settings_locales" DROP COLUMN "seo_description";`)
}
