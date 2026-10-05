import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" ADD COLUMN "card_hover_id" integer;
  ALTER TABLE "categories" ADD COLUMN "card_video_id" integer;
  ALTER TABLE "categories" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "categories" ADD COLUMN "hero_video_id" integer;
  ALTER TABLE "course_directions" ADD COLUMN "card_hover_id" integer;
  ALTER TABLE "course_directions" ADD COLUMN "card_video_id" integer;
  ALTER TABLE "course_directions" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "course_directions" ADD COLUMN "hero_video_id" integer;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_card_hover_id_media_id_fk" FOREIGN KEY ("card_hover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_card_video_id_media_id_fk" FOREIGN KEY ("card_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_hero_video_id_media_id_fk" FOREIGN KEY ("hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_directions" ADD CONSTRAINT "course_directions_card_hover_id_media_id_fk" FOREIGN KEY ("card_hover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_directions" ADD CONSTRAINT "course_directions_card_video_id_media_id_fk" FOREIGN KEY ("card_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_directions" ADD CONSTRAINT "course_directions_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_directions" ADD CONSTRAINT "course_directions_hero_video_id_media_id_fk" FOREIGN KEY ("hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categories_card_hover_idx" ON "categories" USING btree ("card_hover_id");
  CREATE INDEX "categories_card_video_idx" ON "categories" USING btree ("card_video_id");
  CREATE INDEX "categories_hero_image_idx" ON "categories" USING btree ("hero_image_id");
  CREATE INDEX "categories_hero_video_idx" ON "categories" USING btree ("hero_video_id");
  CREATE INDEX "course_directions_card_hover_idx" ON "course_directions" USING btree ("card_hover_id");
  CREATE INDEX "course_directions_card_video_idx" ON "course_directions" USING btree ("card_video_id");
  CREATE INDEX "course_directions_hero_image_idx" ON "course_directions" USING btree ("hero_image_id");
  CREATE INDEX "course_directions_hero_video_idx" ON "course_directions" USING btree ("hero_video_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DROP CONSTRAINT "categories_card_hover_id_media_id_fk";
  
  ALTER TABLE "categories" DROP CONSTRAINT "categories_card_video_id_media_id_fk";
  
  ALTER TABLE "categories" DROP CONSTRAINT "categories_hero_image_id_media_id_fk";
  
  ALTER TABLE "categories" DROP CONSTRAINT "categories_hero_video_id_media_id_fk";
  
  ALTER TABLE "course_directions" DROP CONSTRAINT "course_directions_card_hover_id_media_id_fk";
  
  ALTER TABLE "course_directions" DROP CONSTRAINT "course_directions_card_video_id_media_id_fk";
  
  ALTER TABLE "course_directions" DROP CONSTRAINT "course_directions_hero_image_id_media_id_fk";
  
  ALTER TABLE "course_directions" DROP CONSTRAINT "course_directions_hero_video_id_media_id_fk";
  
  DROP INDEX "categories_card_hover_idx";
  DROP INDEX "categories_card_video_idx";
  DROP INDEX "categories_hero_image_idx";
  DROP INDEX "categories_hero_video_idx";
  DROP INDEX "course_directions_card_hover_idx";
  DROP INDEX "course_directions_card_video_idx";
  DROP INDEX "course_directions_hero_image_idx";
  DROP INDEX "course_directions_hero_video_idx";
  ALTER TABLE "categories" DROP COLUMN "card_hover_id";
  ALTER TABLE "categories" DROP COLUMN "card_video_id";
  ALTER TABLE "categories" DROP COLUMN "hero_image_id";
  ALTER TABLE "categories" DROP COLUMN "hero_video_id";
  ALTER TABLE "course_directions" DROP COLUMN "card_hover_id";
  ALTER TABLE "course_directions" DROP COLUMN "card_video_id";
  ALTER TABLE "course_directions" DROP COLUMN "hero_image_id";
  ALTER TABLE "course_directions" DROP COLUMN "hero_video_id";`)
}
