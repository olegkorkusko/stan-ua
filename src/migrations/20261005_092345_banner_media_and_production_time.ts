import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" ADD COLUMN "learn_video_id" integer;
  ALTER TABLE "home_page" ADD COLUMN "shop_video_id" integer;
  ALTER TABLE "shop_page" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "shop_page" ADD COLUMN "hero_video_id" integer;
  ALTER TABLE "courses_page" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "courses_page" ADD COLUMN "hero_video_id" integer;
  ALTER TABLE "settings_locales" ADD COLUMN "production_time" varchar;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_learn_video_id_media_id_fk" FOREIGN KEY ("learn_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_shop_video_id_media_id_fk" FOREIGN KEY ("shop_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_page" ADD CONSTRAINT "shop_page_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_page" ADD CONSTRAINT "shop_page_hero_video_id_media_id_fk" FOREIGN KEY ("hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_page" ADD CONSTRAINT "courses_page_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_page" ADD CONSTRAINT "courses_page_hero_video_id_media_id_fk" FOREIGN KEY ("hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_page_learn_learn_video_idx" ON "home_page" USING btree ("learn_video_id");
  CREATE INDEX "home_page_shop_shop_video_idx" ON "home_page" USING btree ("shop_video_id");
  CREATE INDEX "shop_page_hero_hero_image_idx" ON "shop_page" USING btree ("hero_image_id");
  CREATE INDEX "shop_page_hero_hero_video_idx" ON "shop_page" USING btree ("hero_video_id");
  CREATE INDEX "courses_page_hero_hero_image_idx" ON "courses_page" USING btree ("hero_image_id");
  CREATE INDEX "courses_page_hero_hero_video_idx" ON "courses_page" USING btree ("hero_video_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" DROP CONSTRAINT "home_page_learn_video_id_media_id_fk";
  
  ALTER TABLE "home_page" DROP CONSTRAINT "home_page_shop_video_id_media_id_fk";
  
  ALTER TABLE "shop_page" DROP CONSTRAINT "shop_page_hero_image_id_media_id_fk";
  
  ALTER TABLE "shop_page" DROP CONSTRAINT "shop_page_hero_video_id_media_id_fk";
  
  ALTER TABLE "courses_page" DROP CONSTRAINT "courses_page_hero_image_id_media_id_fk";
  
  ALTER TABLE "courses_page" DROP CONSTRAINT "courses_page_hero_video_id_media_id_fk";
  
  DROP INDEX "home_page_learn_learn_video_idx";
  DROP INDEX "home_page_shop_shop_video_idx";
  DROP INDEX "shop_page_hero_hero_image_idx";
  DROP INDEX "shop_page_hero_hero_video_idx";
  DROP INDEX "courses_page_hero_hero_image_idx";
  DROP INDEX "courses_page_hero_hero_video_idx";
  ALTER TABLE "home_page" DROP COLUMN "learn_video_id";
  ALTER TABLE "home_page" DROP COLUMN "shop_video_id";
  ALTER TABLE "shop_page" DROP COLUMN "hero_image_id";
  ALTER TABLE "shop_page" DROP COLUMN "hero_video_id";
  ALTER TABLE "courses_page" DROP COLUMN "hero_image_id";
  ALTER TABLE "courses_page" DROP COLUMN "hero_video_id";
  ALTER TABLE "settings_locales" DROP COLUMN "production_time";`)
}
