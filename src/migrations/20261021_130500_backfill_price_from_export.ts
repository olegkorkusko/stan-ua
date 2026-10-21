import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
  Заповнюємо ціну «від» для закордону в товарах, які існували до цієї зміни.

  Поле рахує хук у Products, але він спрацьовує лише при збереженні товару.
  Доти колонка лишалась порожньою — і каталог для закордону мовчки ВИКИДАВ
  такі товари: фільтр «від 1000 ₴» порівнює числа, а NULL не більший і не
  менший за жодне з них. На вигляд це не помилка, а просто коротший список,
  тому знайшлося лише при звірці двох регіонів поруч.

  Порожня закордонна ціна означає «та сама, що й внутрішня», тож беремо
  price_from. Товар, збережений після цього, перерахується хуком.
*/
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "products"
       SET "price_from_export" = COALESCE("price_export", "price_from", "price")
     WHERE "price_from_export" IS NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Назад заповнення не відкочуємо: порожнє поле нічим не краще, а відрізнити
  // проставлене цією міграцією від проставленого хуком уже не можна.
  await db.execute(sql`SELECT 1;`)
}
