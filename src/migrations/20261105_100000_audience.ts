import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
  Мітка «Кому показувати» в товарі й курсі.

  Написано руками з тієї ж причини, що й попередні: генератор порівнює код не з
  продом, а з ТІЄЮ базою, до якої під'єднаний, і дописує все, чим вони
  розходяться. У цьому проєкті така міграція вже один раз вийшла з DROP COLUMN
  на поля з іншої гілки.

  Наявні рядки отримують 'all' через DEFAULT — жодна картка не зникає з сайту
  від самого лише додавання поля.
*/
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_audience" AS ENUM('all', 'ua', 'intl');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "audience" "public"."enum_audience" DEFAULT 'all';
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "audience" "public"."enum_audience" DEFAULT 'all';

    UPDATE "products" SET "audience" = 'all' WHERE "audience" IS NULL;
    UPDATE "courses" SET "audience" = 'all' WHERE "audience" IS NULL;

    CREATE INDEX IF NOT EXISTS "products_audience_idx" ON "products" ("audience");
    CREATE INDEX IF NOT EXISTS "courses_audience_idx" ON "courses" ("audience");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "products_audience_idx";
    DROP INDEX IF EXISTS "courses_audience_idx";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "audience";
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "audience";
    DROP TYPE IF EXISTS "public"."enum_audience";`)
}
