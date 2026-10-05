import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_color_gallery" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_color_gallery" CASCADE;
  ALTER TABLE "products" ADD COLUMN "card_image_id" integer;
  ALTER TABLE "products" ADD COLUMN "card_hover_id" integer;
  ALTER TABLE "products" ADD CONSTRAINT "products_card_image_id_media_id_fk" FOREIGN KEY ("card_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_card_hover_id_media_id_fk" FOREIGN KEY ("card_hover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_card_image_idx" ON "products" USING btree ("card_image_id");
  CREATE INDEX "products_card_hover_idx" ON "products" USING btree ("card_hover_id");`)

  /*
    Картка перестала вгадуватись із порядку фотографій.

    Досі перший файл у «Фотографіях» мовчки ставав обкладинкою в каталозі, а
    другий — тим, що показується при наведенні. Ніде, крім коду, це записано
    не було. Тепер поля справжні, тож стару домовленість переносимо в них —
    інакше клієнтка відкриє каталог і побачить порожні картки.

    Самі «Фотографії» лишаються на місці: вони і є слайдером.
  */
  await db.execute(sql`
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

    -- Звʼязки знятого масиву: без них у таблиці лишається сміття, яке
    -- Payload уже не читає, але яке заважає, щойно шлях знадобиться знову.
    DELETE FROM "products_rels" WHERE "path" LIKE 'colorGallery%';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "products_color_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"color_id" integer NOT NULL
  );
  
  ALTER TABLE "products" DROP CONSTRAINT "products_card_image_id_media_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_card_hover_id_media_id_fk";
  
  DROP INDEX "products_card_image_idx";
  DROP INDEX "products_card_hover_idx";
  ALTER TABLE "products_color_gallery" ADD CONSTRAINT "products_color_gallery_color_id_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_color_gallery" ADD CONSTRAINT "products_color_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_color_gallery_order_idx" ON "products_color_gallery" USING btree ("_order");
  CREATE INDEX "products_color_gallery_parent_id_idx" ON "products_color_gallery" USING btree ("_parent_id");
  CREATE INDEX "products_color_gallery_color_idx" ON "products_color_gallery" USING btree ("color_id");
  ALTER TABLE "products" DROP COLUMN "card_image_id";
  ALTER TABLE "products" DROP COLUMN "card_hover_id";`)
}
