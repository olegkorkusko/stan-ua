import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
  «Група у WhatsApp» як спосіб видачі доступу — одне значення в перелік.

  Четвертого значення для «Всі» не додаємо: під ним лишається старе 'both', у
  якого просто змінився підпис. Перейменувати його в базі означало б перестворити
  тип і оновити всі курси, а видно це значення лише коду.

  ADD VALUE, а не перестворення типу: нічого не чіпає й не залежить від того, які
  значення в переліку вже є. IF NOT EXISTS робить повторний запуск безпечним.
*/
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_courses_access_type" ADD VALUE IF NOT EXISTS 'whatsapp';`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  /*
    Назад не відкочуємо: прибрати значення з переліку в PostgreSQL можна лише
    перестворивши тип, а це впаде на першому ж курсі, який його вже використав.
    Зайве значення в переліку нікому не заважає.
  */
}
