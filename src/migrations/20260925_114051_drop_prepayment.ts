import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" DROP COLUMN "prepayment_type";
  ALTER TABLE "settings" DROP COLUMN "prepayment_amount";
  DROP TYPE "public"."enum_settings_prepayment_type";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_settings_prepayment_type" AS ENUM('fixed', 'percent');
  ALTER TABLE "settings" ADD COLUMN "prepayment_type" "enum_settings_prepayment_type" DEFAULT 'fixed';
  ALTER TABLE "settings" ADD COLUMN "prepayment_amount" numeric DEFAULT 200;`)
}
