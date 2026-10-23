import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
  Новий спосіб доставки «Інша адреса» — одним значенням до переліку.

  Написано руками, а не згенеровано. Генератор порівнює код із ТІЄЮ базою, до
  якої під'єднаний, а в моїй локальній лежали ще й зміни з гілки закордонних
  цін. Через це він вирішив, що їх треба прибрати, і дописав у цю міграцію
  DROP COLUMN на price_export, export_rate і решту. На проді тих колонок немає
  — деплой упав би на першому ж DROP; а якби гілка з цінами колись злилась,
  міграція тихо знесла б її поля.

  ADD VALUE замість перестворення типу: воно додає значення, нічого не
  чіпаючи, і тому байдуже, які ще значення в переліку вже є. IF NOT EXISTS
  робить міграцію безпечною для повторного запуску.
*/
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_orders_delivery_method" ADD VALUE IF NOT EXISTS 'custom';
    ALTER TYPE "public"."enum_customers_delivery_method" ADD VALUE IF NOT EXISTS 'custom';`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  /*
    Назад не відкочуємо. Прибрати значення з переліку в PostgreSQL не можна
    інакше, ніж перестворивши тип, а це впаде на першому ж замовленні, яке цей
    спосіб уже використало. Зайве значення в переліку нікому не заважає.
  */
}
