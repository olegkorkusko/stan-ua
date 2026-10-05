import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "card_video_id" integer;
  ALTER TABLE "products" ADD CONSTRAINT "products_card_video_id_media_id_fk" FOREIGN KEY ("card_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_card_video_idx" ON "products" USING btree ("card_video_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP CONSTRAINT "products_card_video_id_media_id_fk";
  
  DROP INDEX "products_card_video_idx";
  ALTER TABLE "products" DROP COLUMN "card_video_id";`)
}
