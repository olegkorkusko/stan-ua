import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" ADD COLUMN "show_in_shop" boolean DEFAULT true;
  ALTER TABLE "categories" ADD COLUMN "order" numeric DEFAULT 0;`)

  /*
    «Набори для створення» належать навчанню — у магазині на вітрині їм не
    місце. Саме через це й заводилась галочка, тож ставимо її одразу: інакше
    після міграції на вітрині було б те саме, що й до неї.

    Порядок лишаємо той, що був у коді: прикраси, набори, матеріали.
  */
  await db.execute(sql`
    UPDATE "categories" SET "show_in_shop" = false WHERE "slug" = 'nabory';
    UPDATE "categories" SET "order" = 1 WHERE "slug" = 'prykrasy';
    UPDATE "categories" SET "order" = 2 WHERE "slug" = 'materialy';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DROP COLUMN "show_in_shop";
  ALTER TABLE "categories" DROP COLUMN "order";`)
}
