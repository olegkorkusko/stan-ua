import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_color_gallery" ALTER COLUMN "color_id" DROP NOT NULL;
  ALTER TABLE "products" ADD COLUMN "card_image_id" integer;
  ALTER TABLE "products" ADD COLUMN "card_hover_id" integer;
  ALTER TABLE "products" ADD CONSTRAINT "products_card_image_id_media_id_fk" FOREIGN KEY ("card_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_card_hover_id_media_id_fk" FOREIGN KEY ("card_hover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_card_image_idx" ON "products" USING btree ("card_image_id");
  CREATE INDEX "products_card_hover_idx" ON "products" USING btree ("card_hover_id");`)

  /*
    Перенесення вже залитих фото.

    Поле «Фотографії» виконувало три роботи одразу: перший файл ставав
    карткою, другий — наведенням, усі разом — слайдером. Тепер це три різні
    поля, тож стару домовленість треба розкласти по них руками — інакше
    клієнтка відкриє товар і побачить порожнечу замість дванадцяти фото.

    Порядок збережено: кадри лягають у групу без кольору рівно так, як
    стояли в «Фотографіях».
  */
  await db.execute(sql`
    /*
      Спершу прибираємо осиротілі звʼязки масиву — рядки, що вказують на
      групу, якої вже немає. Такі лишаються, якщо групу видалили в адмінці:
      Payload чистить саму групу, а запис у таблиці звʼязків переживає її.
      Без цього наступна вставка лягла б поверх них і подвоїла б кадри.
    */
    DELETE FROM "products_rels" r
    WHERE r."path" LIKE 'colorGallery.%'
      AND NOT EXISTS (
        SELECT 1 FROM "products_color_gallery" g
        WHERE g."_parent_id" = r."parent_id"
          AND g."_order" - 1 = split_part(r."path", '.', 2)::int
      );

    UPDATE "products" p SET
      "card_image_id" = (
        SELECT r."media_id" FROM "products_rels" r
        WHERE r."parent_id" = p."id" AND r."path" = 'images'
        ORDER BY r."order" LIMIT 1
      ),
      "card_hover_id" = (
        SELECT r."media_id" FROM "products_rels" r
        WHERE r."parent_id" = p."id" AND r."path" = 'images'
        ORDER BY r."order" OFFSET 1 LIMIT 1
      );

    -- Одна група без кольору на товар, у кінець наявних груп.
    INSERT INTO "products_color_gallery" ("_order", "_parent_id", "id", "color_id")
    SELECT
      COALESCE((SELECT MAX(g."_order") FROM "products_color_gallery" g WHERE g."_parent_id" = s."parent_id"), 0) + 1,
      s."parent_id",
      substr(md5(random()::text || clock_timestamp()::text || s."parent_id"::text), 1, 24),
      NULL
    FROM (SELECT DISTINCT "parent_id" FROM "products_rels" WHERE "path" = 'images') s;

    -- Самі файли: шлях масиву рахується від позиції групи, тобто _order - 1.
    INSERT INTO "products_rels" ("order", "parent_id", "path", "media_id")
    SELECT r."order", r."parent_id", 'colorGallery.' || (g."_order" - 1) || '.media', r."media_id"
    FROM "products_rels" r
    JOIN "products_color_gallery" g
      ON g."_parent_id" = r."parent_id" AND g."color_id" IS NULL
    WHERE r."path" = 'images';

    DELETE FROM "products_rels" WHERE "path" = 'images';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP CONSTRAINT "products_card_image_id_media_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_card_hover_id_media_id_fk";
  
  DROP INDEX "products_card_image_idx";
  DROP INDEX "products_card_hover_idx";
  ALTER TABLE "products_color_gallery" ALTER COLUMN "color_id" SET NOT NULL;
  ALTER TABLE "products" DROP COLUMN "card_image_id";
  ALTER TABLE "products" DROP COLUMN "card_hover_id";`)
}
