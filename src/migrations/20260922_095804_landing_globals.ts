import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "shop_page_delivery_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar
  );
  
  CREATE TABLE "shop_page_delivery_steps_locales" (
  	"title" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "shop_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "shop_page_locales" (
  	"hero_label" varchar,
  	"hero_title" varchar,
  	"hero_body" varchar,
  	"hero_cta" varchar,
  	"categories_label" varchar,
  	"categories_title" varchar,
  	"delivery_label" varchar,
  	"delivery_title" varchar,
  	"journal_label" varchar,
  	"journal_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "courses_page_after_payment_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar
  );
  
  CREATE TABLE "courses_page_after_payment_steps_locales" (
  	"title" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "courses_page_locales" (
  	"hero_label" varchar,
  	"hero_title" varchar,
  	"hero_body" varchar,
  	"hero_cta" varchar,
  	"directions_label" varchar,
  	"directions_title" varchar,
  	"after_payment_label" varchar,
  	"after_payment_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "shop_page_delivery_steps" ADD CONSTRAINT "shop_page_delivery_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shop_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shop_page_delivery_steps_locales" ADD CONSTRAINT "shop_page_delivery_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shop_page_delivery_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shop_page_locales" ADD CONSTRAINT "shop_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shop_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_page_after_payment_steps" ADD CONSTRAINT "courses_page_after_payment_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_page_after_payment_steps_locales" ADD CONSTRAINT "courses_page_after_payment_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_page_after_payment_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_page_locales" ADD CONSTRAINT "courses_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "shop_page_delivery_steps_order_idx" ON "shop_page_delivery_steps" USING btree ("_order");
  CREATE INDEX "shop_page_delivery_steps_parent_id_idx" ON "shop_page_delivery_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "shop_page_delivery_steps_locales_locale_parent_id_unique" ON "shop_page_delivery_steps_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "shop_page_locales_locale_parent_id_unique" ON "shop_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_page_after_payment_steps_order_idx" ON "courses_page_after_payment_steps" USING btree ("_order");
  CREATE INDEX "courses_page_after_payment_steps_parent_id_idx" ON "courses_page_after_payment_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_page_after_payment_steps_locales_locale_parent_id_un" ON "courses_page_after_payment_steps_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "courses_page_locales_locale_parent_id_unique" ON "courses_page_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "shop_page_delivery_steps" CASCADE;
  DROP TABLE "shop_page_delivery_steps_locales" CASCADE;
  DROP TABLE "shop_page" CASCADE;
  DROP TABLE "shop_page_locales" CASCADE;
  DROP TABLE "courses_page_after_payment_steps" CASCADE;
  DROP TABLE "courses_page_after_payment_steps_locales" CASCADE;
  DROP TABLE "courses_page" CASCADE;
  DROP TABLE "courses_page_locales" CASCADE;`)
}
