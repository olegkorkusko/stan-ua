import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" ADD COLUMN "show_in_directions" boolean DEFAULT false;`)

  // Набори купують до курсу — їм місце в ряду напрямів, а не в магазині.
  await db.execute(sql`UPDATE "categories" SET "show_in_directions" = true WHERE "slug" = 'nabory';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DROP COLUMN "show_in_directions";`)
}
