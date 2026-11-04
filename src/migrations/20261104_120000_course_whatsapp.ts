import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
  Посилання на групу WhatsApp у курсі — одна колонка.

  Написано руками з тієї ж причини, що й попередня: генератор порівнює код не з
  прода, а з ТІЄЮ базою, до якої під'єднаний, і дописує в міграцію все, чим вони
  розходяться. У цьому проєкті така міграція вже один раз вийшла з DROP COLUMN
  на поля з іншої гілки.

  IF NOT EXISTS — щоб повторний запуск нічого не ламав.
*/
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "whatsapp_url" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "whatsapp_url";`)
}
