import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "products_color_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"color_id" integer NOT NULL
  );
  
  ALTER TABLE "products_color_gallery" ADD CONSTRAINT "products_color_gallery_color_id_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_color_gallery" ADD CONSTRAINT "products_color_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_color_gallery_order_idx" ON "products_color_gallery" USING btree ("_order");
  CREATE INDEX "products_color_gallery_parent_id_idx" ON "products_color_gallery" USING btree ("_parent_id");
  CREATE INDEX "products_color_gallery_color_idx" ON "products_color_gallery" USING btree ("color_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_color_gallery" CASCADE;`)
}
