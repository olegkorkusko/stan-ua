import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_rels" ADD COLUMN "courses_id" integer;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_rels_courses_id_idx" ON "products_rels" USING btree ("courses_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_rels" DROP CONSTRAINT "products_rels_courses_fk";
  
  DROP INDEX "products_rels_courses_id_idx";
  ALTER TABLE "products_rels" DROP COLUMN "courses_id";`)
}
