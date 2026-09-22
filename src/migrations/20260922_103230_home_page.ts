import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"learn_image_id" integer,
  	"shop_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_locales" (
  	"learn_label" varchar,
  	"learn_alt" varchar,
  	"shop_label" varchar,
  	"shop_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "settings" DROP CONSTRAINT "settings_hero_media_id_media_id_fk";
  
  DROP INDEX "settings_hero_media_idx";
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_learn_image_id_media_id_fk" FOREIGN KEY ("learn_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_shop_image_id_media_id_fk" FOREIGN KEY ("shop_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_locales" ADD CONSTRAINT "home_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_page_learn_learn_image_idx" ON "home_page" USING btree ("learn_image_id");
  CREATE INDEX "home_page_shop_shop_image_idx" ON "home_page" USING btree ("shop_image_id");
  CREATE UNIQUE INDEX "home_page_locales_locale_parent_id_unique" ON "home_page_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "settings" DROP COLUMN "hero_media_id";
  ALTER TABLE "settings_locales" DROP COLUMN "hero_title";
  ALTER TABLE "settings_locales" DROP COLUMN "hero_subtitle";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "home_page_locales" CASCADE;
  ALTER TABLE "settings" ADD COLUMN "hero_media_id" integer;
  ALTER TABLE "settings_locales" ADD COLUMN "hero_title" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "hero_subtitle" varchar;
  ALTER TABLE "settings" ADD CONSTRAINT "settings_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "settings_hero_media_idx" ON "settings" USING btree ("hero_media_id");`)
}
